import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function TaxReconciliationComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Tax Reconciliation Backup"
      eyebrow="Tax Center / Reconciliation"
      description="This tax-specific bank/Stripe backup package is next. The live Reconciliation module already matches Stripe payouts to NFCU deposits and booking_payments truth."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "Reconciliation", href: "/admin/financials/reconciliation" },
        { label: "Banking (Plaid)", href: "/admin/financials/plaid" },
        { label: "Payment Gateway", href: "/admin/financials/payment-gateway" },
        {
          label: "Export Reconciliation",
          href: "/api/admin/financials/reconciliation/export?format=csv",
        },
      ]}
    />
  );
}
