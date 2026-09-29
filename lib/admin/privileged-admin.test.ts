import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { hasPrivilegedAdminAccess } from "./privileged-admin";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env.SITGURU_FINANCE_ADMIN_EMAILS =
    ORIGINAL_ENV.SITGURU_FINANCE_ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = ORIGINAL_ENV.ADMIN_EMAILS;
  process.env.NEXT_PUBLIC_ADMIN_EMAILS = ORIGINAL_ENV.NEXT_PUBLIC_ADMIN_EMAILS;
});

describe("hasPrivilegedAdminAccess", () => {
  it("lets HQ super admins in when their profile role is pet parent", () => {
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "Jason@SitGuru.com",
        role: "customer",
      }),
      true,
    );
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "nette@sitguru.com",
        role: "customer",
      }),
      true,
    );
  });

  it("lets explicit admin and super admin profile roles in", () => {
    assert.equal(
      hasPrivilegedAdminAccess({ email: "staff@example.com", role: "admin" }),
      true,
    );
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "staff@example.com",
        role: "Super Admin",
      }),
      true,
    );
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "staff@example.com",
        role: "super_admin",
      }),
      true,
    );
  });

  it("rejects a pet parent who is not an HQ super user", () => {
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "parent@example.com",
        role: "customer",
      }),
      false,
    );
  });

  it("honors the env admin email allowlist", () => {
    process.env.SITGURU_FINANCE_ADMIN_EMAILS = "ops@sitguru.com";
    process.env.ADMIN_EMAILS = "";
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "";
    assert.equal(
      hasPrivilegedAdminAccess({
        email: "ops@sitguru.com",
        role: "customer",
      }),
      true,
    );
  });
});
