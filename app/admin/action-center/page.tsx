import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";
import { contractorAttentionCounts } from "@/lib/staff-time/attention-counts";
import { listPeriodsNeedingAttention } from "@/lib/staff-time/queries";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { formatPeriodLabel } from "@/lib/staff-time/periods";
import StatusChip from "@/components/staff-time/StatusChip";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

type CountResult = { value: number | null; available: boolean };

async function safeCount(
  table: string,
  filters: Array<{
    column: string;
    operator: "eq" | "neq" | "is" | "in" | "gte";
    value: string | number | boolean | null | string[];
  }> = [],
): Promise<CountResult> {
  try {
    let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    for (const filter of filters) {
      if (filter.operator === "eq") query = query.eq(filter.column, filter.value);
      if (filter.operator === "neq") query = query.neq(filter.column, filter.value);
      if (filter.operator === "is") query = query.is(filter.column, filter.value);
      if (filter.operator === "in" && Array.isArray(filter.value)) {
        query = query.in(filter.column, filter.value);
      }
      if (filter.operator === "gte") query = query.gte(filter.column, filter.value);
    }
    const { count, error } = await query;
    if (error) return { value: null, available: false };
    return { value: count ?? 0, available: true };
  } catch {
    return { value: null, available: false };
  }
}

function formatCount(result: CountResult) {
  return result.available && result.value !== null
    ? result.value.toLocaleString()
    : "Review";
}

export default async function AdminActionCenterPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/action-center");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/action-center");

  const [pendingGurus, unreadMessages, payoutsReview, contractorCounts, contractorItems] =
    await Promise.all([
      safeCount("gurus", [
        {
          column: "application_status",
          operator: "in",
          value: [
            "new",
            "reviewing",
            "needs_info",
            "verification_pending",
            "pending",
          ],
        },
      ]),
      safeCount("messages", [
        { column: "is_read", operator: "eq", value: false },
        { column: "recipient_role", operator: "eq", value: "admin" },
      ]),
      safeCount("payouts", [
        {
          column: "status",
          operator: "in",
          value: ["pending", "review", "needs_review", "failed"],
        },
      ]),
      contractorAttentionCounts(),
      listPeriodsNeedingAttention(),
    ]);

  const queue = [
    {
      label: "Contractor Hours Awaiting Approval",
      value: contractorCounts.available
        ? String(contractorCounts.hoursAwaitingApproval)
        : "Review",
      href: "/admin/financials/contractor-hours",
      priority: "High" as const,
    },
    {
      label: "Contractor Payables Awaiting Payment",
      value: contractorCounts.available
        ? String(contractorCounts.awaitingPayment)
        : "Review",
      href: "/admin/financials/contractor-payments",
      priority: "High" as const,
    },
    {
      label: "Pending Gurus",
      value: formatCount(pendingGurus),
      href: "/admin/guru-approvals",
      priority: "High" as const,
    },
    {
      label: "Unread Messages",
      value: formatCount(unreadMessages),
      href: "/admin/messages",
      priority: "High" as const,
    },
    {
      label: "Guru Payouts Review",
      value: formatCount(payoutsReview),
      href: "/admin/payouts",
      priority: "Review" as const,
    },
    {
      label: "Manager Oversight",
      value: "Open",
      href: "/admin/managers",
      priority: "Monitor" as const,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Overview & Work · Action Center"
      title="Needs your attention"
      detail="Unified Super Admin queue. Every card opens a live review route — no placeholders."
      action={<GrowthPrimaryLink href="/admin">Back to Overview</GrowthPrimaryLink>}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {queue.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="min-w-0 rounded-[1.4rem] border border-rose-100 bg-rose-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">
              {item.priority} · {item.label}
            </p>
            <p className="mt-2 text-3xl font-black text-rose-950">{item.value}</p>
            <p className="mt-2 text-sm font-black text-rose-800">Open →</p>
          </Link>
        ))}
      </section>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Contractor service logs</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Submitted and payable periods from Manager Portal My Weekly Hours.
        </p>
        <div className="mt-4 space-y-3">
          {contractorItems.slice(0, 12).map((item) => (
            <Link
              key={item.period.id}
              href={
                item.period.status === "submitted" ||
                item.period.status === "needs_correction"
                  ? "/admin/financials/contractor-hours"
                  : "/admin/financials/contractor-payments"
              }
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-[#FAF6EE] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {item.engagement.displayName}
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  {formatPeriodLabel({
                    start: item.period.periodStart,
                    end: item.period.periodEnd,
                  })}{" "}
                  · {formatHours(item.period.totalHours)} hrs ·{" "}
                  {formatUsdFromCents(item.period.amountCents)}
                </p>
              </div>
              <StatusChip status={item.period.status} label={item.statusLabel} />
            </Link>
          ))}
          {!contractorItems.length ? (
            <p className="text-sm font-semibold text-slate-500">
              No contractor periods need attention.
            </p>
          ) : null}
        </div>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
