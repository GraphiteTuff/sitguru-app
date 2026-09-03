import Link from "next/link";
import { ArrowLeft, Gift, Plus } from "lucide-react";
import RewardsAuditor, {
  type FraudAuditRow,
  type LeaderboardRow,
  type SharedLinkStat,
} from "@/components/admin/RewardsAuditor";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceDenied,
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadReferralAccounting } from "@/lib/admin/referrals/accounting";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function safeSelect(table: string) {
  try {
    const { data, error } = await supabaseAdmin.from(table).select("*").limit(500);
    if (error) return [];
    return (data || []) as AnyRow[];
  } catch {
    return [];
  }
}

function buildFraudRows(conflicts: AnyRow[]): FraudAuditRow[] {
  return conflicts.slice(0, 50).map((row, index) => ({
    id: text(row.id) || `fraud-${index}`,
    signal:
      text(row.conflict_type || row.signal || row.reason) ||
      "Duplicate redeem attempt",
    detail:
      text(row.detail || row.notes || row.message || row.description) ||
      "Same IP or payment fingerprint attempted multiple redemptions.",
    ipOrFingerprint:
      text(
        row.ip_address ||
          row.ip ||
          row.device_fingerprint ||
          row.fingerprint ||
          row.visitor_id,
      ) || "—",
    paymentHint:
      text(
        row.payment_method_hash ||
          row.payment_fingerprint ||
          row.card_fingerprint ||
          row.stripe_customer_id ||
          row.payment_hint,
      ) || "—",
    status: text(row.status || row.review_status) || "needs_review",
    createdAt: text(row.created_at || row.updated_at) || "",
  }));
}

export default async function AdminRewardsPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to audit referral rewards and conversion leaders."
      />
    );
  }

  const [accounting, conflictsA, conflictsB] = await Promise.all([
    loadReferralAccounting(),
    safeSelect("pawperks_referral_conflicts"),
    safeSelect("referral_conflicts"),
  ]);

  const tracked = accounting.codes.filter(
    (row) => row.visits + row.scans + row.signups > 0,
  );
  const sharedLinkRows: SharedLinkStat[] = (tracked.length
    ? tracked
    : accounting.codes
  )
    .slice(0, 40)
    .map((row) => {
      const links = row.visits + row.scans;
      return {
        code: row.code,
        ownerName: row.ownerName,
        ownerEmail: row.ownerEmail,
        programType: row.programLabel,
        linksGenerated: links,
        conversions: row.signups,
        conversionRate: links > 0 ? row.signups / links : 0,
      };
    });

  const sharedLinksGenerated = accounting.totals.visits + accounting.totals.scans;
  const fraudRows = buildFraudRows([...conflictsA, ...conflictsB]);
  const leaderboard: LeaderboardRow[] = tracked
    .slice()
    .sort((a, b) => {
      const aRate = a.visits + a.scans > 0 ? a.signups / (a.visits + a.scans) : 0;
      const bRate = b.visits + b.scans > 0 ? b.signups / (b.visits + b.scans) : 0;
      if (bRate !== aRate) return bRate - aRate;
      return b.visits + b.scans - (a.visits + a.scans);
    })
    .slice(0, 25)
    .map((row, index) => ({
      rank: index + 1,
      name: row.ownerName,
      email: row.ownerEmail,
      code: row.code,
      conversions: row.signups,
      clicks: row.visits + row.scans,
      conversionRate:
        row.visits + row.scans > 0 ? row.signups / (row.visits + row.scans) : 0,
      revenue: 0,
    }));

  return (
    <GrowthPageFrame
      kicker="Rewards Workplace"
      title="Pay the person who actually earned the referral."
      detail="Tracked visits and QR scans come from the live event stream. Rewards stay closed until a referred member signs up. HQ gets a bell when that happens."
      action={
        <Link
          href="/admin/referrals/codes#generate-code"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Plus size={17} />
          Generate code
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/referrals"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          <ArrowLeft size={14} />
          Referrals workplace
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Tracked hits"
          value={sharedLinksGenerated}
          helper={`${accounting.totals.visits} visits · ${accounting.totals.scans} QR`}
          tone="violet"
          icon={<Gift size={18} />}
        />
        <AdminThemeCard
          label="Signups captured"
          value={accounting.totals.signups}
          helper="Reward-eligible joins"
          tone="emerald"
        />
        <AdminThemeCard
          label="Needs owner"
          value={accounting.totals.missingOwners}
          helper="Cannot pay these codes"
          tone="amber"
        />
        <AdminThemeCard
          label="Fraud flags"
          value={fraudRows.length}
          helper="Conflict ledger"
          tone="rose"
        />
      </section>

      {accounting.totals.signups === 0 ? (
        <GrowthCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-950">
            No attributed signups yet
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-900">
            {sharedLinksGenerated} tracked hits are live. A reward is created
            only after someone registers with the code. The next captured
            signup alerts every HQ admin.
          </p>
        </GrowthCard>
      ) : null}

      <RewardsAuditor
        sharedLinksGenerated={sharedLinksGenerated}
        sharedLinkRows={sharedLinkRows}
        fraudRows={fraudRows}
        leaderboard={leaderboard}
      />
    </GrowthPageFrame>
  );
}
