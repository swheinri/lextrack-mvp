// app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashToken } from '@/app/lib/token-hash';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('token') ?? '').trim();
  if (!token) return NextResponse.json({ valid: false });

  const tokenHash = hashToken(token);
  const now = new Date();

  const row = await prisma.authToken.findUnique({
    where: { token: tokenHash },
    select: { type: true, expiresAt: true, usedAt: true },
  });

  if (!row) return NextResponse.json({ valid: false });
  if (row.usedAt) return NextResponse.json({ valid: false });
  if (row.expiresAt <= now) return NextResponse.json({ valid: false });

  // ✅ sowohl RESET als auch INVITE erlauben
  if (row.type !== 'RESET' && row.type !== 'INVITE') {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, type: row.type });
}