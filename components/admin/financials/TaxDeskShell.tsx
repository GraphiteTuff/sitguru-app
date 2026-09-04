import Link from "next/link";
import type { ReactNode } from "react";
import { AdminWorkplaceDenied, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";

export function TaxDeskDenied() {
  return (
    <AdminWorkplaceDenied detail="Sign in with a finance-enabled admin account to use SitGuru Tax Center." />
  );
}

export function TaxDeskShell({
  kicker,
  title,
  detail,
  actorEmail,
  exportHref,
  exportLabel = "Download CSV",
  secondaryHref,
  secondaryLabel = "PDF",
  children,
}: {
  kicker: string;
  title: string;
  detail: string;
  actorEmail: string;
  exportHref: string;
  exportLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children: ReactNode;
}) {
  const fallbackSecondary = exportHref.includes("format=csv")
    ? exportHref.replace("format=csv", "format=pdf")
    : "";
  const nextSecondaryHref = secondaryHref || fallbackSecondary;

  return (
    <GrowthPageFrame
      kicker={kicker}
      title={title}
      detail={detail}
      action={
        <Link
          href={exportHref}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          {exportLabel}
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/financials/tax-reports"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Tax Center
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actorEmail}
        </span>
        {nextSecondaryHref ? (
          <Link
            href={nextSecondaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </GrowthPageFrame>
  );
}
