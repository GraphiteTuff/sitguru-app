import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function BudgetVsActualComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Budget vs. Actual"
      description="This module will compare projected spend and revenue against live actuals. Until it is wired, use Pro Forma assumptions alongside Profit & Loss."
      relatedLinks={[
        { label: "Pro Forma", href: "/admin/financials/pro-forma" },
        { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
