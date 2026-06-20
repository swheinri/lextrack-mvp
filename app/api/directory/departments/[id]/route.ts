// app/api/directory/departments/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function pickString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function pickStringOrNull(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : null;
}

function pickBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

/* -------------------- GET -------------------- */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  const department = await prisma.department.findUnique({
    where: { id },
    include: { location: true },
  });
  if (!department) return jsonError(404, 'Not found');

  return NextResponse.json({ success: true, department });
}

/* -------------------- PATCH -------------------- */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError(400, 'Invalid JSON body');

  const name = pickString((body as any).name);
  const kuerzel = pickStringOrNull((body as any).kuerzel);
  const description = pickStringOrNull((body as any).description);
  const isActive = pickBool((body as any).isActive);

  const locationIdRaw = (body as any).locationId;
  const locationId = pickString(locationIdRaw);

  const hasAny =
    name !== undefined ||
    kuerzel !== undefined ||
    description !== undefined ||
    isActive !== undefined ||
    locationId !== undefined;

  if (!hasAny) {
    return jsonError(400, 'No fields provided', {
      allowed: ['name', 'kuerzel', 'description', 'isActive', 'locationId'],
    });
  }

  const data: Prisma.DepartmentUpdateInput = {};

  if (name !== undefined) data.name = { set: name };
  if (kuerzel !== undefined) data.kuerzel = { set: kuerzel };
  if (description !== undefined) data.description = { set: description };
  if (isActive !== undefined) data.isActive = { set: isActive };

  if (locationId !== undefined) {
    // Relation required → nur connect, kein disconnect
    const loc = await prisma.location.findUnique({ where: { id: locationId } });
    if (!loc) return jsonError(404, 'Location not found', { locationId });

    data.location = { connect: { id: locationId } };
  }

  try {
    const department = await prisma.department.update({
      where: { id },
      data,
      include: { location: true },
    });

    return NextResponse.json({ success: true, department });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return jsonError(409, 'Conflict: unique constraint', { code: e.code });
      if (e.code === 'P2003') return jsonError(409, 'Conflict: foreign key', { code: e.code });
      if (e.code === 'P2025') return jsonError(404, 'Not found', { code: e.code });
    }
    return jsonError(500, 'Update failed');
  }
}

/* -------------------- DELETE -------------------- */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, 'Missing id');

  try {
    // People hängen optional dran (departmentId ist nullable), Prisma setzt null (onDelete: SetNull)
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return jsonError(404, 'Not found', { code: e.code });
    }
    return jsonError(500, 'Delete failed');
  }
}