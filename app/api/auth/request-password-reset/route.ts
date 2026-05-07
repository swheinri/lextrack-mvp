import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { sendPasswordResetEmail } from '@/app/lib/mailer';

export const runtime = 'nodejs';

const EXPIRES_MINUTES = 60;

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

    await prisma.authToken.deleteMany({
      where: { userId: user.id, type: 'RESET' },
    });

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

    await prisma.authToken.create({
      data: { token, type: 'RESET', expiresAt, userId: user.id },
    });

    const resetUrl = `${baseUrl()}/set-password?token=${encodeURIComponent(token)}`;

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