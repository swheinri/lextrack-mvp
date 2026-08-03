import { NextResponse } from 'next/server';
import {
  ComplianceClauseStatus,
  Prisma,
  PsoeLevel,
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

function pickNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length ? text : null;
}

function pickOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return Math.trunc(number);
}

function normalizeClauseStatus(value: unknown): ComplianceClauseStatus {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(ComplianceClauseStatus).includes(text as ComplianceClauseStatus)) {
    return text as ComplianceClauseStatus;
  }

  return ComplianceClauseStatus.OPEN;
}

function normalizePsoeLevel(value: unknown): PsoeLevel | null {
  if (value === null || value === undefined || value === '') return null;

  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(PsoeLevel).includes(text as PsoeLevel)) {
    return text as PsoeLevel;
  }

  return null;
}

function pickJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
}

const clauseInclude = {
  matrix: {
    select: {
      id: true,
      status: true,
      riskAggregationMode: true,
      riskScope: true,
      assignment: {
        select: {
          id: true,
          status: true,
          dueDate: true,
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
    },
  },
} as const;

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const url = new URL(req.url);

  const clauseId = url.searchParams.get('clauseId')?.trim() || undefined;
  const matrixId = url.searchParams.get('matrixId')?.trim() || undefined;
  const assignmentId = url.searchParams.get('assignmentId')?.trim() || undefined;
  const locationId = url.searchParams.get('locationId')?.trim() || undefined;

  const allowedLocationIds = await getAllowedLocationIds(user);

  if (allowedLocationIds !== null && allowedLocationIds.length === 0) {
    return NextResponse.json({
      success: true,
      accessScope: 'LIMITED',
      allowedLocationIds,
      clauses: [],
    });
  }

  if (
    allowedLocationIds !== null &&
    locationId &&
    !allowedLocationIds.includes(locationId)
  ) {
    return jsonError('Forbidden.', 403);
  }

  if (clauseId) {
    const clause = await prisma.complianceMatrixClause.findUnique({
      where: {
        id: clauseId,
      },
      include: clauseInclude,
    });

    if (!clause) {
      return jsonError('Clause nicht gefunden.', 404);
    }

    const allowed = await canAccessLocation(
      user,
      clause.matrix.assignment.location.id,
      'READ'
    );

    if (!allowed) {
      return jsonError('Forbidden.', 403);
    }

    return NextResponse.json({
      success: true,
      accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
      allowedLocationIds,
      clause,
    });
  }

  if (matrixId) {
    const matrix = await prisma.complianceMatrix.findUnique({
      where: {
        id: matrixId,
      },
      select: {
        id: true,
        assignment: {
          select: {
            locationId: true,
          },
        },
      },
    });

    if (!matrix) {
      return jsonError('Matrix nicht gefunden.', 404);
    }

    const allowed = await canAccessLocation(user, matrix.assignment.locationId, 'READ');

    if (!allowed) {
      return jsonError('Forbidden.', 403);
    }
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

  const clauses = await prisma.complianceMatrixClause.findMany({
    where: {
      ...(matrixId ? { matrixId } : {}),
      matrix: {
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
    },
    orderBy: [
      {
        createdAt: 'asc',
      },
    ],
    include: clauseInclude,
  });

  return NextResponse.json({
    success: true,
    accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
    allowedLocationIds,
    clauses,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const body = await req.json().catch(() => ({}));

  const clauseId = String(body?.id ?? body?.clauseId ?? '').trim();
  const matrixId = String(body?.matrixId ?? '').trim();

  if (!clauseId && !matrixId) {
    return jsonError('matrixId ist ein Pflichtfeld, wenn keine clauseId angegeben ist.', 400);
  }

  let targetMatrixId = matrixId;

  if (clauseId) {
    const existingClause = await prisma.complianceMatrixClause.findUnique({
      where: {
        id: clauseId,
      },
      select: {
        id: true,
        matrixId: true,
        matrix: {
          select: {
            assignment: {
              select: {
                locationId: true,
              },
            },
          },
        },
      },
    });

    if (!existingClause) {
      return jsonError('Clause nicht gefunden.', 404);
    }

    const allowed = await canAccessLocation(
      user,
      existingClause.matrix.assignment.locationId,
      'CONTRIBUTE'
    );

    if (!allowed) {
      return jsonError('Forbidden.', 403, {
        requiredAccess: 'CONTRIBUTE',
        locationId: existingClause.matrix.assignment.locationId,
      });
    }

    targetMatrixId = existingClause.matrixId;
  }

  const matrix = await prisma.complianceMatrix.findUnique({
    where: {
      id: targetMatrixId,
    },
    select: {
      id: true,
      assignment: {
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
      },
    },
  });

  if (!matrix) {
    return jsonError('Matrix nicht gefunden.', 404);
  }

  const allowedToWrite = await canAccessLocation(
    user,
    matrix.assignment.locationId,
    'CONTRIBUTE'
  );

  if (!allowedToWrite) {
    return jsonError('Forbidden.', 403, {
      requiredAccess: 'CONTRIBUTE',
      locationId: matrix.assignment.locationId,
    });
  }

  const parentId = pickNullableString(body?.parentId);

  if (parentId) {
    const parent = await prisma.complianceMatrixClause.findUnique({
      where: {
        id: parentId,
      },
      select: {
        id: true,
        matrixId: true,
      },
    });

    if (!parent || parent.matrixId !== matrix.id) {
      return jsonError('Parent-Clause gehoert nicht zu dieser Matrix.', 400);
    }
  }

  const data = {
    parentId,

    refLevel1: pickNullableString(body?.refLevel1),
    refLevel2: pickNullableString(body?.refLevel2),
    refLevel3: pickNullableString(body?.refLevel3),

    titleLevel1: pickNullableString(body?.titleLevel1),
    titleLevel2: pickNullableString(body?.titleLevel2),
    titleLevel3: pickNullableString(body?.titleLevel3),

    requirementText: pickNullableString(body?.requirementText),
    evidenceNote: pickNullableString(body?.evidenceNote),
    comment: pickNullableString(body?.comment),

    status: normalizeClauseStatus(body?.status),

    psoeLevel: normalizePsoeLevel(body?.psoeLevel),
    riskSeverity: pickOptionalInt(body?.riskSeverity),
    riskProbability: pickOptionalInt(body?.riskProbability),

    internalRefsJson: pickJson(body?.internalRefsJson),
    legalRefsJson: pickJson(body?.legalRefsJson),
    processRefsJson: pickJson(body?.processRefsJson),
    formRefsJson: pickJson(body?.formRefsJson),
  };

  const clause = clauseId
    ? await prisma.complianceMatrixClause.update({
        where: {
          id: clauseId,
        },
        data,
        include: clauseInclude,
      })
    : await prisma.complianceMatrixClause.create({
        data: {
          matrixId: matrix.id,
          ...data,
        },
        include: clauseInclude,
      });

  return NextResponse.json({
    success: true,
    matrix,
    clause,
  });
}
