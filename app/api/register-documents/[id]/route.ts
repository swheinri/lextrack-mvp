import { NextResponse } from 'next/server';
import { RegisterDocumentStatus } from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import {
  requireAuthenticatedUser,
} from '@/app/lib/location-access';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

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

async function getId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return String(params?.id ?? '').trim();
}

function normalizeStatus(value: unknown): RegisterDocumentStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const text = String(value).trim().toUpperCase();

  if (Object.values(RegisterDocumentStatus).includes(text as RegisterDocumentStatus)) {
    return text as RegisterDocumentStatus;
  }

  return undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const text = String(value).trim();
  return text.length ? text : null;
}

function nullableDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function pickUpdateData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  const stringFields = [
    'kuerzel',
    'bezeichnung',
    'themenfeld',
    'rechtsart',
    'relevanz',
    'herausgeber',
    'dokumentUrl',
    'quelleUrl',
  ] as const;

  for (const field of stringFields) {
    const value = nullableString(body[field]);
    if (value !== undefined) data[field] = value;
  }

  const dateFields = [
    'gueltigSeit',
    'gueltigBis',
    'publiziert',
    'frist',
  ] as const;

  for (const field of dateFields) {
    const value = nullableDate(body[field]);
    if (value !== undefined) data[field] = value;
  }

  const status = normalizeStatus(body.status);
  if (status !== undefined) data.status = status;

  return data;
}

const documentInclude = {
  assignments: {
    orderBy: {
      assignedAt: 'asc',
    },
    include: {
      location: true,
      assessment: true,
      matrix: true,
    },
  },
} as const;

export async function GET(req: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;

  if (!user.isCentralRole) {
    return jsonError('Forbidden.', 403);
  }

  const id = await getId(context);

  if (!id) {
    return jsonError('Dokument-ID fehlt.', 400);
  }

  const document = await prisma.registerDocument.findUnique({
    where: {
      id,
    },
    include: documentInclude,
  });

  if (!document) {
    return jsonError('Dokument nicht gefunden.', 404);
  }

  return NextResponse.json({
    success: true,
    document,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.res;

  const user = auth.user;

  if (!user.isCentralRole) {
    return jsonError('Forbidden.', 403);
  }

  const id = await getId(context);

  if (!id) {
    return jsonError('Dokument-ID fehlt.', 400);
  }

  const body = await req.json().catch(() => ({}));

  if (!body || typeof body !== 'object') {
    return jsonError('Ungueltiger Request Body.', 400);
  }

  const existing = await prisma.registerDocument.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return jsonError('Dokument nicht gefunden.', 404);
  }

  const data = pickUpdateData(body as Record<string, unknown>);

  if (Object.keys(data).length === 0) {
    return jsonError('Keine gueltigen Aenderungen uebergeben.', 400);
  }

  try {
    const document = await prisma.registerDocument.update({
      where: {
        id,
      },
      data,
      include: documentInclude,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    return jsonError('Dokument konnte nicht aktualisiert werden.', 500, {
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
