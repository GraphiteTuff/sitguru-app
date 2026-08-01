import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function AccountsPayableComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Accounts Payable Aging"
      description="This module will track vendor bills and upcoming obligations. Until it is wired, use Cash Flow expense lines, Plaid categorization, and Payouts for payable pressure."
      relatedLinks={[
        { label: "Cash Flow", href: "/admin/financials/cash-flow" },
        { label: "Plaid Banking", href: "/admin/financials/plaid" },
        { label: "Payouts", href: "/admin/financials/payouts" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
