/**
 * Shared Admin User Directory action catalog + URL builders.
 * Keep all Communication / Moderation destinations here so desktop,
 * mobile web, and webapp panels never hardcode fragile query strings.
 */

export type AdminDepartmentKey =
  | "executive"
  | "billing_finance"
  | "customer_service"
  | "trust_safety"
  | "tech_support"
  | "sales_marketing";

export type DirectoryUserContext = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  source?: string | null;
};

export type AdminDepartmentAction = {
  key: AdminDepartmentKey;
  label: string;
  description: string;
  toneClass: string;
};

export type ModerationPipelineKey =
  | "guru_approvals"
  | "message_center"
  | "fraud_trust_review";

export type ModerationPipelineAction = {
  key: ModerationPipelineKey;
  label: string;
  description: string;
  href: string;
  toneClass: string;
};

export const ADMIN_DEPARTMENT_ACTIONS: AdminDepartmentAction[] = [
  {
    key: "tech_support",
    label: "Tech Support",
    description: "Logins, MFA, bugs, integrations, and system health.",
    toneClass:
      "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-300",
  },
  {
    key: "customer_service",
    label: "Customer Service",
    description: "Pet Parents, Gurus, bookings, and support issues.",
    toneClass:
      "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 focus-visible:ring-violet-300",
  },
  {
    key: "billing_finance",
    label: "Billing & Finance",
    description: "Stripe, payouts, NFCU, Plaid, and reconciliation.",
    toneClass:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300",
  },
];

export const ADMIN_INTERNAL_MESSAGE_ACTION = {
  key: "internal" as const,
  label: "Start Internal Message",
  description: "Open an HQ staff thread from the User Directory.",
  toneClass:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-emerald-300",
};

export const MODERATION_PIPELINE_ACTIONS: ModerationPipelineAction[] = [
  {
    key: "guru_approvals",
    label: "Review Guru Applications",
    description: "Open the Guru approvals queue.",
    href: "/admin/guru-approvals",
    toneClass:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300",
  },
  {
    key: "message_center",
    label: "Open Message Center",
    description: "Jump to the Admin Message Center inbox.",
    href: "/admin/messages",
    toneClass:
      "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-300",
  },
  {
    key: "fraud_trust_review",
    label: "Fraud / Trust Review",
    description: "Open trust review context or flag the selected account.",
    href: "/admin/fraud",
    toneClass:
      "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-300",
  },
];

const DEPARTMENT_LABELS: Record<AdminDepartmentKey, string> = {
  executive: "Executive / Founder",
  billing_finance: "Billing & Finance",
  customer_service: "Customer Service",
  trust_safety: "Trust & Safety",
  tech_support: "Tech Support",
  sales_marketing: "Sales & Marketing",
};

export function asActionString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getDepartmentLabel(key: string) {
  const normalized = asActionString(key) as AdminDepartmentKey;
  return DEPARTMENT_LABELS[normalized] || asActionString(key) || "SitGuru HQ";
}

export function isAdminDepartmentKey(value: string): value is AdminDepartmentKey {
  return value in DEPARTMENT_LABELS;
}

export function normalizeDirectoryUser(
  user?: DirectoryUserContext | null,
): DirectoryUserContext | null {
  if (!user) return null;

  const id = asActionString(user.id);
  const email = asActionString(user.email);
  const name = asActionString(user.name);
  const role = asActionString(user.role);
  const source = asActionString(user.source);

  if (!id && !email) return null;

  return {
    id: id || null,
    email: email && email !== "—" ? email : null,
    name: name || null,
    role: role || null,
    source: source || null,
  };
}

function appendUserContext(
  params: URLSearchParams,
  user?: DirectoryUserContext | null,
) {
  const safe = normalizeDirectoryUser(user);
  if (!safe) return;

  if (safe.id) params.set("user", safe.id);
  if (safe.email) params.set("email", safe.email);
  if (safe.name) params.set("name", safe.name);
  if (safe.role) params.set("role", safe.role);
  if (safe.source) params.set("source", safe.source);
}

/** Compose fallback when instant provisioning is unavailable. */
export function buildDepartmentComposeHref(params: {
  department: AdminDepartmentKey | string;
  departmentLabel?: string;
  user?: DirectoryUserContext | null;
}) {
  const query = new URLSearchParams({
    threadType: "internal_department",
    department: asActionString(params.department),
    departmentLabel:
      asActionString(params.departmentLabel) ||
      getDepartmentLabel(params.department),
  });

  const safe = normalizeDirectoryUser(params.user);
  if (safe?.id) query.set("recipientId", safe.id);
  if (safe?.email) query.set("recipientEmail", safe.email);
  if (safe?.name) query.set("recipientName", safe.name);
  if (safe?.role) query.set("recipientRole", safe.role);
  if (safe?.source) query.set("source", safe.source);

  return `/admin/messages?${query.toString()}`;
}

export function buildInternalComposeHref(user?: DirectoryUserContext | null) {
  const query = new URLSearchParams({
    threadType: "internal",
    messageCategory: "direct",
  });

  const safe = normalizeDirectoryUser(user);
  if (safe?.id) query.set("recipientId", safe.id);
  if (safe?.email) query.set("recipientEmail", safe.email);
  if (safe?.name) query.set("recipientName", safe.name);
  if (safe?.role) query.set("recipientRole", safe.role);
  if (safe?.source) query.set("source", safe.source);

  return `/admin/messages?${query.toString()}`;
}

export function buildMessageCenterHref(user?: DirectoryUserContext | null) {
  const query = new URLSearchParams();
  appendUserContext(query, user);
  const qs = query.toString();
  return qs ? `/admin/messages?${qs}` : "/admin/messages";
}

export function buildGuruApprovalsHref(user?: DirectoryUserContext | null) {
  const query = new URLSearchParams();
  appendUserContext(query, user);
  const qs = query.toString();
  return qs ? `/admin/guru-approvals?${qs}` : "/admin/guru-approvals";
}

export function buildFraudTrustHref(user?: DirectoryUserContext | null) {
  const query = new URLSearchParams({ review: "1" });
  appendUserContext(query, user);
  return `/admin/fraud?${query.toString()}`;
}

export function buildModerationHref(user?: DirectoryUserContext | null) {
  const query = new URLSearchParams({ review: "1" });
  appendUserContext(query, user);
  return `/admin/moderation?${query.toString()}`;
}

export function buildAdminThreadHref(conversationId: string) {
  const id = asActionString(conversationId);
  if (!id) return "/admin/messages";
  return `/admin/messages/${encodeURIComponent(id)}`;
}
