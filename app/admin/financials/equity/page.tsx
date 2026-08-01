import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function EquityComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Shareholders' Equity"
      description="This module will track ownership contributions, retained earnings, distributions, and founder investment history. Until it is wired, use Balance Sheet equity lines and CPA handoff packages."
      relatedLinks={[
        { label: "Balance Sheet", href: "/admin/financials/balance-sheet" },
        { label: "CPA Handoff", href: "/admin/financials/cpa-handoff" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
