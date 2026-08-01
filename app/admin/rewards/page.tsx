import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import RewardsAuditor, {
  type FraudAuditRow,
  type LeaderboardRow,
  type SharedLinkStat,
} from "@/components/admin/RewardsAuditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, unknown>;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function safeSelect(table: string, columns = "*") {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .limit(500);
    if (error) {
      console.warn(`[admin/rewards] ${table} skipped:`, error.message);
      return [] as AnyRow[];
    }
    return (data || []) as AnyRow[];
  } catch (error) {
    console.warn(`[admin/rewards] ${table} failed:`, error);
    return [] as AnyRow[];
  }
}

function buildSharedLinkRows(codes: AnyRow[]): SharedLinkStat[] {
  return codes
    .map((row) => {
      const links = asNumber(row.usage_count ?? row.click_count ?? row.clicks);
      const conversions = asNumber(
        row.converted_count ?? row.booking_count ?? row.conversions,
      );
      return {
        code: asText(row.normalized_code || row.code) || "—",
        ownerName:
          asText(row.owner_name || row.issued_to_name) || "Unknown owner",
        ownerEmail: asText(row.owner_email || row.issued_to_email) || "—",
        programType:
          asText(row.program_type || row.owner_type || row.source) || "PetPerks",
        linksGenerated: links,
        conversions,
        conversionRate: links > 0 ? conversions / links : 0,
      };
    })
    .sort((a, b) => b.linksGenerated - a.linksGenerated)
    .slice(0, 40);
}

function buildFraudRows(conflicts: AnyRow[]): FraudAuditRow[] {
  return conflicts.slice(0, 50).map((row, index) => ({
    id: asText(row.id) || `fraud-${index}`,
    signal:
      asText(row.conflict_type || row.signal || row.reason) ||
      "Duplicate redeem attempt",
    detail:
      asText(row.detail || row.notes || row.message || row.description) ||
      "Same IP or payment fingerprint attempted multiple redemptions.",
    ipOrFingerprint:
      asText(
        row.ip_address ||
          row.ip ||
          row.device_fingerprint ||
          row.fingerprint ||
          row.visitor_id,
      ) || "—",
    paymentHint:
      asText(
        row.payment_method_hash ||
          row.payment_fingerprint ||
          row.card_fingerprint ||
          row.stripe_customer_id ||
          row.payment_hint,
      ) || "—",
    status: asText(row.status || row.review_status) || "needs_review",
    createdAt: asText(row.created_at || row.updated_at) || "",
  }));
}

function buildLeaderboard(codes: AnyRow[]): LeaderboardRow[] {
  return codes
    .map((row) => {
      const clicks = asNumber(row.usage_count ?? row.click_count ?? row.clicks);
      const conversions = asNumber(
        row.converted_count ?? row.booking_count ?? row.conversions,
      );
      return {
        rank: 0,
        name: asText(row.owner_name || row.issued_to_name) || "Ambassador",
        email: asText(row.owner_email || row.issued_to_email) || "—",
        code: asText(row.normalized_code || row.code) || "—",
        conversions,
        clicks,
        conversionRate: clicks > 0 ? conversions / clicks : 0,
        revenue: asNumber(row.revenue_amount ?? row.revenue),
      };
    })
    .filter((row) => row.clicks > 0 || row.conversions > 0)
    .sort((a, b) => {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.conversions - a.conversions;
    })
    .slice(0, 25)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export default async function AdminRewardsPage() {
  const [codes, conflictsA, conflictsB] = await Promise.all([
    safeSelect("referral_codes"),
    safeSelect("pawperks_referral_conflicts"),
    safeSelect("referral_conflicts"),
  ]);

  const sharedLinkRows = buildSharedLinkRows(codes);
  const sharedLinksGenerated = sharedLinkRows.reduce(
    (sum, row) => sum + row.linksGenerated,
    0,
  );
  const fraudRows = buildFraudRows([...conflictsA, ...conflictsB]);
  const leaderboard = buildLeaderboard(codes);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <Gift className="h-4 w-4" />
            PetPerks × PawPerks telemetry
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Rewards Auditor
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
            Monitor shared-link volume, fraud-prevention ledger signals, and
            ambassador conversion leaders tying public PetPerks promotions to
            internal PawPerks credit.
          </p>
        </section>

        <RewardsAuditor
          sharedLinksGenerated={sharedLinksGenerated}
          sharedLinkRows={sharedLinkRows}
          fraudRows={fraudRows}
          leaderboard={leaderboard}
        />
      </div>
    </main>
  );
}
