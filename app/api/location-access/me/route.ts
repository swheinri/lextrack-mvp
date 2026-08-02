import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import {
  getUserLocationAccess,
  requireAuthenticatedUser,
} from '@/app/lib/location-access';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);

  if (!auth.ok) {
    return auth.res;
  }

  const user = auth.user;

  if (user.isCentralRole) {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        kuerzel: true,
        type: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        roleCode: user.roleCode,
        isCentralRole: user.isCentralRole,
      },
      accessScope: 'ALL',
      allowedLocationIds: null,
      locations,
    });
  }

  const accessRows = await getUserLocationAccess(user);

  const locationIds = accessRows.map((entry) => entry.locationId);

  const locations = locationIds.length
    ? await prisma.location.findMany({
        where: {
          id: {
            in: locationIds,
          },
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          kuerzel: true,
          type: true,
          isActive: true,
        },
      })
    : [];

  const accessByLocationId = new Map(
    accessRows.map((entry) => [entry.locationId, entry.accessLevel])
  );

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      roleCode: user.roleCode,
      isCentralRole: user.isCentralRole,
    },
    accessScope: 'LIMITED',
    allowedLocationIds: locationIds,
    locations: locations.map((location) => ({
      ...location,
      accessLevel: accessByLocationId.get(location.id) ?? 'READ',
    })),
  });
}
