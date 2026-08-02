import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function AccountsReceivableComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Accounts Receivable Aging"
      description="This module will age open customer balances, failed payments, and chargebacks. Until it is wired, review Payments and Stripe transactions for collection signals."
      relatedLinks={[
        { label: "Payment Gateway", href: "/admin/financials/payment-gateway" },
        { label: "Payments", href: "/admin/payments" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
