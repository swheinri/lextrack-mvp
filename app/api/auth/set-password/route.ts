// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

function isStrongPassword(pw: string) {
  return typeof pw === 'string' && pw.trim().length >= 10;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? '').trim();
  const password = String(body?.password ?? '');

  if (!token || !isStrongPassword(password)) {
    return NextResponse.json(
      { success: false, message: 'Token oder Passwort ungültig (mind. 10 Zeichen).' },
      { status: 400 }
    );
  }

  const now = new Date();

  // Token prüfen
  const authToken = await prisma.authToken.findFirst({
    where: {
      token,
      type: 'RESET',
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });

  if (!authToken || !authToken.user || !authToken.user.isActive) {
    return NextResponse.json(
      { success: false, message: 'Reset-Link ist ungültig oder abgelaufen.' },
      { status: 400 }
    );
  }

  // Passwort setzen
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authToken.userId },
      data: { passwordHash },
    }),
    prisma.authToken.update({
      where: { token: authToken.token },
      data: { usedAt: now },
    }),
    prisma.authToken.deleteMany({
      where: { userId: authToken.userId, type: 'RESET', usedAt: null },
    }),
  ]);

  return NextResponse.json({ success: true });
}