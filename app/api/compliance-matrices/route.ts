import { NextResponse } from 'next/server';
import {
  MatrixStatus,
  RiskAggregationMode,
  RiskScope,
} from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import {
  canAccessLocation,
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

function normalizeMatrixStatus(value: unknown): MatrixStatus {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(MatrixStatus).includes(text as MatrixStatus)) {
    return text as MatrixStatus;
  }

  return MatrixStatus.DRAFT;
}

function normalizeRiskAggregationMode(value: unknown): RiskAggregationMode {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(RiskAggregationMode).includes(text as RiskAggregationMode)) {
    return text as RiskAggregationMode;
  }

  return RiskAggregationMode.WORST_CASE;
}

function normalizeRiskScope(value: unknown): RiskScope {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(RiskScope).includes(text as RiskScope)) {
    return text as RiskScope;
  }

  return RiskScope.NON_COMPLIANT;
}

const matrixInclude = {
  assignment: {
    select: {
      id: true,
      status: true,
      dueDate: true,
      assignedAt: true,
      document: {
        select: {
          id: true,
          kuerzel: true,
          bezeichnung: true,
          themenfeld: true,
          rechtsart: true,
          relevanz: true,
          status: true,
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
    },
  },
  clauses: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      parentId: true,
      refLevel1: true,
      refLevel2: true,
      refLevel3: true,
      titleLevel1: true,
      titleLevel2: true,
      titleLevel3: true,
      requirementText: true,
      evidenceNote: true,
      comment: true,
      status: true,
      psoeLevel: true,
      riskSeverity: true,
      riskProbability: true,
      internalRefsJson: true,
      legalRefsJson: true,
      processRefsJson: true,
      formRefsJson: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const url = new URL(req.url);

  const matrixId = url.searchParams.get('matrixId')?.trim() || undefined;
  const assignmentId = url.searchParams.get('assignmentId')?.trim() || undefined;
  const locationId = url.searchParams.get('locationId')?.trim() || undefined;

  const allowedLocationIds = await getAllowedLocationIds(user);

  if (allowedLocationIds !== null && allowedLocationIds.length === 0) {
    return NextResponse.json({
      success: true,
      accessScope: 'LIMITED',
      allowedLocationIds,
      matrices: [],
    });
  }

  if (
    allowedLocationIds !== null &&
    locationId &&
    !allowedLocationIds.includes(locationId)
  ) {
    return jsonError('Forbidden.', 403);
  }

  if (assignmentId) {
    const assignment = await prisma.documentLocationAssignment.findUnique({
      where: {
        id: assignmentId,
      },
      select: {
        id: true,
        locationId: true,
      },
    });

    if (!assignment) {
      return jsonError('Assignment nicht gefunden.', 404);
    }

    const allowed = await canAccessLocation(user, assignment.locationId, 'READ');

    if (!allowed) {
      return jsonError('Forbidden.', 403);
    }
  }

  if (matrixId) {
    const matrix = await prisma.complianceMatrix.findUnique({
      where: {
        id: matrixId,
      },
      include: matrixInclude,
    });

    if (!matrix) {
      return jsonError('Matrix nicht gefunden.', 404);
    }

    const allowed = await canAccessLocation(
      user,
      matrix.assignment.location.id,
      'READ'
    );

    if (!allowed) {
      return jsonError('Forbidden.', 403);
    }

    return NextResponse.json({
      success: true,
      accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
      allowedLocationIds,
      matrix,
    });
  }

  const matrices = await prisma.complianceMatrix.findMany({
    where: {
      ...(assignmentId ? { assignmentId } : {}),
      assignment: {
        ...(locationId
          ? { locationId }
          : allowedLocationIds === null
            ? {}
            : {
                locationId: {
                  in: allowedLocationIds,
                },
              }),
      },
    },
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    include: matrixInclude,
  });

  return NextResponse.json({
    success: true,
    accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
    allowedLocationIds,
    matrices,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const body = await req.json().catch(() => ({}));

  const assignmentId = String(body?.assignmentId ?? '').trim();

  if (!assignmentId) {
    return jsonError('assignmentId ist ein Pflichtfeld.', 400);
  }

  const assignment = await prisma.documentLocationAssignment.findUnique({
    where: {
      id: assignmentId,
    },
    select: {
      id: true,
      locationId: true,
      document: {
        select: {
          id: true,
          kuerzel: true,
          bezeichnung: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          kuerzel: true,
        },
      },
    },
  });

  if (!assignment) {
    return jsonError('Assignment nicht gefunden.', 404);
  }

  const allowedToWrite = await canAccessLocation(
    user,
    assignment.locationId,
    'CONTRIBUTE'
  );

  if (!allowedToWrite) {
    return jsonError('Forbidden.', 403, {
      requiredAccess: 'CONTRIBUTE',
      locationId: assignment.locationId,
    });
  }

  const matrix = await prisma.complianceMatrix.upsert({
    where: {
      assignmentId,
    },
    create: {
      assignmentId,
      status: normalizeMatrixStatus(body?.status),
      riskAggregationMode: normalizeRiskAggregationMode(body?.riskAggregationMode),
      riskScope: normalizeRiskScope(body?.riskScope),
    },
    update: {
      status: normalizeMatrixStatus(body?.status),
      riskAggregationMode: normalizeRiskAggregationMode(body?.riskAggregationMode),
      riskScope: normalizeRiskScope(body?.riskScope),
    },
    include: matrixInclude,
  });

  return NextResponse.json({
    success: true,
    assignment,
    matrix,
  });
}
