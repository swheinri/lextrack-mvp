// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/app/lib/prisma';
import { hashToken } from '@/app/lib/token-hash';
import { validatePassword } from '@/app/lib/password-policy';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? '').trim();
  const password = String(body?.password ?? '');

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token fehlt.' },
      { status: 400 }
    );
  }

  const pw = validatePassword(password);

  if (!pw.ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Passwort erfüllt die Anforderungen nicht.',
        details: pw.reasons,
      },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  try {
    const t = await prisma.authToken.findUnique({
      where: { token: tokenHash },
      select: {
        token: true,
        type: true,
        expiresAt: true,
        usedAt: true,
        userId: true,
      },
    });

    if (
      !t ||
      (t.type !== 'RESET' && t.type !== 'INVITE') ||
      t.usedAt ||
      t.expiresAt <= now
    ) {
      return NextResponse.json(
        { success: false, message: 'Token ungültig oder abgelaufen.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: t.userId },
        data: {
          passwordHash,
          isActive: true,
        },
      }),

      prisma.authToken.update({
        where: { token: tokenHash },
        data: { usedAt: now },
      }),

prisma.person.updateMany({
  where: { userId: t.userId },
  data: {
    status: 'ACTIVE',
    acceptedAt: now,
  },
}),

      // Andere offene RESET-Tokens dieses Users invalidieren
      prisma.authToken.deleteMany({
        where: {
          userId: t.userId,
          type: 'RESET',
          usedAt: null,
          token: { not: tokenHash },
        },
      }),

      // Andere offene INVITE-Tokens dieses Users invalidieren
      prisma.authToken.deleteMany({
        where: {
          userId: t.userId,
          type: 'INVITE',
          usedAt: null,
          token: { not: tokenHash },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      type: t.type,
    });
  } catch (e) {
    console.error('[set-password] failed:', e);

    return NextResponse.json(
      { success: false, message: 'Passwort konnte nicht gesetzt werden.' },
      { status: 500 }
    );
  }
}