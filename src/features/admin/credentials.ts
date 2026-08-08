import { ADMIN_PERMISSION_KEYS } from "@/features/admin/permissions";
import type { AdminPermissionKey } from "@/features/admin/types";
import { getAdminId, getAdminPassword } from "@/lib/supabase/env";

const ADMIN_AUTH_EMAIL_DOMAIN = "admin.internal";

export function adminIdToAuthEmail(adminId: string): string {
  return `admin+${adminId.toLowerCase()}@${ADMIN_AUTH_EMAIL_DOMAIN}`;
}

export function getEnvAdminCredentials(): {
  id: string;
  password: string;
  authEmail: string;
} | null {
  try {
    const id = getAdminId();
    const password = getAdminPassword();
    return { id, password, authEmail: adminIdToAuthEmail(id) };
  } catch {
    return null;
  }
}

export function superAdminPermissions(): AdminPermissionKey[] {
  return [...ADMIN_PERMISSION_KEYS];
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < bufA.byteLength; i += 1) {
    mismatch |= bufA[i]! ^ bufB[i]!;
  }
  return mismatch === 0;
}
