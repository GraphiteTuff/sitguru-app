import type { ReactNode } from "react";

/** Compact empty state that stays readable on narrow phones. */
export default function GrowthEmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-5 text-center sm:px-5">
      <p className="text-sm font-black text-slate-950">{title}</p>
      {detail ? (
        <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-5 text-slate-600">
          {detail}
        </p>
      ) : null}
      {action ? <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
