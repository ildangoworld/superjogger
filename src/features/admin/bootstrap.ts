import {
  adminIdToAuthEmail,
  getEnvAdminCredentials,
  superAdminPermissions,
} from "@/features/admin/credentials";
import type { AdminDb } from "@/features/admin/admin-db";

async function findAuthUserByEmail(db: AdminDb, email: string) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (found) {
      return found;
    }
    if (data.users.length < perPage) {
      return null;
    }
    page += 1;
  }
}

export async function ensureEnvSuperAdmin(db: AdminDb): Promise<{
  userId: string;
  authEmail: string;
}> {
  const credentials = getEnvAdminCredentials();
  if (!credentials) {
    throw new Error("ADMIN_ID or ADMIN_PASSWORD is not set");
  }

  const authEmail = adminIdToAuthEmail(credentials.id);
  const existing = await findAuthUserByEmail(db, authEmail);

  let userId: string;
  if (!existing) {
    const { data, error } = await db.auth.admin.createUser({
      email: authEmail,
      password: credentials.password,
      email_confirm: true,
      user_metadata: {
        admin_login_id: credentials.id,
        onboarding_completed: true,
      },
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? "관리자 계정을 만들지 못했어요.");
    }
    userId = data.user.id;
  } else {
    const { error } = await db.auth.admin.updateUserById(existing.id, {
      password: credentials.password,
      email_confirm: true,
      user_metadata: {
        ...existing.user_metadata,
        admin_login_id: credentials.id,
        onboarding_completed: true,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    userId = existing.id;
  }

  const { error: adminError } = await db.from("admin_users").upsert(
    {
      user_id: userId,
      role: "SUPER",
      permissions: superAdminPermissions(),
    },
    { onConflict: "user_id" },
  );
  if (adminError) {
    throw new Error(adminError.message);
  }

  return { userId, authEmail };
}
