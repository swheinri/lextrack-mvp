import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

type OrgFunctionInput = 'MEMBER' | 'LEAD' | 'DEPUTY';

const ORG_FUNCTIONS = new Set<OrgFunctionInput>(['MEMBER', 'LEAD', 'DEPUTY']);

function normalizeOrgFunction(value: unknown): OrgFunctionInput {
  if (typeof value === 'string' && ORG_FUNCTIONS.has(value as OrgFunctionInput)) {
    return value as OrgFunctionInput;
  }

  return 'MEMBER';
}

async function handleUpdate(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const userId =
    typeof body?.userId === 'string' && body.userId.trim()
      ? body.userId.trim()
      : typeof body?.id === 'string' && body.id.trim()
        ? body.id.trim()
        : '';

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Benutzer-ID fehlt.' },
      { status: 400 }
    );
  }

  const roleId =
    typeof body?.roleId === 'string' && body.roleId.trim()
      ? body.roleId.trim()
      : null;

  const departmentIdRaw =
    typeof body?.departmentId === 'string' && body.departmentId.trim()
      ? body.departmentId.trim()
      : null;

  const teamIdRaw =
    typeof body?.teamId === 'string' && body.teamId.trim()
      ? body.teamId.trim()
      : null;

  const orgFunction = normalizeOrgFunction(body?.orgFunction);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      person: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Benutzer wurde nicht gefunden.' },
      { status: 404 }
    );
  }

  let resolvedDepartmentId = departmentIdRaw;
  let resolvedTeamId = teamIdRaw;

  if (resolvedTeamId) {
    const team = await prisma.team.findUnique({
      where: { id: resolvedTeamId },
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

    resolvedDepartmentId = team.departmentId;
  }

  if (resolvedDepartmentId) {
    const department = await prisma.department.findUnique({
      where: { id: resolvedDepartmentId },
      select: { id: true },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Abteilung wurde nicht gefunden.' },
        { status: 404 }
      );
    }
  }

  if (roleId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Rolle wurde nicht gefunden.' },
        { status: 404 }
      );
    }
  }

  if (orgFunction === 'LEAD') {
    if (!resolvedDepartmentId && !resolvedTeamId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lead kann nur gesetzt werden, wenn Abteilung oder Team zugeordnet ist.',
        },
        { status: 400 }
      );
    }

    const currentPersonId = user.person?.id ?? '__none__';

    const conflict = await prisma.person.findFirst({
      where: resolvedTeamId
        ? {
            id: { not: currentPersonId },
            teamId: resolvedTeamId,
            orgFunction: 'LEAD',
          }
        : {
            id: { not: currentPersonId },
            departmentId: resolvedDepartmentId,
            teamId: null,
            orgFunction: 'LEAD',
          },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (conflict) {
      const conflictName =
        [conflict.firstName, conflict.lastName].filter(Boolean).join(' ') ||
        conflict.email ||
        'ein anderer Benutzer';

      return NextResponse.json(
        {
          success: false,
          message:
            'Lead ist bereits vergeben an ' +
            conflictName +
            '. Bitte Deputy oder Mitarbeiter auswaehlen.',
        },
        { status: 409 }
      );
    }
  }

  if (roleId) {
    await prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });
  }

  if (user.person) {
    await prisma.person.update({
      where: { id: user.person.id },
      data: {
        departmentId: resolvedDepartmentId,
        teamId: resolvedTeamId,
        orgFunction,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Benutzer wurde aktualisiert.',
  });
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}
