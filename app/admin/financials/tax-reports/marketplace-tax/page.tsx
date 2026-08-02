import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function MarketplaceTaxComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Marketplace Tax Review"
      eyebrow="Tax Center / Sales & Local"
      description="This marketplace and local tax exposure schedule is next. Until it ships, use Stripe booking_payments tax support in Tax Center, Stripe balances, and CPA Handoff local-tax notes."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "Payment Gateway", href: "/admin/financials/payment-gateway" },
        {
          label: "CPA Local Tax",
          href: "/admin/financials/cpa-handoff?section=local-tax",
        },
        {
          label: "Export Tax PDF",
          href: "/api/admin/financials/tax-reports/export?format=pdf",
        },
      ]}
    />
  );
}
