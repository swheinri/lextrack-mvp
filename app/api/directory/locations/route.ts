// app/api/directory/locations/route.ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { geocodeAddress } from '@/app/lib/geocoding';
import * as session from '@/app/lib/session';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...(extra ?? {}) }, { status });
}

function getAuthCookieName(): string {
  const anySession = session as any;
  const name = typeof anySession.getAuthCookieName === 'function' ? anySession.getAuthCookieName() : null;
  return typeof name === 'string' && name.trim() ? name : 'lextrack_auth';
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(name + '=')) return decodeURIComponent(part.slice(name.length + 1));
  }

  return null;
}

function requireAuth(req: Request): string | null {
  const cookieName = getAuthCookieName();
  const token = readCookie(req.headers.get('cookie'), cookieName);
  if (!token) return null;

  const anySession = session as any;
  if (typeof anySession.verifySessionToken === 'function') {
    try {
      const payload = anySession.verifySessionToken(token);
      if (!payload) return null;
    } catch {
      return null;
    }
  }

  return token;
}

function isBlank(value: unknown) {
  return !String(value ?? '').trim();
}

function pickNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function pickAddressInput(body: any) {
  return {
    label: pickNullableString(body?.addressLabel),
    street: pickNullableString(body?.street),
    houseNumber: pickNullableString(body?.houseNumber),
    postalCode: pickNullableString(body?.postalCode),
    city: pickNullableString(body?.city),
    state: pickNullableString(body?.state),
    country: pickNullableString(body?.country),
    building: pickNullableString(body?.building),
    floor: pickNullableString(body?.floor),
    room: pickNullableString(body?.room),
    area: pickNullableString(body?.area),
    additionalInfo: pickNullableString(body?.additionalInfo),
    isPrimary: true,
  };
}

function hasAnyAddressValue(address: ReturnType<typeof pickAddressInput>) {
  return Object.entries(address).some(([key, value]) => {
    if (key === 'isPrimary') return false;
    return typeof value === 'string' && value.trim().length > 0;
  });
}

const locationInclude = {
  addresses: {
    orderBy: [
      { isPrimary: 'desc' as const },
      { createdAt: 'asc' as const },
    ],
  },
  leadPerson: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      departmentId: true,
      teamId: true,
    },
  },
};

export async function GET(req: Request) {
  if (!requireAuth(req)) return jsonError('Nicht autorisiert.', 401);

  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: locationInclude,
    });

    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error('[directory/locations][GET] failed:', error);
    return jsonError('Konnte Locations nicht laden.', 500);
  }
}

export async function POST(req: Request) {
  if (!requireAuth(req)) return jsonError('Nicht autorisiert.', 401);

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? '').trim();
  const kuerzelRaw = body?.kuerzel ?? body?.code ?? '';
  const kuerzel = String(kuerzelRaw ?? '').trim() || null;

  const description = pickNullableString(body?.description);

  const organisationName = pickNullableString(body?.organisationName);
  const organisationalUnit = pickNullableString(body?.organisationalUnit);
  const contactName = pickNullableString(body?.contactName);
  const contactPhone = pickNullableString(body?.contactPhone);
  const contactMobile = pickNullableString(body?.contactMobile);
  const contactEmail = pickNullableString(body?.contactEmail);

  if (isBlank(name)) return jsonError('Name ist ein Pflichtfeld.', 400);
  if (name.length > 120) return jsonError('Name ist zu lang (max. 120 Zeichen).', 400);
  if (kuerzel && kuerzel.length > 32) return jsonError('K?rzel ist zu lang (max. 32 Zeichen).', 400);

  const addressInput = pickAddressInput(body);
  const shouldCreateAddress = hasAnyAddressValue(addressInput);

  try {
    const geocodeResult = shouldCreateAddress ? await geocodeAddress(addressInput) : null;
    const addressCreateData = geocodeResult
      ? {
          ...addressInput,
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
        }
      : addressInput;

    const data: Prisma.LocationCreateInput = {
      name,
      kuerzel,
      description,
      organisationName,
      organisationalUnit,
      contactName,
      contactPhone,
      contactMobile,
      contactEmail,
      ...(shouldCreateAddress
        ? {
            addresses: {
              create: addressCreateData,
            },
          }
        : {}),
    };

    const created = await prisma.location.create({
      data,
      include: locationInclude,
    });

    return NextResponse.json({ success: true, location: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return jsonError('Location existiert bereits (Unique-Constraint).', 409);
    }

    console.error('[directory/locations][POST] failed:', error);
    return jsonError('Konnte Location nicht anlegen.', 500);
  }
}
