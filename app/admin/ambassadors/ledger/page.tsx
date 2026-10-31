import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AmbassadorPerformanceDashboard from "@/components/admin/ambassadors/AmbassadorPerformanceDashboard";
import { getAdminIdentity } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambassador Performance Ledger",
  description:
    "Brand Ambassador traffic, conversion, and payout ledger for SitGuru ops.",
};

export default async function AdminAmbassadorLedgerPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <AmbassadorPerformanceDashboard />
    </div>
  );
}
