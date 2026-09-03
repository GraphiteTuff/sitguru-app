import { Gift, Users } from "lucide-react";
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

export default async function AdminPetParentReferralsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to review Pet Parent and PawPerks referral tracking."
      />
    );
  }

  const query = searchQuery(await Promise.resolve(searchParams));
  const desk = filterAccounting(
    await loadReferralAccounting(),
    "pet_parent",
    query,
  );

  return (
    <ReferralProgramDesk
      kicker="Pet Parent Referral Workplace"
      title="Account PawPerks codes to the parent who earned them."
      detail="Pet Parent invite codes, PawPerks attribution, and reward-ready signups. Profile codes alone are not referrals."
      program="pet_parent"
      desk={desk}
      query={query}
      extraActions={[
        {
          href: "/admin/customers",
          label: "Pet Parents",
          detail: "Open the customer roster",
          icon: Users,
        },
        {
          href: "/admin/rewards",
          label: "PawPerks auditor",
          detail: "Shared links and flags",
          icon: Gift,
        },
      ]}
    />
  );
}
