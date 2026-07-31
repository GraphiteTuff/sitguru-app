/**
 * Mock admin gate for localized broadcast integration checks.
 * Always succeeds as an active SitGuru admin.
 */

export function createSupabaseAdminClient() {
  return {};
}

export const supabaseAdmin = {};

export function getBearerToken() {
  return "mock-admin-token";
}

export async function requireAdminUser() {
  return {
    supabaseAdmin: {},
    adminUser: {
      id: "mock-admin-id",
      email: "jason@sitguru.com",
    },
    adminProfile: {
      id: "mock-admin-id",
      role: "admin",
      account_status: "active",
    },
  };
}

export async function requireAuthenticatedUser() {
  return {
    supabaseAdmin: {},
    user: {
      id: "mock-admin-id",
      email: "jason@sitguru.com",
    },
  };
}
