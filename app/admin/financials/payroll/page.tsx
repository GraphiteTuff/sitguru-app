import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function PayrollComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Payroll & Contractor Separation"
      description="This module will separate employee payroll from Guru contractor payouts and tax support. Until it is wired, use Payouts, Commissions, and Tax Reports."
      relatedLinks={[
        { label: "Payouts", href: "/admin/financials/payouts" },
        { label: "Commissions", href: "/admin/financials/commissions" },
        { label: "Tax Reports", href: "/admin/financials/tax-reports" },
        { label: "Financials Hub", href: "/admin/financials" },
      ]}
    />
  );
}
