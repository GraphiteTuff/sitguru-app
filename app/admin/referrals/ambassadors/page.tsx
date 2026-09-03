import { HeartHandshake, WalletCards } from "lucide-react";
import { ReferralProgramDesk } from "@/components/admin/referrals/ReferralProgramDesk";
import { AdminWorkplaceDenied } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  filterAccounting,
  loadReferralAccounting,
} from "@/lib/admin/referrals/accounting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAmbassadorReferralsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to review Ambassador referral tracking and rewards."
      />
    );
  }

  const params = await Promise.resolve(searchParams || {});
  const query = String(params.q || "").trim();
  const desk = filterAccounting(
    await loadReferralAccounting(),
    "ambassador",
    query,
  );

  return (
    <ReferralProgramDesk
      kicker="Ambassador Referral Workplace"
      title="Keep every live Ambassador code on the circuit."
      detail="Workspace codes, tracked links, and QR scans. HQ is alerted when a referred member actually joins."
      program="ambassador"
      desk={desk}
      query={query}
      extraActions={[
        {
          href: "/admin/ambassadors",
          label: "Ambassador roster",
          detail: "People and status",
          icon: HeartHandshake,
        },
        {
          href: "/admin/ambassadors/ledger",
          label: "Ledger",
          detail: "Clicks and commissions",
          icon: WalletCards,
        },
      ]}
    />
  );
}
