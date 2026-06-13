// app/api/admin/users/route.ts
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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          code: true,
          name: true,
        },
      },
      person: {
        select: {
          orgFunction: true,
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          invitedAt: true,
          acceptedAt: true,
          lastInvitedAt: true,
          department: {
            select: {
              id: true,
              name: true,
              kuerzel: true,
              location: {
                select: {
                  id: true,
                  name: true,
                  kuerzel: true,
                },
              },
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              kuerzel: true,
              departmentId: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    users,
  });
}