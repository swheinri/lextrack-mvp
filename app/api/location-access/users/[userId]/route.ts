import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import { requireAuthenticatedUser } from '@/app/lib/location-access';

export const runtime = 'nodejs';

const ALLOWED_ACCESS_LEVELS = new Set([
  'READ',
  'CONTRIBUTE',
  'RESPONSIBLE',
  'ADMIN',
]);

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(extra ?? {}),
    },
    { status }
  );
}

function getUserIdFromParams(params: unknown) {
  const value = (params as { userId?: unknown })?.userId;
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAccessLevel(value: unknown) {
  const text = String(value ?? '').trim().toUpperCase();

  if (!ALLOWED_ACCESS_LEVELS.has(text)) {
    return null;
  }

  return text as 'READ' | 'CONTRIBUTE' | 'RESPONSIBLE' | 'ADMIN';
}

async function requireCentralAccess(req: Request) {
  const auth = await requireAuthenticatedUser(req);

  if (!auth.ok) {
    return auth;
  }

  if (!auth.user.isCentralRole) {
    return {
      ok: false as const,
      res: jsonError('Forbidden.', 403),
    };
  }

  return auth;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireCentralAccess(req);
  if (!auth.ok) return auth.res;

  const params = await context.params;
  const userId = getUserIdFromParams(params);

  if (!userId) {
    return jsonError('UserId fehlt.', 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: {
        select: {
          code: true,
          name: true,
        },
      },
      locationAccesses: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          locationId: true,
          accessLevel: true,
          isActive: true,
          location: {
            select: {
              id: true,
              name: true,
              kuerzel: true,
              type: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return jsonError('User nicht gefunden.', 404);
  }

  return NextResponse.json({
    success: true,
    user,
  });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireCentralAccess(req);
  if (!auth.ok) return auth.res;

  const params = await context.params;
  const userId = getUserIdFromParams(params);

  if (!userId) {
    return jsonError('UserId fehlt.', 400);
  }

  const body = await req.json().catch(() => ({}));
  const entries = Array.isArray(body?.accesses) ? body.accesses : null;

  if (!entries) {
    return jsonError('accesses muss ein Array sein.', 400, {
      expectedShape: {
        accesses: [
          {
            locationId: 'string',
            accessLevel: 'READ | CONTRIBUTE | RESPONSIBLE | ADMIN',
          },
        ],
      },
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });

  if (!targetUser) {
    return jsonError('User nicht gefunden.', 404);
  }

  const normalizedEntries: Array<{
    locationId: string;
    accessLevel: 'READ' | 'CONTRIBUTE' | 'RESPONSIBLE' | 'ADMIN' | null;
  }> = entries.map((entry: unknown) => {
    const raw = entry as {
      locationId?: unknown;
      accessLevel?: unknown;
    };

    return {
      locationId: String(raw?.locationId ?? '').trim(),
      accessLevel: normalizeAccessLevel(raw?.accessLevel),
    };
  });

  const invalidEntry = normalizedEntries.find(
    (entry) => !entry.locationId || !entry.accessLevel
  );

  if (invalidEntry) {
    return jsonError('Ungueltiger Standortzugriff.', 400, {
      allowedAccessLevels: Array.from(ALLOWED_ACCESS_LEVELS),
    });
  }

  const uniqueLocationIds = Array.from(
    new Set(normalizedEntries.map((entry) => entry.locationId))
  );

  if (uniqueLocationIds.length !== normalizedEntries.length) {
    return jsonError('locationId darf nicht mehrfach vorkommen.', 400);
  }

  const existingLocations = await prisma.location.findMany({
    where: {
      id: {
        in: uniqueLocationIds,
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const existingLocationIds = new Set(existingLocations.map((location) => location.id));
  const missingLocationIds = uniqueLocationIds.filter(
    (locationId) => !existingLocationIds.has(locationId)
  );

  if (missingLocationIds.length > 0) {
    return jsonError('Mindestens ein Standort wurde nicht gefunden oder ist inaktiv.', 400, {
      missingLocationIds,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.userLocationAccess.deleteMany({
      where: {
        userId,
      },
    });

    if (normalizedEntries.length > 0) {
      await tx.userLocationAccess.createMany({
        data: normalizedEntries.map((entry) => ({
          userId,
          locationId: entry.locationId,
          accessLevel: entry.accessLevel!,
          isActive: true,
        })),
      });
    }

    return tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
        locationAccesses: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            locationId: true,
            accessLevel: true,
            isActive: true,
            location: {
              select: {
                id: true,
                name: true,
                kuerzel: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  });

  return NextResponse.json({
    success: true,
    user: result,
  });
}
