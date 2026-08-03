import { NextResponse } from 'next/server';
import { AssessmentRelevance } from '@prisma/client';

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

function normalizeRelevance(value: unknown): AssessmentRelevance {
  const text = String(value ?? '').trim().toUpperCase();

  if (Object.values(AssessmentRelevance).includes(text as AssessmentRelevance)) {
    return text as AssessmentRelevance;
  }

  return AssessmentRelevance.UNASSESSED;
}

function pickNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length ? text : null;
}

function pickOptionalBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;

  const text = String(value).trim().toLowerCase();

  if (['true', '1', 'yes', 'ja'].includes(text)) return true;
  if (['false', '0', 'no', 'nein'].includes(text)) return false;

  return undefined;
}

function pickOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return Math.trunc(number);
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

const assessmentInclude = {
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
} as const;

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;
  const url = new URL(req.url);

  const assignmentId = url.searchParams.get('assignmentId')?.trim() || undefined;
  const locationId = url.searchParams.get('locationId')?.trim() || undefined;

  const allowedLocationIds = await getAllowedLocationIds(user);

  if (allowedLocationIds !== null && allowedLocationIds.length === 0) {
    return NextResponse.json({
      success: true,
      accessScope: 'LIMITED',
      allowedLocationIds,
      assessments: [],
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

  const assessments = await prisma.locationAssessment.findMany({
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
    include: assessmentInclude,
  });

  return NextResponse.json({
    success: true,
    accessScope: user.isCentralRole ? 'ALL' : 'LIMITED',
    allowedLocationIds,
    assessments,
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

  const allowedToWrite = await canAccessLocation(user, assignment.locationId, 'CONTRIBUTE');

  if (!allowedToWrite) {
    return jsonError('Forbidden.', 403, {
      requiredAccess: 'CONTRIBUTE',
      locationId: assignment.locationId,
    });
  }

  const mitigationAt = parseOptionalDate(body?.mitigationAt, 'mitigationAt');
  const evaluatedAt = parseOptionalDate(body?.evaluatedAt, 'evaluatedAt');

  if (!mitigationAt.ok) {
    return jsonError('Ungueltiges Datum.', 400, {
      field: mitigationAt.field,
    });
  }

  if (!evaluatedAt.ok) {
    return jsonError('Ungueltiges Datum.', 400, {
      field: evaluatedAt.field,
    });
  }

  const mitigationPlanned = pickOptionalBoolean(body?.mitigationPlanned);
  const actionRequired = pickOptionalBoolean(body?.actionRequired);

  const assessment = await prisma.locationAssessment.upsert({
    where: {
      assignmentId,
    },
    create: {
      assignmentId,
      relevance: normalizeRelevance(body?.relevance),

      riskMode: pickNullableString(body?.riskMode),
      bewertungErgebnis: pickNullableString(body?.bewertungErgebnis),
      evaluationNote: pickNullableString(body?.evaluationNote),

      evaluationLikelihood: pickOptionalInt(body?.evaluationLikelihood),
      evaluationImpact: pickOptionalInt(body?.evaluationImpact),
      evaluationScore: pickOptionalInt(body?.evaluationScore),
      evaluationLevel: pickNullableString(body?.evaluationLevel),
      evaluatedAt: evaluatedAt.value,
      evaluatedBy: pickNullableString(body?.evaluatedBy),

      mitigationPlanned: mitigationPlanned ?? false,
      mitigationAt: mitigationAt.value,

      projektJson: body?.projektJson ?? undefined,

      comment: pickNullableString(body?.comment),
      actionRequired: actionRequired ?? false,
      actionSummary: pickNullableString(body?.actionSummary),

      assessedByUserId: user.id,
      assessedAt: new Date(),
    },
    update: {
      relevance: normalizeRelevance(body?.relevance),

      riskMode: pickNullableString(body?.riskMode),
      bewertungErgebnis: pickNullableString(body?.bewertungErgebnis),
      evaluationNote: pickNullableString(body?.evaluationNote),

      evaluationLikelihood: pickOptionalInt(body?.evaluationLikelihood),
      evaluationImpact: pickOptionalInt(body?.evaluationImpact),
      evaluationScore: pickOptionalInt(body?.evaluationScore),
      evaluationLevel: pickNullableString(body?.evaluationLevel),
      evaluatedAt: evaluatedAt.value,
      evaluatedBy: pickNullableString(body?.evaluatedBy),

      mitigationPlanned: mitigationPlanned ?? false,
      mitigationAt: mitigationAt.value,

      projektJson: body?.projektJson ?? undefined,

      comment: pickNullableString(body?.comment),
      actionRequired: actionRequired ?? false,
      actionSummary: pickNullableString(body?.actionSummary),

      assessedByUserId: user.id,
      assessedAt: new Date(),
    },
    include: assessmentInclude,
  });

  return NextResponse.json({
    success: true,
    assignment,
    assessment,
  });
}
