import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterAdminMenuItems,
  hasAdminPermission,
  normalizePermissions,
} from "./permissions.ts";

describe("admin permissions", () => {
  it("SUPER bypasses permission keys", () => {
    const admin = { role: "SUPER" as const, permissions: [] };
    assert.equal(hasAdminPermission(admin, "members"), true);
    assert.equal(hasAdminPermission(admin, "settings"), true);
  });

  it("STAFF only gets listed permissions", () => {
    const admin = {
      role: "STAFF" as const,
      permissions: ["dashboard" as const],
    };
    assert.equal(hasAdminPermission(admin, "dashboard"), true);
    assert.equal(hasAdminPermission(admin, "members"), false);
  });

  it("normalizes unknown permission strings out", () => {
    assert.deepEqual(normalizePermissions(["dashboard", "hack", "legal"]), [
      "dashboard",
      "legal",
    ]);
  });

  it("always keeps account menu and hides unauthorized depth-1 items", () => {
    const admin = {
      role: "STAFF" as const,
      permissions: ["dashboard" as const],
    };
    const items = [
      { key: "dashboard", permission: "dashboard" as const },
      { key: "members", permission: "members" as const },
      {
        key: "settings",
        permission: "settings" as const,
        children: [
          { key: "settings-ai", permission: "settings" as const },
          {
            key: "settings-admins",
            permission: "settings" as const,
            requiresSuper: true,
          },
          { key: "settings-account", permission: null },
        ],
      },
    ];
    const visible = filterAdminMenuItems(admin, items);
    assert.deepEqual(
      visible.map((item) => item.key),
      ["dashboard", "settings"],
    );
    assert.deepEqual(
      visible[1]?.children?.map((item) => item.key),
      ["settings-account"],
    );
  });

  it("hides SUPER-only menu children from STAFF", () => {
    const admin = {
      role: "STAFF" as const,
      permissions: ["settings" as const],
    };
    const items = [
      {
        key: "settings",
        permission: "settings" as const,
        children: [
          { key: "settings-ai", permission: "settings" as const },
          {
            key: "settings-admins",
            permission: "settings" as const,
            requiresSuper: true,
          },
          { key: "settings-account", permission: null },
        ],
      },
    ];
    const visible = filterAdminMenuItems(admin, items);
    assert.deepEqual(
      visible[0]?.children?.map((item) => item.key),
      ["settings-ai", "settings-account"],
    );
  });
});
