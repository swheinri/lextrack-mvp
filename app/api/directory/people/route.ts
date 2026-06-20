// app/api/directory/people/route.ts
import { NextResponse } from 'next/server';
import { Prisma, PersonStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function pickOptionalString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function pickRequiredString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

function normalizePersonStatus(v: unknown): PersonStatus | undefined {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return undefined;

  if (s === 'ACTIVE') return PersonStatus.ACTIVE;
  if (s === 'INACTIVE') return PersonStatus.INACTIVE;

  // tolerant: "active" / "inactive"
  if (s === 'AKTIV' || s === 'AKTIVE' || s === 'ACTIVE ') return PersonStatus.ACTIVE;
  if (s === 'INAKTIV' || s === 'INACTIVE ') return PersonStatus.INACTIVE;

  return undefined;
}

/* -------------------- GET -------------------- */
export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      department: { include: { location: true } },
      role: true,
    },
  });

  return NextResponse.json({ success: true, people });
}

/* -------------------- POST -------------------- */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError(400, 'Invalid JSON body');

  const firstName = pickRequiredString((body as any).firstName);
  const lastName = pickOptionalString((body as any).lastName);
  const email = pickRequiredString((body as any).email);

  const departmentId = pickOptionalString((body as any).departmentId);

  // ✅ neu: roleId oder roleCode
  const roleIdRaw = pickOptionalString((body as any).roleId);
  const roleCodeRaw = pickOptionalString((body as any).roleCode);

  const status = normalizePersonStatus((body as any).status) ?? PersonStatus.ACTIVE;

  if (!firstName) return jsonError(400, 'Missing field: firstName');
  if (!email) return jsonError(400, 'Missing field: email');

  // roleId auflösen
  let roleId = roleIdRaw;

  if (!roleId) {
    if (!roleCodeRaw) {
      return jsonError(400, 'Missing field: roleId', {
        hint: 'Provide roleId OR roleCode (e.g. "ADMIN")',
      });
    }

    const role = await prisma.role.findUnique({
      where: { code: roleCodeRaw.toUpperCase() },
      select: { id: true },
    });

    if (!role) {
      return jsonError(400, 'Unknown roleCode', {
        roleCode: roleCodeRaw,
        hint: 'Use an existing Role.code from DB (e.g. ADMIN)',
      });
    }

    roleId = role.id;
  }

  try {
    const person = await prisma.person.create({
      data: {
        firstName,
        lastName: lastName ?? null,
        email,
        status,
        role: { connect: { id: roleId } },
        ...(departmentId ? { department: { connect: { id: departmentId } } } : {}),
      },
      include: {
        department: { include: { location: true } },
        role: true,
      },
    });

    return NextResponse.json({ success: true, person });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return jsonError(409, 'Conflict: unique constraint', { code: e.code });
    }
    return jsonError(500, 'Create failed');
  }
}