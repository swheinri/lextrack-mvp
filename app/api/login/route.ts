// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const DEMO_USER = {
  email: 'admin@lextrack.local',
  password: 'lex#track#20#25!',
};

const AUTH_COOKIE_NAME = 'lextrack_auth';

type LoginBody = {
  email?: string;
  password?: string;
};

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

  const email = body.email?.trim() || '';
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Bitte E-Mail und Passwort eingeben.' },
      { status: 400 }
    );
  }

  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    // Absichtlich generische Fehlermeldung (kein Hinweis, ob E-Mail oder Passwort falsch war)
    return NextResponse.json(
      { success: false, message: 'Ungültige Zugangsdaten.' },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ success: true });

  // Einfaches Demo-Session-Cookie – für Produktion später durch JWT/Session ersetzen
  res.cookies.set(AUTH_COOKIE_NAME, 'demo-session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 Stunden
  });

  return res;
}
