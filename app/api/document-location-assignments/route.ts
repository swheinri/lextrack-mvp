import { NextResponse } from 'next/server';
import { AssignmentStatus } from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import {
  getAllowedLocationIds,
  requireAuthenticatedUser,
} from '@/app/lib/location-access';

export const runtime = 'nodejs';

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

function normalizeAssignmentStatus(value: unknown): AssignmentStatus {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(AssignmentStatus).includes(text as AssignmentStatus)) {
    return text as AssignmentStatus;
  }

  return AssignmentStatus.ASSIGNED;
}

type DateParseResult =
  | {
      ok: true;
      value: Date | null;
    }
  | {
      ok: false;
      field: string;
    };

function parseOptionalDate(value: unknown, field: string): DateParseResult {
  if (value === null || value === undefined) {
    return {
      ok: true,
      value: null,
    };
  }

  const text = String(value).trim();

  if (!text) {
    return {
      ok: true,
      value: null,
    };
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      field,
    };
  }

  return {
    ok: true,
    value: date,
  };
}

function getLocationIdsFromBody(body: any): string[] {
  if (Array.isArray(body?.locationIds)) {
    return body.locationIds
      .map((value: unknown) => String(value ?? '').trim())
      .filter(Boolean);
  }

  const singleLocationId = String(body?.locationId ?? '').trim();

  return singleLocationId ? [singleLocationId] : [];
}

const assignmentInclude = {
  document: {
    select: {
      id: true,
      kuerzel: true,
      bezeichnung: true,
      themenfeld: true,
      rechtsart: true,
      relevanz: true,
      status: true,
      frist: true,
    },
  },
  location: {
    select: {
      id: true,
      name: true,
      kuerzel: true,
      type: true,
      isActive: true,
    },
  },
  assessment: {
    select: {
      id: true,
      relevance: true,
      actionRequired: true,
      actionSummary: true,
      assessedAt: true,
      updatedAt: true,
    },
  },
  matrix: {
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  },
} as const;

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const url = new URL(req.url);

  const documentId = url.searchParams.get('documentId')?.trim() || undefined;
  const requestedLocationId = url.searchParams.get('locationId')?.trim() || undefined;
  const statusRaw = url.searchParams.get('status')?.trim().toUpperCase() || undefined;

  const status =
    statusRaw && Object.values(AssignmentStatus).includes(statusRaw as AssignmentStatus)
      ? (statusRaw as AssignmentStatus)
      : undefined;

  const allowedLocationIds = await getAllowedLocationIds(user);

  if (allowedLocationIds !== null && allowedLocationIds.length === 0) {
    return NextResponse.json({
      success: true,
      accessScope: 'LIMITED',
      assignments: [],
    });
  }

  if (
    allowedLocationIds !== null &&
    requestedLocationId &&
    !allowedLocationIds.includes(requestedLocationId)
  ) {
    return jsonError('Forbidden.', 403);
  }

  const assignments = await prisma.documentLocationAssignment.findMany({
    where: {
      ...(documentId ? { documentId } : {}),
      ...(status ? { status } : {}),
      ...(requestedLocationId
        ? { locationId: requestedLocationId }
        : allowedLocationIds === null
          ? {}
          : {
              locationId: {
                in: allowedLocationIds,
              },
            }),
    },
    orderBy: [
      {
        assignedAt: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],
    include: assignmentInclude,
  });

  return NextResponse.json({
    success: true,
    accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
    allowedLocationIds,
    assignments,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  if (!auth.user.isCentralRole) {
    return jsonError('Forbidden.', 403);
  }

  const body = await req.json().catch(() => ({}));

  const documentId = String(body?.documentId ?? '').trim();
  const locationIds = Array.from(new Set(getLocationIdsFromBody(body)));
  const status = normalizeAssignmentStatus(body?.status);
  const dueDate = parseOptionalDate(body?.dueDate, 'dueDate');

  if (!documentId) {
    return jsonError('documentId ist ein Pflichtfeld.', 400);
  }

  if (locationIds.length === 0) {
    return jsonError('Mindestens ein Standort muss angegeben werden.', 400, {
      expectedShape: {
        documentId: 'string',
        locationIds: ['string'],
        dueDate: 'optional ISO date',
      },
    });
  }

  if (!dueDate.ok) {
    return jsonError('Ungueltiges Datum.', 400, {
      field: dueDate.field,
    });
  }

  const document = await prisma.registerDocument.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      kuerzel: true,
      bezeichnung: true,
    },
  });

  if (!document) {
    return jsonError('Dokument nicht gefunden.', 404);
  }

  const locations = await prisma.location.findMany({
    where: {
      id: {
        in: locationIds,
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const existingLocationIds = new Set(locations.map((location) => location.id));
  const missingLocationIds = locationIds.filter(
    (locationId) => !existingLocationIds.has(locationId)
  );

  if (missingLocationIds.length > 0) {
    return jsonError('Mindestens ein Standort wurde nicht gefunden oder ist inaktiv.', 400, {
      missingLocationIds,
    });
  }

  const assignments = await prisma.$transaction(async (tx) => {
    await Promise.all(
      locationIds.map((locationId) =>
        tx.documentLocationAssignment.upsert({
          where: {
            documentId_locationId: {
              documentId,
              locationId,
            },
          },
          create: {
            documentId,
            locationId,
            status,
            dueDate: dueDate.value,
            assignedByUserId: auth.user.id,
          },
          update: {
            status,
            dueDate: dueDate.value,
            assignedByUserId: auth.user.id,
          },
        })
      )
    );

    return tx.documentLocationAssignment.findMany({
      where: {
        documentId,
        locationId: {
          in: locationIds,
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
      include: assignmentInclude,
    });
  });

  return NextResponse.json(
    {
      success: true,
      document,
      assignments,
    },
    { status: 201 }
  );
}
