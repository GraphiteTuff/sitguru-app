import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AmbassadorSelfServicePortal from "@/components/ambassador/AmbassadorSelfServicePortal";
import { createClient } from "@/lib/supabase/server";
import {
  buildAmbassadorReferralLink,
  canAccessAmbassadorLedger,
  ensureAmbassadorLedgerForUser,
} from "@/lib/ambassador/ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambassador Performance",
  description:
    "Mobile referral link, weekly signups, and payout receipts for SitGuru Ambassadors.",
};

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

  const allowed = await canAccessAmbassadorLedger({
    userId: user.id,
    email: user.email,
  });
  if (!allowed) {
    redirect("/ambassador/login?error=ambassador-required");
  }

  const ledger = await ensureAmbassadorLedgerForUser(user.id, user.email);
  const referralCode = ledger?.referral_code_slug || "";

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
      <AmbassadorSelfServicePortal
        referralCode={referralCode}
        referralLink={
          referralCode ? buildAmbassadorReferralLink(referralCode) : ""
        }
      />
    </div>
  );
}
