import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function VendorsComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Vendor & Admin Expenses"
      description="This module will categorize software, insurance, marketing, and administrative vendor spend. Until it is wired, categorize NFCU transactions in Plaid and review Cash Flow / P&L expense lines."
      relatedLinks={[
        { label: "Plaid Banking", href: "/admin/financials/plaid" },
        { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
        { label: "Cash Flow", href: "/admin/financials/cash-flow" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
