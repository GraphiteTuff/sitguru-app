import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function TaxDeductionsComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Deductible Expense Detail"
      eyebrow="Tax Center / Deductions"
      description="This categorized deduction schedule is next. Until it ships, use Profit & Loss expense rows, General Ledger expense_ledger, Growth marketing costs, and Tax Center exports."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
        { label: "General Ledger", href: "/admin/financials/general-ledger" },
        { label: "Growth & Referrals", href: "/admin/referrals" },
        {
          label: "Export Tax Excel",
          href: "/api/admin/financials/tax-reports/export?format=excel",
        },
      ]}
    />
  );
}
