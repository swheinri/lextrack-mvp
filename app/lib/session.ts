import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const AUTH_COOKIE_NAME = "lextrack_auth";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET fehlt (Environment Variable).");
  return new TextEncoder().encode(secret);
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export async function createSessionToken(payload: {
  uid: string;
  email: string;
  role: string;
}) {
  const secret = getSecret();

  return await new SignJWT({
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<
  JWTPayload & {
    uid?: string;
    email?: string;
    role?: string;
  }
> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as any;
}
