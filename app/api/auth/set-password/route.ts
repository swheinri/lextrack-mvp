// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashToken } from '@/app/lib/token-hash';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const POLICY = {
  minLen: 10,
  minDigits: 1,
  minSpecial: 1,
};

function countMatches(value: string, re: RegExp): number {
  const m = value.match(re);
  return m ? m.length : 0;
}

function validatePassword(pw: string) {
  const s = String(pw ?? '');
  const lengthOk = s.length >= POLICY.minLen;
  const upperOk = /[A-Z]/.test(s);
  const lowerOk = /[a-z]/.test(s);
  const digitCount = countMatches(s, /\d/g);
  const digitsOk = digitCount >= POLICY.minDigits;
  const specialCount = countMatches(s, /[^A-Za-z0-9]/g);
  const specialOk = specialCount >= POLICY.minSpecial;

  const ok = lengthOk && upperOk && lowerOk && digitsOk && specialOk;

  return {
    ok,
    details: [
      !lengthOk ? `mind. ${POLICY.minLen} Zeichen` : null,
      !upperOk ? 'mind. 1 Großbuchstabe' : null,
      !lowerOk ? 'mind. 1 Kleinbuchstabe' : null,
      !digitsOk ? `mind. ${POLICY.minDigits} Zahl` : null,
      !specialOk ? `mind. ${POLICY.minSpecial} Sonderzeichen` : null,
    ].filter(Boolean) as string[],
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plainToken = String(body?.token ?? '').trim();
  const password = String(body?.password ?? '');

  if (!plainToken) {
    return NextResponse.json(
      { success: false, message: 'Token fehlt.' },
      { status: 400 }
    );
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Passwort erfüllt die Anforderungen nicht.',
        details: pwCheck.details,
      },
      { status: 400 }
    );
  }

  try {
    const tokenHash = hashToken(plainToken);
    const now = new Date();

    const tokenRow = await prisma.authToken.findFirst({
      where: {
        token: tokenHash,
        type: 'RESET',
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!tokenRow || !tokenRow.user?.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dieser Reset-Link ist ungültig, abgelaufen oder wurde bereits benutzt.',
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRow.userId },
        data: { passwordHash },
      }),
      prisma.authToken.update({
        where: { token: tokenRow.token },
        data: { usedAt: now },
      }),
      // optional: alle anderen offenen Reset-Tokens ebenfalls invalidieren
      prisma.authToken.updateMany({
        where: { userId: tokenRow.userId, type: 'RESET', usedAt: null },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[set-password] failed:', e);
    return NextResponse.json(
      { success: false, message: 'Passwort konnte nicht gesetzt werden.' },
      { status: 500 }
    );
  }
}