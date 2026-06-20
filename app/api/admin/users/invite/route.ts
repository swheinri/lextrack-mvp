// app/api/auth/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { jwtVerify } from 'jose';

import { prisma } from '@/app/lib/prisma';
import { hashToken } from '@/app/lib/token-hash';
import { getAuthCookieName } from '@/app/lib/session';
import { sendUserInviteEmail } from '@/app/lib/mailer';

export const runtime = 'nodejs';

// Invite-Links sind typischerweise länger gültig als Reset-Links (z.B. 7 Tage)
const INVITE_EXPIRES_MINUTES = 60 * 24 * 7;

function baseUrl(): string {
  const url =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getJwtSecretBytes(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    '';
  return new TextEncoder().encode(raw);
}

async function requireAdmin(req: NextRequest) {
  const cookieName = getAuthCookieName();
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Nicht angemeldet.' }, { status: 401 }) };
  }

  const secret = getJwtSecretBytes();
  if (!secret || secret.length === 0) {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Server-Konfiguration fehlt (AUTH_SECRET).' }, { status: 500 }) };
  }

  let userId = '';
  try {
    const verified = await jwtVerify(token, secret);
    const payload: any = verified.payload;
    userId = String(payload?.userId ?? payload?.sub ?? '').trim();
  } catch {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Session ungültig.' }, { status: 401 }) };
  }

  if (!userId) {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Session ungültig.' }, { status: 401 }) };
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { code: true } }, isActive: true },
  });

  if (!me || !me.isActive) {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Nicht angemeldet.' }, { status: 401 }) };
  }

  if (me.role?.code !== 'ADMIN') {
    return { ok: false as const, res: NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 }) };
  }

  return { ok: true as const, userId };
}

export async function POST(req: NextRequest) {
  // Nur Admin darf einladen
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
const email = String(body?.email ?? '').trim().toLowerCase();
const name = String(body?.name ?? '').trim();
const roleCode = String(body?.roleCode ?? 'USER').trim().toUpperCase() || 'USER';
const departmentId = String(body?.departmentId ?? '').trim() || null;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, message: 'Bitte eine gültige E-Mail angeben.' }, { status: 400 });
  }

  // Rolle sicherstellen (USER Default)
  const role = await prisma.role.upsert({
    where: { code: roleCode },
    update: { isActive: true },
    create: {
      code: roleCode,
      name: roleCode === 'ADMIN' ? 'Administrator' : 'User',
      description: roleCode === 'ADMIN' ? 'Systemrolle' : 'Standardrolle',
      isActive: true,
      isSystem: roleCode === 'ADMIN',
    },
  });

let department: { id: string } | null = null;

if (departmentId) {
  department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });

  if (!department) {
    return NextResponse.json(
      { success: false, message: 'Die ausgewählte Abteilung wurde nicht gefunden.' },
      { status: 400 }
    );
  }
}

  // User anlegen oder aktualisieren
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true },
  });

  if (existing?.passwordHash) {
    // User existiert bereits mit Passwort → kein Invite-Link nötig
    return NextResponse.json(
      { success: false, message: 'Dieser Benutzer existiert bereits (Passwort ist gesetzt). Nutze ggf. Passwort-Reset.' },
      { status: 409 }
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name || email,
      roleId: role.id,
      isActive: true,
    },
    create: {
      email,
      name: name || email,
      passwordHash: null,
      isActive: true,
      roleId: role.id,
    },
    select: { id: true, email: true, name: true },
  });

const now = new Date();

await prisma.person.upsert({
  where: { email },
  update: {
    firstName: name || email,
    lastName: null,
    status: 'INVITED',
    departmentId: department?.id ?? null,
    roleId: role.id,
    userId: user.id,
    lastInvitedAt: now,
    acceptedAt: null,
  },
  create: {
    firstName: name || email,
    lastName: null,
    email,
    status: 'INVITED',
    departmentId: department?.id ?? null,
    roleId: role.id,
    userId: user.id,
    invitedAt: now,
    lastInvitedAt: now,
    acceptedAt: null,
  },
});

  // alte, offene INVITE-Tokens löschen
  await prisma.authToken.deleteMany({
    where: { userId: user.id, type: 'INVITE', usedAt: null },
  });

  // Token erzeugen (plain) + nur Hash speichern
  const plainToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.authToken.create({
    data: { token: tokenHash, type: 'INVITE', expiresAt, userId: user.id },
  });

  const inviteUrl = `${baseUrl()}/set-password?token=${encodeURIComponent(plainToken)}`;

  await sendUserInviteEmail({
    to: user.email,
    inviteUrl,
    expiresInMinutes: INVITE_EXPIRES_MINUTES,
  });

  return NextResponse.json({ success: true });
}