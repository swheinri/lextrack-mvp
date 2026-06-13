import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const teamId = String(id ?? '').trim();

  if (!teamId) {
    return NextResponse.json(
      { success: false, message: 'Team-ID fehlt.' },
      { status: 400 }
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      { success: false, message: 'Team wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  const leadPerson = await prisma.person.findFirst({
    where: {
      teamId,
      orgFunction: 'LEAD',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return NextResponse.json({
    success: true,
    leadPerson,
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const teamId = String(id ?? '').trim();

  if (!teamId) {
    return NextResponse.json(
      { success: false, message: 'Team-ID fehlt.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const personId =
    typeof body?.personId === 'string' && body.personId.trim()
      ? body.personId.trim()
      : null;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      { success: false, message: 'Team wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  if (personId) {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        id: true,
        teamId: true,
      },
    });

    if (!person) {
      return NextResponse.json(
        { success: false, message: 'Benutzer wurde nicht gefunden.' },
        { status: 404 }
      );
    }

    if (person.teamId !== teamId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Der Team Lead muss diesem Team zugeordnet sein.',
        },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.person.updateMany({
      where: {
        teamId,
        orgFunction: 'LEAD',
        ...(personId ? { id: { not: personId } } : {}),
      },
      data: {
        orgFunction: 'MEMBER',
      },
    });

    if (personId) {
      await tx.person.update({
        where: { id: personId },
        data: {
          teamId,
          departmentId: team.departmentId,
          orgFunction: 'LEAD',
        },
      });
    }
  });

  const leadPerson = personId
    ? await prisma.person.findUnique({
        where: { id: personId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      })
    : null;

  return NextResponse.json({
    success: true,
    message: personId
      ? 'Team Lead wurde gespeichert.'
      : 'Team Lead wurde entfernt.',
    leadPerson,
  });
}
