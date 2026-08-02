import { NextResponse } from 'next/server';
import { RegisterDocumentStatus } from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import { requireAuthenticatedUser } from '@/app/lib/location-access';

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

function pickNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length ? text : null;
}

function pickRequiredString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeStatus(value: unknown): RegisterDocumentStatus {
  const text = String(value ?? '').trim().toUpperCase();

  if (
    Object.values(RegisterDocumentStatus).includes(
      text as RegisterDocumentStatus
    )
  ) {
    return text as RegisterDocumentStatus;
  }

  return RegisterDocumentStatus.CAPTURED;
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

export async function GET(req: Request) {
  const auth = await requireCentralAccess(req);
  if (!auth.ok) return auth.res;

  const documents = await prisma.registerDocument.findMany({
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        bezeichnung: 'asc',
      },
    ],
    include: {
      assignments: {
        orderBy: {
          assignedAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          dueDate: true,
          assignedAt: true,
          updatedAt: true,
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
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    documents,
  });
}

export async function POST(req: Request) {
  const auth = await requireCentralAccess(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));

  const kuerzel = pickRequiredString(body?.kuerzel);
  const bezeichnung = pickRequiredString(body?.bezeichnung);
  const themenfeld = pickNullableString(body?.themenfeld);

  if (!kuerzel) {
    return jsonError('Kuerzel ist ein Pflichtfeld.', 400);
  }

  if (!bezeichnung) {
    return jsonError('Bezeichnung ist ein Pflichtfeld.', 400);
  }

  if (kuerzel.length > 120) {
    return jsonError('Kuerzel ist zu lang.', 400);
  }

  if (bezeichnung.length > 500) {
    return jsonError('Bezeichnung ist zu lang.', 400);
  }

  const dateFields = {
    publiziert: parseOptionalDate(body?.publiziert, 'publiziert'),
    frist: parseOptionalDate(body?.frist, 'frist'),
    gueltigSeit: parseOptionalDate(body?.gueltigSeit, 'gueltigSeit'),
    gueltigBis: parseOptionalDate(body?.gueltigBis, 'gueltigBis'),
    obsoletedAt: parseOptionalDate(body?.obsoletedAt, 'obsoletedAt'),
    archivedAt: parseOptionalDate(body?.archivedAt, 'archivedAt'),
    retentionUntil: parseOptionalDate(body?.retentionUntil, 'retentionUntil'),
  };

  const invalidDate = Object.values(dateFields).find((entry) => !entry.ok);

  if (invalidDate && !invalidDate.ok) {
    return jsonError('Ungueltiges Datum.', 400, {
      field: invalidDate.field,
    });
  }

  const document = await prisma.registerDocument.create({
    data: {
      dokumentenart: pickNullableString(body?.dokumentenart),
      vertragsumfeld: pickNullableString(body?.vertragsumfeld),
      rechtsart: pickNullableString(body?.rechtsart),
      normFamily: pickNullableString(body?.normFamily),

      kuerzel,
      bezeichnung,
      themenfeld,

      publiziert: dateFields.publiziert.ok ? dateFields.publiziert.value : null,
      frist: dateFields.frist.ok ? dateFields.frist.value : null,
      relevanz: pickNullableString(body?.relevanz),

      status: normalizeStatus(body?.status),

      herausgeber: pickNullableString(body?.herausgeber),
      gueltigSeit: dateFields.gueltigSeit.ok ? dateFields.gueltigSeit.value : null,
      gueltigBis: dateFields.gueltigBis.ok ? dateFields.gueltigBis.value : null,

      dokumentUrl: pickNullableString(body?.dokumentUrl),
      quelleUrl: pickNullableString(body?.quelleUrl),
      dokumentFileName: pickNullableString(body?.dokumentFileName),
      dokumentFileHref: pickNullableString(body?.dokumentFileHref),
      dokumentName: pickNullableString(body?.dokumentName),

      zustaendigkeit: pickNullableString(body?.zustaendigkeit),
      kategorie: pickNullableString(body?.kategorie),
      abgeloestDurch: pickNullableString(body?.abgeloestDurch),

      erfasserVorname: pickNullableString(body?.erfasserVorname),
      erfasserNachname: pickNullableString(body?.erfasserNachname),
      erfasserAbteilung: pickNullableString(body?.erfasserAbteilung),

      obsoletedAt: dateFields.obsoletedAt.ok ? dateFields.obsoletedAt.value : null,
      archivedAt: dateFields.archivedAt.ok ? dateFields.archivedAt.value : null,
      retentionUntil: dateFields.retentionUntil.ok ? dateFields.retentionUntil.value : null,
    },
  });

  return NextResponse.json(
    {
      success: true,
      document,
    },
    { status: 201 }
  );
}
