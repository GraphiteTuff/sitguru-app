import { Building2, HandCoins } from "lucide-react";
import { ReferralProgramDesk } from "@/components/admin/referrals/ReferralProgramDesk";
import { AdminWorkplaceDenied } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  filterAccounting,
  loadReferralAccounting,
  searchQuery,
} from "@/lib/admin/referrals/accounting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPartnerReferralsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to review partner and clinic referral tracking."
      />
    );
  }

  const query = searchQuery(await Promise.resolve(searchParams));
  const desk = filterAccounting(await loadReferralAccounting(), "partner", query);

  return (
    <ReferralProgramDesk
      kicker="Partner Referral Workplace"
      title="Track clinic and partner codes to a payable owner."
      detail="Partner-issued codes, scans, and attributed joins. Payouts stay closed until a referred signup is captured."
      program="partner"
      desk={desk}
      query={query}
      extraActions={[
        {
          href: "/admin/partners",
          label: "Partners",
          detail: "Clinic and business roster",
          icon: Building2,
        },
        {
          href: "/admin/partners/payouts",
          label: "Partner payouts",
          detail: "Commission records",
          icon: HandCoins,
        },
      ]}
    />
  );
}
