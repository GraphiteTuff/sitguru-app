/**
 * Resolve the signed-in user for API routes from either:
 * - Authorization: Bearer <access_token> (SitGuru mobile / cross-origin)
 * - Cookie session (SitGuru web/desktop)
 *
 * Never expose the service role to clients. This only verifies the user JWT.
 */

import type { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

import {
  createSupabaseAdminClient,
  getBearerToken,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResolvedRequestUser = {
  user: User;
  authSource: "bearer" | "cookie";
};

const ALLOWED_LOCAL_ORIGINS = new Set([
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getConfiguredAllowedOrigins() {
  const values = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITGURU_WEB_URL,
  ];

  return new Set(
    values
      .map((value) => (value ? normalizeOrigin(value) : ""))
      .filter(Boolean),
  );
}

export function isMobileAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (!normalized) return false;
  if (ALLOWED_LOCAL_ORIGINS.has(normalized)) return true;
  if (getConfiguredAllowedOrigins().has(normalized)) return true;

  try {
    const url = new URL(normalized);
    return (
      url.hostname === "sitguru.com" ||
      url.hostname.endsWith(".sitguru.com")
    );
  } catch {
    return false;
  }
}

/** CORS headers for Expo web / mobile browsers hitting SitGuru APIs. */
export function mobileCorsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";
  if (!origin || !isMobileAllowedOrigin(origin)) {
    return headers;
  }

  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With, Idempotency-Key";
  headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;

  return headers;
}

export async function resolveRequestUser(
  request: Request,
): Promise<ResolvedRequestUser | null> {
  const bearer = getBearerToken(request);

  if (bearer) {
    try {
      const admin = createSupabaseAdminClient();
      const {
        data: { user },
        error,
      } = await admin.auth.getUser(bearer);

      if (!error && user) {
        return { user, authSource: "bearer" };
      }
    } catch {
      // Fall through to cookie session.
    }
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return { user, authSource: "cookie" };
    }
  } catch {
    return null;
  }

  return null;
}

export async function requireRequestUser(request: Request) {
  const resolved = await resolveRequestUser(request);

  if (!resolved) {
    throw new Error("Unauthorized");
  }

  return resolved;
}

export function optionsWithMobileCors(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: mobileCorsHeaders(req),
  });
}
