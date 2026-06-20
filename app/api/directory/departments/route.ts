// app/api/directory/departments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

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

function pickCuid(v: unknown): string | undefined {
  const s = pickString(v);
  return s || undefined;
}

/* -------------------- GET (list) -------------------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = pickString(searchParams.get('locationId')); // optional filter
  const isActiveRaw = searchParams.get('isActive');

  let isActive: boolean | undefined;
  if (isActiveRaw != null) {
    if (isActiveRaw === 'true') isActive = true;
    else if (isActiveRaw === 'false') isActive = false;
  }

  const where: Prisma.DepartmentWhereInput = {};
  if (locationId) where.locationId = locationId;
  if (isActive !== undefined) where.isActive = isActive;

  const departments = await prisma.department.findMany({
    where,
    orderBy: [{ name: 'asc' }],
    include: {
      location: true, // hilfreich für UI
    },
  });

  return NextResponse.json({ success: true, departments });
}

/* -------------------- POST (create) -------------------- */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError(400, 'Invalid JSON body');

  const name = pickString((body as any).name);
  const kuerzel = pickStringOrNull((body as any).kuerzel);
  const description = pickStringOrNull((body as any).description);
  const isActive = pickBool((body as any).isActive) ?? true;

  // locationId ist Pflicht (weil Department.location required)
  const locationId = pickCuid((body as any).locationId);
  if (!locationId) {
    return jsonError(400, 'Missing required field: locationId', {
      required: ['name', 'locationId'],
      allowed: ['name', 'kuerzel', 'description', 'isActive', 'locationId'],
    });
  }

  if (!name) {
    return jsonError(400, 'Missing required field: name', {
      required: ['name', 'locationId'],
    });
  }

  try {
    // optional: check location exists (sauberere Fehlermeldung als Prisma)
    const loc = await prisma.location.findUnique({ where: { id: locationId } });
    if (!loc) return jsonError(404, 'Location not found', { locationId });

    const department = await prisma.department.create({
      data: {
        name,
        kuerzel: kuerzel ?? null,
        description: description ?? null,
        isActive,
        location: { connect: { id: locationId } },
      },
      include: { location: true },
    });

    return NextResponse.json({ success: true, department });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return jsonError(409, 'Conflict: unique constraint', { code: e.code });
      if (e.code === 'P2003') return jsonError(409, 'Conflict: foreign key (locationId)', { code: e.code });
    }
    return jsonError(500, 'Create failed');
  }
}