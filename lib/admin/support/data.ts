import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupportCase, SupportFilters, SupportRow } from "@/lib/admin/support/types";
import {
  filterAndSortCases,
  isToday,
  normalizeSupportCase,
} from "@/lib/admin/support/utils";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Support intake query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Support intake query skipped for ${label}:`, error);
    return [];
  }
}

export type SupportAdminOption = {
  id: string;
  label: string;
  email: string;
};

export async function getSupportAdminAssignees(): Promise<SupportAdminOption[]> {
  const rows = await safeRows<{
    id?: string;
    email?: string;
    full_name?: string;
    role?: string;
  }>(
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,role")
      .in("role", [
        "founder",
        "owner",
        "super_admin",
        "support_admin",
        "customer_service",
        "tech_support_admin",
        "technical_support",
        "operations",
        "operations_admin",
        "admin",
      ])
      .limit(80),
    "support_admin_assignees"
  );

  const options = rows
    .map((row) => {
      const email = String(row.email || "").trim().toLowerCase();
      const name = String(row.full_name || "").trim();
      const id = String(row.id || "").trim();

      if (!email && !name) return null;

      return {
        id,
        email,
        label: name ? `${name} (${email || "no email"})` : email,
      };
    })
    .filter(Boolean) as SupportAdminOption[];

  options.sort((a, b) => a.label.localeCompare(b.label));

  return options;
}

export async function getSupportData(filters: SupportFilters) {
  const rows = await safeRows<SupportRow>(
    supabaseAdmin
      .from("support_intake_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    "support_intake_cases"
  );

  const cases = rows.map(normalizeSupportCase);
  const filteredCases = filterAndSortCases(cases, filters);

  const openCases = cases.filter(
    (item) => !["closed", "converted"].includes(item.status.toLowerCase())
  );

  const urgentCases = cases.filter((item) =>
    ["urgent", "high"].includes(item.priority.toLowerCase())
  );

  const resolvedToday = cases.filter(
    (item) =>
      ["closed", "converted"].includes(item.status.toLowerCase()) &&
      isToday(item.updatedAt)
  );

  const customerSupport = cases.filter((item) =>
    [
      "customer_support",
      "booking_help",
      "payment_help",
      "refund_request",
      "general_support",
    ].includes(item.caseType)
  );

  const guruSupport = cases.filter((item) => item.caseType === "guru_support");

  const platformIssues = cases.filter(
    (item) => item.caseType === "platform_issue"
  );

  const escalatedCases = cases.filter((item) =>
    ["dispute_request", "trust_safety", "refund_request"].includes(item.caseType)
  );

  const assignees = await getSupportAdminAssignees();

  return {
    cases,
    filteredCases,
    openCases,
    urgentCases,
    resolvedToday,
    customerSupport,
    guruSupport,
    platformIssues,
    escalatedCases,
    assignees,
    totals: {
      all: cases.length,
      open: openCases.length,
      urgent: urgentCases.length,
      resolvedToday: resolvedToday.length,
      converted: cases.filter((item) => item.status === "converted").length,
      filtered: filteredCases.length,
    },
  };
}

export type SupportDashboardData = Awaited<ReturnType<typeof getSupportData>>;

export function isCaseHighlighted(item: SupportCase, caseId: string) {
  if (!caseId) return false;
  const needle = caseId.toLowerCase();
  return (
    item.id === caseId ||
    item.intakeNumber.toLowerCase() === needle
  );
}
