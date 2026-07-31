import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AmbassadorPerformanceDashboard from "@/components/admin/ambassadors/AmbassadorPerformanceDashboard";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambassador Performance Ledger",
  description:
    "Brand Ambassador traffic, conversion, and payout ledger for SitGuru ops.",
};

export default async function AdminAmbassadorLedgerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(
    (profile as { role?: string } | null)?.role || "",
  ).toLowerCase();
  if (role !== "admin" && role !== "super_admin") {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <AmbassadorPerformanceDashboard />
    </div>
  );
}
