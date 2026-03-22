// middleware.ts (im Projekt-Root)  <-- Datei heißt bei dir proxy.ts, Kommentar ist ok
import { NextRequest, NextResponse } from 'next/server';

// Seiten, die ohne Login erreichbar sein sollen
const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/forgot-password',        // ✅ neu
  '/set-password',           // ✅ neu
  '/impressum',
  '/datenschutz',
  '/api/login',
  '/api/auth',               // ✅ neu: NextAuth + PW-Reset APIs (alle /api/auth/*)
]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next.js-Assets & Bilder immer durchlassen
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ✅ Auth-API immer durchlassen (alles unter /api/auth/*)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Öffentliche Seiten immer durchlassen
  // ✅ auch Subpaths erlauben (z.B. /api/auth/..., /set-password/...)
  for (const p of PUBLIC_PATHS) {
    if (pathname === p || pathname.startsWith(p + '/')) {
      return NextResponse.next();
    }
  }

  // Auth-Cookie prüfen – Name muss zu /api/login passen
  const authCookie = req.cookies.get('lextrack_auth');
  const isLoggedIn = !!authCookie;

  // Wenn NICHT eingeloggt → auf /login umleiten
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname); // optional
    return NextResponse.redirect(loginUrl);
  }

  // Optional: Eingeloggte sollen /login nicht sehen
  if (pathname === '/login') {
    const targetUrl = req.nextUrl.clone();
    targetUrl.pathname = '/dashboard';
    targetUrl.searchParams.delete('from');
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
