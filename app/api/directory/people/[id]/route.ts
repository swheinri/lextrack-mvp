// app/api/directory/people/[id]/route.ts
import { NextResponse } from 'next/server';
import { Prisma, PersonStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return null;
  return body as Record<string, unknown>;
}

function pickNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function pickNullableString(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : null;
}

function pickPersonStatus(v: unknown): PersonStatus | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toUpperCase();
  if (s === 'ACTIVE') return PersonStatus.ACTIVE;
  if (s === 'INACTIVE') return PersonStatus.INACTIVE;

  const low = String(v).trim().toLowerCase();
  if (low === 'active') return PersonStatus.ACTIVE;
  if (low === 'inactive') return PersonStatus.INACTIVE;

  return undefined;
}

/* -------------------- GET -------------------- */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  const person = await prisma.person.findUnique({
    where: { id },
    include: { department: true, role: true },
  });

  if (!person) return jsonError(404, 'Not found');
  return NextResponse.json({ success: true, person });
}

/* -------------------- PATCH -------------------- */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  const body = await readJson(req);
  if (!body) return jsonError(400, 'Invalid JSON body');

  const firstName = pickNonEmptyString(body.firstName);
  const lastName = pickNullableString(body.lastName);
  const email = pickNonEmptyString(body.email);

  const status = pickPersonStatus(body.status);

  // Relations:
  // - string => connect
  // - null   => disconnect (nur wenn Relation optional ist)
  // - undefined => ignore
  const departmentIdRaw = body.departmentId;
  const roleIdRaw = body.roleId;

  const hasAny =
    firstName !== undefined ||
    lastName !== undefined ||
    email !== undefined ||
    status !== undefined ||
    departmentIdRaw !== undefined ||
    roleIdRaw !== undefined;

  if (!hasAny) {
    return jsonError(400, 'No fields provided', {
      allowed: ['firstName', 'lastName', 'email', 'status', 'departmentId', 'roleId'],
    });
  }

  const data: Prisma.PersonUpdateInput = {};

  if (firstName !== undefined) data.firstName = { set: firstName };
  if (lastName !== undefined) data.lastName = { set: lastName }; // lastName ist nullable -> string | null ok
  if (email !== undefined) data.email = { set: email };
  if (status !== undefined) data.status = { set: status };

  // department relation
  if (departmentIdRaw !== undefined) {
    if (departmentIdRaw === null) {
      // nur möglich, wenn department optional ist
      data.department = { disconnect: true };
    } else {
      const depId = pickNonEmptyString(departmentIdRaw);
      if (!depId) return jsonError(400, 'departmentId must be a non-empty string or null');
      data.department = { connect: { id: depId } };
    }
  }

  // role relation
  if (roleIdRaw !== undefined) {
    if (roleIdRaw === null) {
      // nur möglich, wenn role optional ist
      data.role = { disconnect: true };
    } else {
      const rId = pickNonEmptyString(roleIdRaw);
      if (!rId) return jsonError(400, 'roleId must be a non-empty string or null');
      data.role = { connect: { id: rId } };
    }
  }

  try {
    const person = await prisma.person.update({
      where: { id },
      data,
      include: { department: true, role: true },
    });
    return NextResponse.json({ success: true, person });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return jsonError(409, 'Conflict: unique constraint', { code: e.code });
    }
    return jsonError(500, 'Update failed');
  }
}

/* -------------------- DELETE -------------------- */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  try {
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError(500, 'Delete failed');
  }
}