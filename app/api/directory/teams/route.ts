// app/api/directory/teams/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: [{ name: 'asc' }],
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
      teams,
    });
  } catch (error) {
    console.error('[GET /api/directory/teams]', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Teams konnten nicht geladen werden.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = cleanString(body.name);
    const kuerzel = cleanString(body.kuerzel);
    const description = cleanString(body.description);
    const departmentId = cleanString(body.departmentId);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bitte einen Teamnamen angeben.',
        },
        { status: 400 }
      );
    }

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

    const team = await prisma.team.create({
      data: {
        name,
        kuerzel,
        description,
        departmentId,
      },
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
    console.error('[POST /api/directory/teams]', error);

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
        message: 'Team konnte nicht angelegt werden.',
      },
      { status: 500 }
    );
  }
}