// app/api/auth/request-password-reset/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { sendPasswordResetEmail } from '@/app/lib/mailer';
import { hashToken } from '@/app/lib/token-hash';

export const runtime = 'nodejs';

const EXPIRES_MINUTES = 60;

// ✅ Anti-Spam / Anti-Bruteforce
const WINDOW_MINUTES = 60;
const MAX_PER_WINDOW = 5;
// optionaler Mini-Cooldown (hilft gegen “Spam-Klickerei”)
const COOLDOWN_SECONDS = 120; // 2 Minuten

function baseUrl(): string {
  const url =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  // Generische Antwort (kein User-Enumeration)
  const okResponse = NextResponse.json({
    success: true,
    message: 'Wenn ein Account existiert, wurde der Reset-Prozess gestartet.',
  });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) return okResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) return okResponse;

    const now = new Date();

    // 1) Cooldown (optional)
    const last = await prisma.authToken.findFirst({
      where: { userId: user.id, type: 'RESET' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (last) {
      const diffMs = now.getTime() - last.createdAt.getTime();
      if (diffMs < COOLDOWN_SECONDS * 1000) return okResponse;
    }

    // 2) Rate Limit: max 5 / 60min
    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);
    const count = await prisma.authToken.count({
      where: { userId: user.id, type: 'RESET', createdAt: { gte: windowStart } },
    });

    if (count >= MAX_PER_WINDOW) return okResponse;

    // 3) Vorherige ungenutzte Reset-Tokens invalidieren (aber NICHT löschen, sonst klappt RateLimit nicht)
    await prisma.authToken.updateMany({
      where: { userId: user.id, type: 'RESET', usedAt: null },
      data: { usedAt: now },
    });

    // 4) Token erzeugen (plain) + nur Hash speichern
    const plainToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(now.getTime() + EXPIRES_MINUTES * 60 * 1000);

    await prisma.authToken.create({
      data: { token: tokenHash, type: 'RESET', expiresAt, userId: user.id },
    });

    const resetUrl = `${baseUrl()}/set-password?token=${encodeURIComponent(plainToken)}`;

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: EXPIRES_MINUTES,
    });

    return okResponse;
  } catch (e) {
    console.error('[request-password-reset] failed:', e);
    return okResponse;
  }
}