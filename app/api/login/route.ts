// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

const AUTH_COOKIE_NAME = 'lextrack_auth';

type LoginBody = {
  email?: string;
  password?: string;
};

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Ungültige Anfrage.' },
      { status: 400 }
    );
  }

  const email = normalizeEmail(body.email ?? '');
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Bitte E-Mail und Passwort eingeben.' },
      { status: 400 }
    );
  }

  // Generische Fehlermeldung (kein Leak ob E-Mail existiert)
  const invalid = () =>
    NextResponse.json(
      { success: false, message: 'Ungültige Zugangsdaten.' },
      { status: 401 }
    );

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        isActive: true,
        passwordHash: true,
        role: { select: { code: true } },
      },
    });

    if (!user || !user.isActive || !user.passwordHash) return invalid();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid();

    const res = NextResponse.json({ success: true, role: user.role?.code ?? 'VIEWER' });

    // Cookie reicht für deinen Proxy (nur "vorhanden" zählt)
    res.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 Stunden
    });

    return res;
  } catch (e) {
    console.error('[login] failed:', e);
    return NextResponse.json(
      { success: false, message: 'Technischer Fehler.' },
      { status: 500 }
    );
  }
}