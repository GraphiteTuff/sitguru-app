import Link from "next/link";
import { BookOpen, FileSpreadsheet, Landmark, Send } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { QuickBooksConnectPanel } from "@/components/admin/financials/QuickBooksConnectPanel";
import { TaxDeskDenied, TaxDeskShell } from "@/components/admin/financials/TaxDeskShell";
import {
  AdminWorkplaceActions,
  GrowthCard,
} from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadQuickBooksFeed } from "@/lib/admin/financials/quickbooks-feed";
import {
  getQuickBooksPublicStatus,
  getQuickBooksSafeConnection,
  loadQuickBooksConnection,
} from "@/lib/admin/financials/quickbooks-online";
import { taxMoney } from "@/lib/admin/financials/tax-center";

export const dynamic = "force-dynamic";

export default async function TaxQuickBooksPage({
  searchParams,
}: {
  searchParams?: Promise<{ connected?: string; error?: string }>;
}) {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const params = (await searchParams) || {};
  const { feed, bundle } = await loadQuickBooksFeed();
  const connection = getQuickBooksSafeConnection(await loadQuickBooksConnection());
  const setup = getQuickBooksPublicStatus();
  const debit = feed.lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = feed.lines.reduce((sum, line) => sum + line.credit, 0);

  return (
    <TaxDeskShell
      kicker="Tax Center / QuickBooks"
      title="Push SitGuru books into QuickBooks for tax season."
      detail="Graff Enterprises LLC dba SitGuru. Connect QuickBooks Online, push the tax journal, or download QBO CSV / Desktop IIF for the CPA."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/quickbooks?format=qbo"
      exportLabel="Download QBO"
      secondaryHref="/api/admin/financials/tax-reports/quickbooks?format=iif"
      secondaryLabel="Desktop IIF"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Journal lines"
          value={feed.lines.length.toLocaleString()}
          helper={feed.journalNo}
          tone="emerald"
          icon={<BookOpen size={18} />}
        />
        <AdminThemeCard
          label="Debits"
          value={taxMoney(debit)}
          helper="Must equal credits"
          tone="sky"
        />
        <AdminThemeCard
          label="Credits"
          value={taxMoney(credit)}
          helper={Math.abs(debit - credit) < 0.01 ? "Balanced" : "Needs review"}
          tone={Math.abs(debit - credit) < 0.01 ? "emerald" : "rose"}
        />
        <AdminThemeCard
          label="Sales tax in feed"
          value={taxMoney(bundle.totals.tax)}
          helper="Sales Tax Payable · not income"
          tone="violet"
          icon={<Landmark size={18} />}
        />
      </section>

      <QuickBooksConnectPanel
        setup={setup}
        connection={connection}
        lineCount={feed.lines.length}
        queryError={params.error}
        justConnected={params.connected === "1"}
      />

      <AdminWorkplaceActions
        actions={[
          {
            href: setup.configured
              ? "/api/admin/financials/quickbooks/connect"
              : "/api/admin/financials/tax-reports/quickbooks?format=qbo",
            label: connection ? "Reconnect QuickBooks" : "Connect QuickBooks",
            detail: setup.configured
              ? "Intuit OAuth for sandbox or live QBO"
              : "Keys missing · download CSV instead",
            icon: Landmark,
            primary: true,
          },
          {
            href: "/api/admin/financials/tax-reports/quickbooks?format=qbo",
            label: "QuickBooks Online CSV",
            detail: "Import as journal entries",
            icon: FileSpreadsheet,
          },
          {
            href: "/api/admin/financials/tax-reports/quickbooks?format=iif",
            label: "QuickBooks Desktop IIF",
            detail: "File → Utilities → Import → IIF",
            icon: BookOpen,
          },
          {
            href: "/admin/financials/cpa-handoff",
            label: "Send to CPA",
            detail: "Handoff the same tax-year package",
            icon: Send,
          },
        ]}
      />

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">How to work tax season</h2>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">1. Connect or download</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Push posts a balanced journal into QuickBooks Online. CSV / IIF stay
              available if your CPA wants a file instead.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">2. Keep tax off income</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Sales tax posts to Sales Tax Payable. Tips never enter SitGuru
              income. Guru payouts stay contractor expense for 1099 review.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">3. Hand to the CPA</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Use CPA Handoff plus the Tax Center PDF. This feed is the
              QuickBooks import, not a filed return.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/api/admin/financials/tax-reports/quickbooks?format=mapping"
            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-900"
          >
            Download account map
          </Link>
          <Link
            href="/api/admin/financials/tax-reports/export?format=pdf"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
          >
            Tax Center PDF
          </Link>
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">SitGuru → QuickBooks map</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Same account names already used on P&L, Balance Sheet, and GL exports.
        </p>
        <div className="mt-4 grid min-w-0 gap-2">
          {feed.mapping.map((row) => (
            <div
              key={row.sitguru}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="text-sm font-black text-slate-950">{row.sitguru}</p>
              <p className="mt-1 text-xs font-bold text-emerald-800">{row.quickbooks}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{row.treatment}</p>
            </div>
          ))}
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Journal preview</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {feed.company} · {feed.periodLabel} · {feed.journalDate}
        </p>
        {feed.lines.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Account", "Memo", "Debit", "Credit"].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feed.lines.map((line, index) => (
                  <tr key={`${line.account}-${index}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-black text-slate-950">{line.account}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-slate-500">{line.memo}</td>
                    <td className="px-3 py-3 font-bold text-slate-700">
                      {line.debit ? taxMoney(line.debit) : "—"}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">
                      {line.credit ? taxMoney(line.credit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No journal amounts yet. Paid bookings, payouts, and expenses will fill this feed.
          </p>
        )}
      </GrowthCard>
    </TaxDeskShell>
  );
}
