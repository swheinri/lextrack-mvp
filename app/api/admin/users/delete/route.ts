// app/api/admin/users/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

import { prisma } from '@/app/lib/prisma';
import { getAuthCookieName } from '@/app/lib/session';

export const runtime = 'nodejs';

function getJwtSecretBytes(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    '';

  return new TextEncoder().encode(raw);
}

async function requireAdmin(req: NextRequest) {
  const cookieName = getAuthCookieName();
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Nicht angemeldet.' },
        { status: 401 }
      ),
    };
  }

  const secret = getJwtSecretBytes();

  if (!secret || secret.length === 0) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Server-Konfiguration fehlt (AUTH_SECRET).' },
        { status: 500 }
      ),
    };
  }

  let userId = '';

  try {
    const verified = await jwtVerify(token, secret);
    const payload: any = verified.payload;
    userId = String(payload?.userId ?? payload?.sub ?? '').trim();
  } catch {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Session ungültig.' },
        { status: 401 }
      ),
    };
  }

  if (!userId) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Session ungültig.' },
        { status: 401 }
      ),
    };
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      role: { select: { code: true } },
    },
  });

  if (!me || !me.isActive) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Nicht angemeldet.' },
        { status: 401 }
      ),
    };
  }

  if (me.role?.code !== 'ADMIN') {
    return {
      ok: false as const,
      res: NextResponse.json(
        { success: false, message: 'Forbidden.' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, userId };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));

  const id = String(body?.id ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();

  if (!id && !email) {
    return NextResponse.json(
      { success: false, message: 'Benutzer-ID oder E-Mail fehlt.' },
      { status: 400 }
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: 'Ungültige E-Mail-Adresse.' },
      { status: 400 }
    );
  }

  const target = await prisma.user.findFirst({
    where: id ? { id } : { email },
    select: {
      id: true,
      email: true,
      role: { select: { code: true } },
    },
  });

  if (!target) {
    if (email) {
      await prisma.person.deleteMany({
        where: { email },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Kein Login-Benutzer gefunden. Eventuelle Directory-Person wurde entfernt.',
    });
  }

  if (target.id === auth.userId) {
    return NextResponse.json(
      { success: false, message: 'Du kannst deinen eigenen Benutzer nicht löschen.' },
      { status: 400 }
    );
  }

  if (target.role?.code === 'ADMIN') {
    const activeAdminCount = await prisma.user.count({
      where: {
        isActive: true,
        role: { code: 'ADMIN' },
      },
    });

    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { success: false, message: 'Der letzte aktive Admin kann nicht gelöscht werden.' },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction([
    prisma.authToken.deleteMany({
      where: { userId: target.id },
    }),

    prisma.person.deleteMany({
      where: {
        OR: [
          { userId: target.id },
          { email: target.email },
        ],
      },
    }),

    prisma.user.delete({
      where: { id: target.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: 'Benutzer wurde gelöscht. Die E-Mail-Adresse ist wieder frei.',
  });
}