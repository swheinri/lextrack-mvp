// app/api/directory/locations/[id]/lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...(extra ?? {}) }, { status });
}

async function readId(ctx: Ctx): Promise<string> {
  const params = await ctx.params;
  return String(params?.id ?? '').trim();
}

function pickPersonId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

const locationInclude = {
  addresses: {
    orderBy: [
      { isPrimary: 'desc' as const },
      { createdAt: 'asc' as const },
    ],
  },
  leadPerson: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      departmentId: true,
      teamId: true,
    },
  },
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const id = await readId(ctx);
  if (!id) return jsonError(400, 'Missing id');

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return jsonError(400, 'Invalid JSON body');
  }

  const personId = pickPersonId((body as any).personId);

  if (personId === undefined) {
    return jsonError(400, 'Invalid field: personId must be string or null');
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id },
      select: { id: true, name: true, kuerzel: true },
    });

    if (!location) {
      return jsonError(404, 'Location not found');
    }

    if (personId) {
      const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
          department: {
            select: {
              id: true,
              locationId: true,
            },
          },
          team: {
            select: {
              id: true,
              department: {
                select: {
                  id: true,
                  locationId: true,
                },
              },
            },
          },
        },
      });

      if (!person) {
        return jsonError(404, 'Person not found');
      }

      const personLocationId =
        person.team?.department?.locationId ??
        person.department?.locationId ??
        null;

      if (personLocationId !== id) {
        return jsonError(400, 'Person is not assigned to this location');
      }
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        leadPersonId: personId,
      },
      include: locationInclude,
    });

    return NextResponse.json({
      success: true,
      location: updated,
      message: personId
        ? 'Location lead has been saved.'
        : 'Location lead has been cleared.',
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return jsonError(500, 'Location lead update failed', { code: error.code });
    }

    return jsonError(500, 'Location lead update failed');
  }
}
