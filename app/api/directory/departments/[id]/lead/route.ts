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
  const departmentId = String(id ?? '').trim();

  if (!departmentId) {
    return NextResponse.json(
      { success: false, message: 'Abteilungs-ID fehlt.' },
      { status: 400 }
    );
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      leadPerson: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!department) {
    return NextResponse.json(
      { success: false, message: 'Abteilung wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    leadPerson: department.leadPerson,
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const departmentId = String(id ?? '').trim();

  if (!departmentId) {
    return NextResponse.json(
      { success: false, message: 'Abteilungs-ID fehlt.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const leadPersonIdRaw = body?.leadPersonId;
  const leadPersonId =
    typeof leadPersonIdRaw === 'string' && leadPersonIdRaw.trim()
      ? leadPersonIdRaw.trim()
      : null;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });

  if (!department) {
    return NextResponse.json(
      { success: false, message: 'Abteilung wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  if (leadPersonId) {
    const person = await prisma.person.findUnique({
      where: { id: leadPersonId },
      select: {
        id: true,
        departmentId: true,
      },
    });

    if (!person) {
      return NextResponse.json(
        { success: false, message: 'Benutzer wurde nicht gefunden.' },
        { status: 404 }
      );
    }

    if (person.departmentId !== departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Der Abteilungslead muss dieser Abteilung zugeordnet sein.',
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: { leadPersonId },
    select: {
      id: true,
      leadPerson: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: leadPersonId
      ? 'Abteilungslead wurde gespeichert.'
      : 'Abteilungslead wurde entfernt.',
    leadPerson: updated.leadPerson,
  });
}
