// app/api/directory/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { geocodeAddress } from '@/app/lib/geocoding';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...(extra ?? {}) }, { status });
}

function hasOwn(obj: unknown, key: string): boolean {
  return !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);
}

function pickNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length ? text : undefined;
}

function pickNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const text = value.trim();
  return text.length ? text : null;
}

function pickBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

async function readId(ctx: Ctx): Promise<string> {
  const params = await ctx.params;
  return String(params?.id ?? '').trim();
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

const locationFields = [
  'name',
  'kuerzel',
  'description',
  'isActive',
  'organisationName',
  'organisationalUnit',
  'contactName',
  'contactPhone',
  'contactMobile',
  'contactEmail',
];

const addressFields = [
  'addressLabel',
  'street',
  'houseNumber',
  'postalCode',
  'city',
  'state',
  'country',
  'building',
  'floor',
  'room',
  'area',
  'additionalInfo',
];

const geocodingRelevantAddressFields = [
  'street',
  'houseNumber',
  'postalCode',
  'city',
  'state',
  'country',
];

function hasAnyAddressField(body: unknown) {
  return addressFields.some((field) => hasOwn(body, field));
}

function buildAddressUpdate(body: any) {
  const data: Record<string, any> = {};

  if (hasOwn(body, 'addressLabel')) data.label = pickNullableString(body.addressLabel) ?? null;
  if (hasOwn(body, 'street')) data.street = pickNullableString(body.street) ?? null;
  if (hasOwn(body, 'houseNumber')) data.houseNumber = pickNullableString(body.houseNumber) ?? null;
  if (hasOwn(body, 'postalCode')) data.postalCode = pickNullableString(body.postalCode) ?? null;
  if (hasOwn(body, 'city')) data.city = pickNullableString(body.city) ?? null;
  if (hasOwn(body, 'state')) data.state = pickNullableString(body.state) ?? null;
  if (hasOwn(body, 'country')) data.country = pickNullableString(body.country) ?? null;
  if (hasOwn(body, 'building')) data.building = pickNullableString(body.building) ?? null;
  if (hasOwn(body, 'floor')) data.floor = pickNullableString(body.floor) ?? null;
  if (hasOwn(body, 'room')) data.room = pickNullableString(body.room) ?? null;
  if (hasOwn(body, 'area')) data.area = pickNullableString(body.area) ?? null;
  if (hasOwn(body, 'additionalInfo')) data.additionalInfo = pickNullableString(body.additionalInfo) ?? null;

  return data;
}

/* -------------------- GET -------------------- */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const id = await readId(ctx);
  if (!id) return jsonError(400, 'Missing id');

  const location = await prisma.location.findUnique({
    where: { id },
    include: locationInclude,
  });

  if (!location) return jsonError(404, 'Not found');

  return NextResponse.json({ success: true, location });
}

/* -------------------- PATCH -------------------- */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const id = await readId(ctx);
  if (!id) return jsonError(400, 'Missing id');

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== 'object') {
    return jsonError(400, 'Invalid JSON body');
  }

  const wantsAnyLocationField = locationFields.some((field) => hasOwn(body, field));
  const wantsAnyAddressField = hasAnyAddressField(body);

  if (!wantsAnyLocationField && !wantsAnyAddressField) {
    return jsonError(400, 'No fields provided', {
      allowed: [...locationFields, ...addressFields],
    });
  }

  const data: Prisma.LocationUpdateInput = {};

  if (hasOwn(body, 'name')) {
    const name = pickNonEmptyString((body as any).name);
    if (!name) return jsonError(400, 'Invalid field: name must be a non-empty string');
    data.name = name;
  }

  if (hasOwn(body, 'kuerzel')) data.kuerzel = pickNullableString((body as any).kuerzel);
  if (hasOwn(body, 'description')) data.description = pickNullableString((body as any).description);

  if (hasOwn(body, 'isActive')) {
    const isActive = pickBool((body as any).isActive);
    if (isActive === undefined) return jsonError(400, 'Invalid field: isActive must be boolean');
    data.isActive = isActive;
  }

  if (hasOwn(body, 'organisationName')) data.organisationName = pickNullableString((body as any).organisationName);
  if (hasOwn(body, 'organisationalUnit')) data.organisationalUnit = pickNullableString((body as any).organisationalUnit);
  if (hasOwn(body, 'contactName')) data.contactName = pickNullableString((body as any).contactName);
  if (hasOwn(body, 'contactPhone')) data.contactPhone = pickNullableString((body as any).contactPhone);
  if (hasOwn(body, 'contactMobile')) data.contactMobile = pickNullableString((body as any).contactMobile);
  if (hasOwn(body, 'contactEmail')) data.contactEmail = pickNullableString((body as any).contactEmail);

  const shouldGeocodeAfterSave =
    wantsAnyAddressField &&
    geocodingRelevantAddressFields.some((field) => hasOwn(body, field));

  try {
    if (Object.keys(data).length > 0) {
      await prisma.location.update({ where: { id }, data });
    }

    if (wantsAnyAddressField) {
      const addressData = buildAddressUpdate(body as any);

      const primaryAddress = await prisma.locationAddress.findFirst({
        where: { locationId: id, isPrimary: true },
        orderBy: { createdAt: 'asc' },
      });

      if (primaryAddress) {
        await prisma.locationAddress.update({
          where: { id: primaryAddress.id },
          data: addressData,
        });
      } else {
        await prisma.locationAddress.create({
          data: {
            locationId: id,
            isPrimary: true,
            ...addressData,
          },
        });
      }
    }

    if (shouldGeocodeAfterSave) {
      const primaryAddress = await prisma.locationAddress.findFirst({
        where: { locationId: id, isPrimary: true },
        orderBy: { createdAt: 'asc' },
      });

      if (primaryAddress) {
        const geocodeResult = await geocodeAddress({
          street: primaryAddress.street,
          houseNumber: primaryAddress.houseNumber,
          postalCode: primaryAddress.postalCode,
          city: primaryAddress.city,
          state: primaryAddress.state,
          country: primaryAddress.country,
        });

        if (geocodeResult) {
          await prisma.locationAddress.update({
            where: { id: primaryAddress.id },
            data: {
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
            },
          });
        } else {
          console.warn('[directory/locations][PATCH] geocoding did not resolve; keeping existing coordinates.', {
            locationId: id,
            addressId: primaryAddress.id,
          });
        }
      }
    }

    const location = await prisma.location.findUnique({
      where: { id },
      include: locationInclude,
    });

    return NextResponse.json({ success: true, location });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError(409, 'Conflict: unique constraint', { code: error.code });
    }

    console.error('[directory/locations][PATCH] failed:', error);
    return jsonError(500, 'Update failed');
  }
}

/* -------------------- DELETE -------------------- */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const id = await readId(ctx);
  if (!id) return jsonError(400, 'Missing id');

  const depCount = await prisma.department.count({ where: { locationId: id } });
  if (depCount > 0) {
    return jsonError(409, 'Location has departments', { departments: depCount });
  }

  try {
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError(500, 'Delete failed');
  }
}
