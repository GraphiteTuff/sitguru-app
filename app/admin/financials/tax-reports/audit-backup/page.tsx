import Link from "next/link";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { TaxFilingCalendar } from "@/components/admin/financials/TaxFilingCalendar";
import { TaxDeskDenied, TaxDeskShell } from "@/components/admin/financials/TaxDeskShell";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadTaxCenterBundle, taxMoney } from "@/lib/admin/financials/tax-center";

export const dynamic = "force-dynamic";

export default async function TaxAuditBackupPage() {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const bundle = await loadTaxCenterBundle();
  const ready = bundle.auditIndex.filter((item) => item.ready).length;

  return (
    <TaxDeskShell
      kicker="Tax Center / Audit Support"
      title="Tax audit backup index."
      detail="Every Tax Center desk, its live SitGuru source, and a download. Built for Graff Enterprises LLC dba SitGuru."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/export?format=pdf&section=audit"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Live packages"
          value={`${ready}/${bundle.auditIndex.length}`}
          helper="Desks with SitGuru rows"
          tone="emerald"
          icon={<ShieldCheck size={18} />}
        />
        <AdminThemeCard
          label="Platform revenue"
          value={taxMoney(bundle.totals.fees)}
          helper="Income support"
          tone="sky"
        />
        <AdminThemeCard
          label="Deductions"
          value={taxMoney(bundle.totals.expenseTotal)}
          helper="Expense + growth"
          tone="amber"
        />
        <AdminThemeCard
          label="Full package"
          value="CSV / PDF"
          helper="One export of all tax support"
          tone="violet"
          icon={<FileSpreadsheet size={18} />}
        />
      </section>

      <TaxFilingCalendar compact />

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Backup index</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Open the live desk or download that schedule now.
        </p>
        <div className="mt-4 grid min-w-0 gap-2">
          {bundle.auditIndex.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.source} · {item.count.toLocaleString()} row{item.count === 1 ? "" : "s"} ·{" "}
                  {taxMoney(item.amount)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900"
                >
                  Open desk
                </Link>
                <Link
                  href={item.exportHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      </GrowthCard>
    </TaxDeskShell>
  );
}
