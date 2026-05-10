import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashToken } from '@/app/lib/token-hash';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plainToken = String(url.searchParams.get('token') ?? '').trim();
  if (!plainToken) return NextResponse.json({ valid: false });

  const now = new Date();
  const tokenHash = hashToken(plainToken);

  const row = await prisma.authToken.findFirst({
    where: {
      type: 'RESET',
      usedAt: null,
      expiresAt: { gt: now },
      OR: [{ token: tokenHash }, { token: plainToken }], // fallback für alte Tokens
    },
    select: { token: true },
  });

  return NextResponse.json({ valid: !!row });
}