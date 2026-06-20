// app/api/directory/teams/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Team wurde nicht gefunden.',
        },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      kuerzel?: string | null;
      description?: string | null;
      isActive?: boolean;
      departmentId?: string;
    } = {};

    if ('name' in body) {
      const name = cleanString(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: 'Bitte einen Teamnamen angeben.',
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if ('kuerzel' in body) {
      data.kuerzel = cleanString(body.kuerzel);
    }

    if ('description' in body) {
      data.description = cleanString(body.description);
    }

    if ('isActive' in body) {
      data.isActive = Boolean(body.isActive);
    }

    if ('departmentId' in body) {
      const departmentId = cleanString(body.departmentId);

      if (!departmentId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Bitte eine Abteilung auswählen.',
          },
          { status: 400 }
        );
      }

      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });

      if (!department) {
        return NextResponse.json(
          {
            success: false,
            message: 'Die ausgewählte Abteilung wurde nicht gefunden.',
          },
          { status: 404 }
        );
      }

      data.departmentId = departmentId;
    }

    const team = await prisma.team.update({
      where: { id },
      data,
      include: {
        department: {
          include: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      team,
    });
  } catch (error: any) {
    console.error('[PATCH /api/directory/teams/[id]]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: 'In dieser Abteilung existiert bereits ein Team mit diesem Namen.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Team konnte nicht aktualisiert werden.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Team wurde nicht gefunden.',
        },
        { status: 404 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[DELETE /api/directory/teams/[id]]', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Team konnte nicht gelöscht werden.',
      },
      { status: 500 }
    );
  }
}