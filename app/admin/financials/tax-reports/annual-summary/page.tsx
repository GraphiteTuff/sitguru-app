import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function AnnualTaxSummaryComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Annual Tax Summary"
      eyebrow="Tax Center / Income Tax"
      description="This dedicated annual tax summary schedule is next. Until it ships, use Profit & Loss, Cash Flow, Tax Center exports, and CPA Handoff for launch-year package support."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
        { label: "Cash Flow", href: "/admin/financials/cash-flow" },
        { label: "CPA Handoff", href: "/admin/financials/cpa-handoff" },
        {
          label: "Export Tax CSV",
          href: "/api/admin/financials/tax-reports/export?format=csv",
        },
      ]}
    />
  );
}
