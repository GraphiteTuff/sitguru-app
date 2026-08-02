import FinancialModuleComingSoon from "@/components/admin/financials/FinancialModuleComingSoon";

export const dynamic = "force-dynamic";

export default function TaxAuditBackupComingSoonPage() {
  return (
    <FinancialModuleComingSoon
      title="Tax Audit Backup Index"
      eyebrow="Tax Center / Audit Support"
      description="This audit backup index is next. Until it ships, use General Ledger, Export Center, Tax Center exports, and CPA Handoff for package organization."
      relatedLinks={[
        { label: "Tax Center", href: "/admin/financials/tax-reports" },
        { label: "General Ledger", href: "/admin/financials/general-ledger" },
        { label: "Export Center", href: "/admin/financials/exports?type=tax" },
        { label: "CPA Handoff", href: "/admin/financials/cpa-handoff" },
        {
          label: "Export Tax ZIP Prep",
          href: "/admin/financials/exports?type=tax&format=zip&period=annual",
        },
      ]}
    />
  );
}
