import { Archive, CircleCheck } from "lucide-react";
import { baselineDateLabel, type ReferralReportingEpoch } from "@/lib/referrals/reporting-epoch";

export default function ReferralResetBanner({
  epoch,
  compact = false,
}: {
  epoch: ReferralReportingEpoch | null;
  compact?: boolean;
}) {
  return (
    <section
      aria-label="Referral Tracking 2.0 reporting baseline"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-slate-900 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <CircleCheck className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <span className="text-sm font-black text-emerald-950">
          {epoch ? "Referral Tracking 2.0 · Since Reset" : "Referral Tracking 2.0 · Pending Activation"}
        </span>
        <span className="text-xs font-semibold text-emerald-900">{baselineDateLabel(epoch)}</span>
      </div>
      {!compact ? (
        <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700">
          <Archive size={15} className="mt-0.5 shrink-0 text-emerald-800" aria-hidden="true" />
          New-period visits, signups, and booking results start at zero.
          Existing codes, relationships, earned credits, commissions, and unpaid rewards are preserved as lifetime records.
        </p>
      ) : null}
    </section>
  );
}
