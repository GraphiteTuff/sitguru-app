/**
 * Route-level persona isolation for Rogue / Delilah AI chat.
 *
 * All authorization comes from the validated Supabase JWT session cookie.
 * Client-supplied role / scope / portal flags are never trusted for grants —
 * spoofed admin claims from non-admins yield HTTP 403 before any LLM call.
 *
 * SERVER ONLY — do not import from client components.
 */

import type { CoreMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  resolveChatAudience,
  type ChatAudience,
} from "@/lib/chat/chat-audience";
import { lookupGurusTool } from "@/lib/chat/rogue-guru-tool";
import {
  createAdminBrandSocialFollowersTool,
  createAmbassadorSocialFollowersTool,
} from "@/lib/chat/rogue-social-tool";

export type PersonaSurface = "admin" | "ambassador" | "consumer";

export type PersonaGateOk = {
  ok: true;
  surface: PersonaSurface;
  audience: ChatAudience;
  /** Tools safe to register on streamText for this request. */
  tools: Record<string, unknown>;
  socialMetricsMode: "admin_brand" | "ambassador_self" | "none";
  sessionUserId: string | null;
  sessionEmail: string | null;
};

export type PersonaGateDenied = {
  ok: false;
  status: 403;
  error: string;
  code: "FORBIDDEN_PERSONA_SCOPE" | "SPOOFED_ADMIN_CLAIM" | "AMBASSADOR_REQUIRED";
};

export type PersonaGateResult = PersonaGateOk | PersonaGateDenied;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: unknown) {
  return asString(value).toLowerCase();
}

function messageText(message: CoreMessage | undefined): string {
  if (!message) return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return String((part as { text: string }).text);
        }
        return "";
      })
      .join(" ");
  }
  return "";
}

/**
 * Detect mocked admin / global-scope claims from body fields or prompt text.
 * Legitimate questions ("are you an admin?") are allowed; structured spoof
 * payloads that try to elevate privileges are not.
 */
export function detectSpoofedAdminElevation(opts: {
  body: Record<string, unknown>;
  messages: CoreMessage[];
}): boolean {
  const body = opts.body || {};
  const roleHints = [
    body.role,
    body.user_role,
    body.userRole,
    body.user_type,
    body.userType,
    body.scope,
    body.access_scope,
    body.portal_role,
    body.metadata_role,
  ]
    .map(normalize)
    .filter(Boolean);

  for (const hint of roleHints) {
    if (
      hint === "admin" ||
      hint === "super_admin" ||
      hint === "super-admin" ||
      hint === "founder" ||
      hint === "owner" ||
      hint.includes("scope:admin") ||
      hint.includes("scope=admin")
    ) {
      return true;
    }
  }

  // Nested metadata spoofing
  const metadata = body.metadata;
  if (metadata && typeof metadata === "object") {
    const metaRole = normalize((metadata as { role?: unknown }).role);
    if (metaRole === "admin" || metaRole === "super_admin") return true;
  }

  const joined = opts.messages
    .map((m) => messageText(m))
    .join("\n")
    .slice(0, 8000);

  const spoofPatterns = [
    /\[\[\s*role\s*[:=]\s*admin\s*\]\]/i,
    /\[\[\s*scope\s*[:=]\s*admin\s*\]\]/i,
    /"role"\s*:\s*"(admin|super_admin|founder|owner)"/i,
    /"scope"\s*:\s*"admin"/i,
    /metadata\.role\s*[:=]\s*['"]?admin/i,
    /act as (an? )?(sitguru )?admin (with|and) (global |brand )?access/i,
    /override\s+(auth|role|scope).{0,40}admin/i,
    /force[_-]?inject.{0,40}scope\s*[:=]\s*admin/i,
  ];

  return spoofPatterns.some((re) => re.test(joined));
}

function surfaceFromRequest(
  req: Request,
  body: Record<string, unknown>,
): PersonaSurface {
  const explicit = normalize(
    body.portal || body.surface || body.domainContext || body.domain_context,
  );
  if (explicit === "admin" || explicit.includes("/admin")) return "admin";
  if (
    explicit === "ambassador" ||
    explicit === "delilah" ||
    explicit.includes("/ambassador")
  ) {
    return "ambassador";
  }

  const referer = asString(req.headers.get("referer") || req.headers.get("referrer"));
  try {
    const path = referer ? new URL(referer).pathname : "";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/ambassador")) return "ambassador";
  } catch {
    // ignore bad referer
  }

  const url = asString(req.url);
  if (url.includes("/api/admin/")) return "admin";
  if (url.includes("/api/ambassador/")) return "ambassador";

  return "consumer";
}

/**
 * Validate Supabase session + resolve persona tools for this request.
 * Call BEFORE any LLM provider invocation.
 */
export async function evaluatePersonaRouteGate(opts: {
  req: Request;
  body: Record<string, unknown>;
  messages: CoreMessage[];
}): Promise<PersonaGateResult> {
  const supabase = await createClient();

  // Prefer getUser() (server-validated JWT). Also read getSession() for cookie presence.
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser().catch(() => ({
      data: { user: null as null },
    })),
    supabase.auth.getSession().catch(() => ({
      data: { session: null as null },
    })),
  ]);

  const sessionUser = userData?.user || sessionData?.session?.user || null;
  const sessionUserId = sessionUser?.id ? String(sessionUser.id) : null;
  const sessionEmail = sessionUser?.email
    ? String(sessionUser.email).trim().toLowerCase()
    : null;

  const audience = await resolveChatAudience();
  const surface = surfaceFromRequest(opts.req, opts.body);

  // Hard fail: non-admins attempting admin elevation via body/prompt spoofing.
  if (
    audience.kind !== "admin" &&
    detectSpoofedAdminElevation({
      body: opts.body,
      messages: opts.messages,
    })
  ) {
    return {
      ok: false,
      status: 403,
      code: "SPOOFED_ADMIN_CLAIM",
      error:
        "Forbidden: admin scope cannot be granted from client flags or prompt text. Authenticated admin session required.",
    };
  }

  // Scope A — Admin Portal Semantic Rogue
  if (surface === "admin") {
    if (audience.kind !== "admin") {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN_PERSONA_SCOPE",
        error:
          "Forbidden: Admin Portal Rogue requires a verified admin session.",
      };
    }

    return {
      ok: true,
      surface: "admin",
      audience,
      sessionUserId: audience.userId,
      sessionEmail: audience.email,
      socialMetricsMode: "admin_brand",
      tools: {
        fetchLiveSocialFollowers: createAdminBrandSocialFollowersTool(),
        // Admin chat may also help with guru lookups when relevant.
        lookupGurus: lookupGurusTool,
      },
    };
  }

  // Scope B — Ambassador Portal Delilah
  if (surface === "ambassador") {
    if (audience.kind !== "ambassador") {
      return {
        ok: false,
        status: 403,
        code: "AMBASSADOR_REQUIRED",
        error:
          "Forbidden: Delilah ambassador metrics require an active ambassador session.",
      };
    }

    return {
      ok: true,
      surface: "ambassador",
      audience,
      sessionUserId: audience.userId,
      sessionEmail: audience.email,
      socialMetricsMode: "ambassador_self",
      tools: {
        // Force-injected ambassadorId inside the tool factory — no admin scope.
        fetchLiveSocialFollowers: createAmbassadorSocialFollowersTool(
          audience.ambassador,
        ),
        lookupGurus: lookupGurusTool,
      },
    };
  }

  // Scope C — Pet Parent / public Consumer Rogue
  // Social + growth/business tools are physically omitted from the LLM tool map.
  return {
    ok: true,
    surface: "consumer",
    audience,
    sessionUserId,
    sessionEmail,
    socialMetricsMode: "none",
    tools: {
      lookupGurus: lookupGurusTool,
    },
  };
}

export function personaForbiddenResponse(gate: PersonaGateDenied): Response {
  return Response.json(
    {
      ok: false,
      error: gate.error,
      code: gate.code,
    },
    { status: gate.status },
  );
}
