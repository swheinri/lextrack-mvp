// app/api/admin/users/update/route.ts
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

function roleNameFromCode(code: string): string {
  switch (code) {
    case 'ADMIN':
      return 'Administrator';
    case 'COMPLIANCE_MANAGER':
      return 'Compliance Manager';
    case 'REQUIREMENT_ENGINEER':
      return 'Requirement Engineer';
    case 'AUDITOR':
      return 'Auditor';
    case 'VIEWER':
      return 'Viewer';
    case 'EXTERNAL':
      return 'External user';
    default:
      return code;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));

  const id = String(body?.id ?? '').trim();
  const roleCode = String(body?.roleCode ?? '').trim().toUpperCase();
  const departmentIdRaw = body?.departmentId;
  const departmentId =
    typeof departmentIdRaw === 'string' && departmentIdRaw.trim()
      ? departmentIdRaw.trim()
      : null;

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Benutzer-ID fehlt.' },
      { status: 400 }
    );
  }

  if (!roleCode) {
    return NextResponse.json(
      { success: false, message: 'Rolle fehlt.' },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: { select: { code: true } },
    },
  });

  if (!target) {
    return NextResponse.json(
      { success: false, message: 'Benutzer wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Die ausgewählte Abteilung wurde nicht gefunden.' },
        { status: 400 }
      );
    }
  }

  if (target.id === auth.userId && roleCode !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Du kannst deine eigene Admin-Rolle nicht entfernen.' },
      { status: 400 }
    );
  }

  if (target.role?.code === 'ADMIN' && roleCode !== 'ADMIN') {
    const activeAdminCount = await prisma.user.count({
      where: {
        isActive: true,
        role: { code: 'ADMIN' },
      },
    });

    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { success: false, message: 'Der letzte aktive Admin darf nicht herabgestuft werden.' },
        { status: 400 }
      );
    }
  }

  const role = await prisma.role.upsert({
    where: { code: roleCode },
    update: {
      name: roleNameFromCode(roleCode),
      isActive: true,
    },
    create: {
      code: roleCode,
      name: roleNameFromCode(roleCode),
      description: roleCode === 'ADMIN' ? 'Systemrolle' : 'Benutzerrolle',
      isActive: true,
      isSystem: roleCode === 'ADMIN',
    },
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: {
        roleId: role.id,
        isActive: true,
      },
    }),

    prisma.person.upsert({
      where: { email: target.email },
      update: {
        roleId: role.id,
        departmentId,
        userId: target.id,
      },
      create: {
        email: target.email,
        firstName: target.email,
        lastName: null,
        status: 'ACTIVE',
        roleId: role.id,
        departmentId,
        userId: target.id,
        acceptedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: 'Benutzer wurde aktualisiert.',
  });
}