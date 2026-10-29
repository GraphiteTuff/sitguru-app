/**
 * Shared inbox portal context.
 * A role query is a request, not a grant. It is used only when the account
 * is already allowed to open that portal.
 */

import type { DashboardSwitchRole } from "@/lib/dashboard/role-switch";

export type MessagePortal = "customer" | "guru" | "ambassador" | "admin";

const PORTAL_ROLE: Record<MessagePortal, DashboardSwitchRole> = {
  customer: "parent",
  guru: "guru",
  ambassador: "ambassador",
  admin: "admin",
};

export function isSharedMessagePath(pathname: string | null | undefined) {
  const path = String(pathname || "");
  return path === "/messages" || path.startsWith("/messages/");
}

export function normalizeMessagePortal(value: unknown): MessagePortal | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!raw) return null;
  if (raw === "guru" || raw === "provider" || raw === "sitter" || raw === "pet_guru") return "guru";
  if (raw === "ambassador") return "ambassador";
  if (raw === "admin" || raw === "support") return "admin";
  if (
    raw === "customer" ||
    raw === "parent" ||
    raw === "pet_parent" ||
    raw === "petparent" ||
    raw === "both"
  ) {
    return raw === "both" ? null : "customer";
  }
  return null;
}

export function messagePortalFromReturnPath(returnTo: string | null | undefined): MessagePortal | null {
  const path = String(returnTo || "").trim();
  if (path.startsWith("/guru/")) return "guru";
  if (path.startsWith("/ambassador/")) return "ambassador";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/customer/")) return "customer";
  return null;
}

function canUsePortal(portal: MessagePortal, authorized: ReadonlySet<DashboardSwitchRole>) {
  if (authorized.size === 0) return portal === "customer";
  return authorized.has(PORTAL_ROLE[portal]);
}

function rolesFromStoredHeader(storedRole: string | null | undefined): DashboardSwitchRole[] {
  const role = String(storedRole || "").trim().toLowerCase();
  if (role === "both") return ["parent", "guru"];
  if (role === "admin") return ["admin", "parent"];
  if (role === "growth") return ["growth", "parent"];
  if (role === "ambassador") return ["ambassador", "parent"];
  if (role === "guru") return ["guru"];
  if (role === "intern") return ["intern", "parent"];
  return ["parent"];
}

export function resolveAuthorizedMessagePortal(input: {
  requestedRole?: string | null;
  returnTo?: string | null;
  authorizedRoles?: readonly DashboardSwitchRole[] | null;
  fallbackRole?: string | null;
}): MessagePortal {
  const authorized = new Set(input.authorizedRoles || []);
  const requested = normalizeMessagePortal(input.requestedRole);
  if (requested && canUsePortal(requested, authorized)) return requested;

  const fromReturn = messagePortalFromReturnPath(input.returnTo);
  if (fromReturn && canUsePortal(fromReturn, authorized)) return fromReturn;

  const fallback = normalizeMessagePortal(input.fallbackRole);
  if (fallback && canUsePortal(fallback, authorized)) return fallback;

  if (authorized.size === 1) {
    if (authorized.has("guru")) return "guru";
    if (authorized.has("ambassador")) return "ambassador";
    if (authorized.has("admin")) return "admin";
  }

  return "customer";
}

export function headerModeForSharedMessages(input: {
  pathname: string | null;
  isLoggedIn: boolean;
  storedRole?: string | null;
  requestedRole?: string | null;
  returnTo?: string | null;
  authorizedRoles?: readonly DashboardSwitchRole[] | null;
}): MessagePortal | null {
  if (!input.isLoggedIn || !isSharedMessagePath(input.pathname)) return null;

  const authorized = input.authorizedRoles?.length
    ? input.authorizedRoles
    : rolesFromStoredHeader(input.storedRole);

  return resolveAuthorizedMessagePortal({
    requestedRole: input.requestedRole,
    returnTo: input.returnTo,
    authorizedRoles: authorized,
    fallbackRole: input.storedRole === "both" ? "customer" : input.storedRole,
  });
}

export function messageInboxHref(
  role: string | null | undefined,
  returnTo: string,
  filter = "all",
  query = "",
) {
  const portal = normalizeMessagePortal(role) || "customer";
  const params = new URLSearchParams();
  params.set("role", portal);
  if (returnTo) params.set("returnTo", returnTo);
  if (filter && filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  return `/messages?${params.toString()}`;
}

export function messageConversationHref(
  conversationId: string,
  role: string | null | undefined,
  returnTo: string,
) {
  const params = new URLSearchParams(messageInboxHref(role, returnTo).split("?")[1] || "");
  return `/messages/${encodeURIComponent(conversationId)}?${params.toString()}`;
}

export function messageSupportHref(role: string | null | undefined, returnTo: string) {
  return messageInboxHref(role, returnTo).replace("/messages?", "/messages/admin?");
}

export function messageContinuationHref(
  path: string,
  role: string | null | undefined,
  returnTo: string | null | undefined,
) {
  const portal = normalizeMessagePortal(role);
  const params = new URLSearchParams();
  if (portal) params.set("role", portal);
  const safeReturn = String(returnTo || "").trim();
  if (safeReturn.startsWith("/") && !safeReturn.startsWith("//")) params.set("returnTo", safeReturn);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
