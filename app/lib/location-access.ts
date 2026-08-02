import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import { getAuthCookieName, verifySessionToken } from '@/app/lib/session';

export type LocationAccessLevelValue =
  | 'READ'
  | 'CONTRIBUTE'
  | 'RESPONSIBLE'
  | 'ADMIN';

export type AuthenticatedUser = {
  id: string;
  email: string;
  roleCode: string;
  isCentralRole: boolean;
};

export type LocationAccessEntry = {
  locationId: string;
  accessLevel: LocationAccessLevelValue;
};

const CENTRAL_ROLE_CODES = new Set([
  'ADMIN',
  'SYSTEM_ADMIN',
  'CENTRAL_COMPLIANCE',
  'CENTRAL_GOVERNANCE',
  'GOVERNANCE',
  'COMPLIANCE',
]);

const LOCATION_ACCESS_RANK: Record<LocationAccessLevelValue, number> = {
  READ: 1,
  CONTRIBUTE: 2,
  RESPONSIBLE: 3,
  ADMIN: 4,
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function readCookieFromRequest(req: Request | NextRequest, name: string): string | null {
  const maybeNextRequest = req as NextRequest;

  const fromNextCookies = maybeNextRequest.cookies?.get?.(name)?.value;
  if (fromNextCookies) return fromNextCookies;

  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(name + '=')) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }

  return null;
}

export function isCentralRole(roleCode: string | null | undefined) {
  return CENTRAL_ROLE_CODES.has(String(roleCode ?? '').trim().toUpperCase());
}

export function hasRequiredLocationAccess(
  actual: LocationAccessLevelValue,
  required: LocationAccessLevelValue
) {
  return LOCATION_ACCESS_RANK[actual] >= LOCATION_ACCESS_RANK[required];
}

export async function getAuthenticatedUser(
  req: Request | NextRequest
): Promise<AuthenticatedUser | null> {
  const cookieName = getAuthCookieName();
  const token = readCookieFromRequest(req, cookieName);

  if (!token) return null;

  let payload: Awaited<ReturnType<typeof verifySessionToken>>;

  try {
    payload = await verifySessionToken(token);
  } catch {
    return null;
  }

  const userId = String(payload.uid ?? payload.sub ?? '').trim();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      role: {
        select: {
          code: true,
          isActive: true,
        },
      },
    },
  });

  if (!user || !user.isActive || !user.role?.isActive) return null;

  const roleCode = String(user.role.code ?? '').trim().toUpperCase();

  return {
    id: user.id,
    email: user.email,
    roleCode,
    isCentralRole: isCentralRole(roleCode),
  };
}

export async function requireAuthenticatedUser(req: Request | NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return {
      ok: false as const,
      res: jsonError('Nicht autorisiert.', 401),
    };
  }

  return {
    ok: true as const,
    user,
  };
}

export async function getUserLocationAccess(
  user: AuthenticatedUser
): Promise<LocationAccessEntry[]> {
  if (user.isCentralRole) return [];

  const accessRows = await prisma.userLocationAccess.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    select: {
      locationId: true,
      accessLevel: true,
    },
  });

  return accessRows.map((row) => ({
    locationId: row.locationId,
    accessLevel: row.accessLevel as LocationAccessLevelValue,
  }));
}

export async function canAccessLocation(
  user: AuthenticatedUser,
  locationId: string,
  requiredAccess: LocationAccessLevelValue = 'READ'
) {
  const cleanLocationId = String(locationId ?? '').trim();
  if (!cleanLocationId) return false;

  if (user.isCentralRole) return true;

  const accessRows = await getUserLocationAccess(user);

  return accessRows.some((entry) => {
    return (
      entry.locationId === cleanLocationId &&
      hasRequiredLocationAccess(entry.accessLevel, requiredAccess)
    );
  });
}

export async function requireLocationAccess(
  req: Request | NextRequest,
  locationId: string,
  requiredAccess: LocationAccessLevelValue = 'READ'
) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth;

  const allowed = await canAccessLocation(auth.user, locationId, requiredAccess);

  if (!allowed) {
    return {
      ok: false as const,
      res: jsonError('Forbidden.', 403),
    };
  }

  return {
    ok: true as const,
    user: auth.user,
  };
}

export async function getAllowedLocationIds(user: AuthenticatedUser) {
  if (user.isCentralRole) return null;

  const accessRows = await getUserLocationAccess(user);
  return accessRows.map((entry) => entry.locationId);
}
