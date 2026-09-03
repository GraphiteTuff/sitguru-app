import { HeartHandshake, PawPrint } from "lucide-react";
import { ReferralProgramDesk } from "@/components/admin/referrals/ReferralProgramDesk";
import {
  AdminWorkplaceDenied,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  filterAccounting,
  loadReferralAccounting,
} from "@/lib/admin/referrals/accounting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGuruReferralsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to review Guru referral tracking and rewards."
      />
    );
  }

  const params = await Promise.resolve(searchParams || {});
  const query = String(params.q || "").trim();
  const desk = filterAccounting(await loadReferralAccounting(), "guru", query);

  return (
    <ReferralProgramDesk
      kicker="Guru Referral Workplace"
      title="Track Guru codes, then pay only real joins."
      detail="Guru-to-Guru invites, lead codes, and bookable progress. Visits stay visible; rewards wait for a captured signup."
      program="guru"
      desk={desk}
      query={query}
      extraActions={[
        {
          href: "/admin/gurus",
          label: "Guru roster",
          detail: "Open bookable Gurus",
          icon: PawPrint,
        },
        {
          href: "/admin/referrals/ambassadors",
          label: "Ambassador desk",
          detail: "If the code came from outreach",
          icon: HeartHandshake,
        },
      ]}
    />
  );
}
