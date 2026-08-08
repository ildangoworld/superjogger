import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

export const ADMIN_GATE_COOKIE = "sj_admin_gate";

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

async function hmacHex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminGateValue(userId: string): Promise<string> {
  const secret = getSupabaseServiceRoleKey();
  const signature = await hmacHex(userId, secret);
  return `${userId}.${signature}`;
}

export async function verifyAdminGateValue(
  value: string | undefined,
  userId: string,
): Promise<boolean> {
  if (!value) {
    return false;
  }
  const separator = value.indexOf(".");
  if (separator <= 0) {
    return false;
  }
  const cookieUserId = value.slice(0, separator);
  if (cookieUserId !== userId) {
    return false;
  }
  const expected = await createAdminGateValue(userId);
  return timingSafeEqualHex(value, expected);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function setAdminGateCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_GATE_COOKIE, await createAdminGateValue(userId), cookieOptions());
}

export async function clearAdminGateCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_GATE_COOKIE, "", cookieOptions(0));
}

export function readAdminGateFromRequest(
  request: NextRequest,
): string | undefined {
  return request.cookies.get(ADMIN_GATE_COOKIE)?.value;
}

export async function hasValidAdminGate(
  request: NextRequest,
  userId: string,
): Promise<boolean> {
  return verifyAdminGateValue(readAdminGateFromRequest(request), userId);
}

export async function readAdminGateFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ADMIN_GATE_COOKIE)?.value;
}
