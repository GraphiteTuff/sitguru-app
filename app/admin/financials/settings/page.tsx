import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function FinancialSettingsComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Financial Settings"
      description="Accounting preferences, export defaults, and CPA package settings will live here. For now, use Exports and CPA Handoff."
      relatedLinks={[
        { label: "Exports", href: "/admin/financials/exports" },
        { label: "CPA Handoff", href: "/admin/financials/cpa-handoff" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
