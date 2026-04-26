import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const COOKIE_NAME = "ubis_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  username: string;
  exp: number;
};

function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET is required.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function encode(payload: SessionPayload): string {
  const payloadString = JSON.stringify(payload);
  const encoded = Buffer.from(payloadString, "utf-8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = sign(encoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (Date.now() >= parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getCookieToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }
  const parts = cookieHeader.split(";").map((entry) => entry.trim());
  const match = parts.find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  if (!match) {
    return null;
  }
  return match.slice(COOKIE_NAME.length + 1);
}

export async function requireAdminPageSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !decode(token)) {
    redirect("/admin/login");
  }
}

export function isAdminRequest(request: Request): boolean {
  const token = getCookieToken(request.headers.get("cookie"));
  return token ? Boolean(decode(token)) : false;
}

export function createAdminSessionResponse(username: string): NextResponse {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = encode({ username, exp });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function clearAdminSessionResponse(): NextResponse {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    throw new Error("ADMIN_PASSWORD is required.");
  }
  return username === expectedUser && password === expectedPassword;
}
