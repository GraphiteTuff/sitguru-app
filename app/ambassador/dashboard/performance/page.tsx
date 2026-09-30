import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AmbassadorPerformanceClient from "@/components/ambassador/AmbassadorPerformanceClient";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambassador Performance",
  description:
    "Mobile referral link, weekly signups, and payout receipts for SitGuru Ambassadors.",
};

async function assertAmbassadorAccess(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role,account_type")
    .eq("id", userId)
    .maybeSingle();

  const role = String(
    (profile as { role?: string } | null)?.role || "",
  ).toLowerCase();
  const accountType = String(
    (profile as { account_type?: string } | null)?.account_type || "",
  ).toLowerCase();

  if (
    role === "admin" ||
    role === "super_admin" ||
    role === "ambassador" ||
    accountType.includes("ambassador")
  ) {
    return true;
  }

  const { data: ledger } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(ledger?.id);
}

/**
 * Mobile-first self-service performance portal.
 * Mounted at /ambassador/dashboard/performance — linked from the main dashboard.
 */
export default async function AmbassadorPerformancePortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ambassador/login");
  }

  const allowed = await assertAmbassadorAccess(user.id);
  if (!allowed) {
    redirect("/ambassador/login?error=ambassador-required");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 pb-24">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            SitGuru Ambassador
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Performance
          </h1>
        </div>
        <Link
          href="/ambassador/dashboard"
          className="text-xs font-bold text-emerald-800 hover:underline"
        >
          Full dashboard
        </Link>
      </div>
      <AmbassadorPerformanceClient />
    </div>
  );
}
