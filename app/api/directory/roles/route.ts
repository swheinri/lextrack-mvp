// app/api/directory/roles/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('[GET /api/directory/roles]', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Rollen konnten nicht geladen werden.',
      },
      { status: 500 }
    );
  }
}