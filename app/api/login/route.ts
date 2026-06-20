import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, getAuthCookieName } from "@/app/lib/session";

type LoginBody = {
  email?: string;
  password?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password || !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Bitte E-Mail und Passwort eingeben." },
      { status: 400 }
    );
  }

  // Absichtlich generische Fehlermeldung (kein Hinweis, ob E-Mail oder Passwort falsch war)
  const invalid = () =>
    NextResponse.json({ success: false, message: "Ungültige Zugangsdaten." }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        passwordHash: true,
        role: { select: { code: true } },
      },
    });

    if (!user || !user.isActive || !user.passwordHash) return invalid();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid();

    const token = await createSessionToken({
      uid: user.id,
      email: user.email,
      role: user.role.code,
    });

    const res = NextResponse.json({ success: true });

    res.cookies.set(getAuthCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 Stunden
    });

    return res;
  } catch (e) {
    console.error("[login] failed:", e);
    return invalid();
  }
}
