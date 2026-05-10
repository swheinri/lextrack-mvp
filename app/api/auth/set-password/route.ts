// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const POLICY = {
  minLen: 10,
  minSpecial: 1,
  minDigits: 1,
};

function countSpecialChars(pw: string) {
  const m = pw.match(/[^A-Za-z0-9]/g);
  return m ? m.length : 0;
}

function countDigits(pw: string) {
  const m = pw.match(/\d/g);
  return m ? m.length : 0;
}

function validatePassword(pw: string) {
  const p = String(pw ?? '');

  const lengthOk = p.length >= POLICY.minLen;
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const digitCount = countDigits(p);
  const digitsOk = digitCount >= POLICY.minDigits;
  const specialCount = countSpecialChars(p);
  const specialOk = specialCount >= POLICY.minSpecial;

  const errors: string[] = [];
  if (!lengthOk) errors.push(`Mindestens ${POLICY.minLen} Zeichen`);
  if (!hasUpper) errors.push('Mindestens 1 Großbuchstabe (A-Z)');
  if (!hasLower) errors.push('Mindestens 1 Kleinbuchstabe (a-z)');
  if (!digitsOk) errors.push(`Mindestens ${POLICY.minDigits} Zahl (0-9)`);
  if (!specialOk)
    errors.push(`Mindestens ${POLICY.minSpecial} Sonderzeichen (z. B. ! ? # @ _)`);

  return { ok: errors.length === 0, errors };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? '').trim();
  const password = String(body?.password ?? '');

  if (!token) {
    return NextResponse.json({ success: false, message: 'Token fehlt.' }, { status: 400 });
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Passwort erfüllt die Anforderungen nicht.',
        details: pwCheck.errors,
      },
      { status: 400 }
    );
  }

  const now = new Date();

  const authToken = await prisma.authToken.findFirst({
    where: {
      token,
      type: 'RESET',
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: { select: { id: true, isActive: true } } },
  });

  if (!authToken || !authToken.user || !authToken.user.isActive) {
    return NextResponse.json(
      { success: false, message: 'Reset-Link ist ungültig oder abgelaufen.' },
      { status: 400 }
    );
  }

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