import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function Tax1099ComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="1099 Contractor Support"
      eyebrow="Tax Center / 1099"
      description="This Guru, contractor, partner, and Ambassador payment schedule is next. Until it ships, use Payouts, Commissions, and Tax Center exports for threshold review support."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "Payouts", href: "/admin/financials/payouts" },
        { label: "Commissions", href: "/admin/financials/commissions" },
        { label: "Payroll Separation", href: "/admin/financials/payroll" },
        {
          label: "Export Tax CSV",
          href: "/api/admin/financials/tax-reports/export?format=csv",
        },
      ]}
    />
  );
}
