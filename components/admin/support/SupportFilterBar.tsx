import Link from "next/link";
import type { SupportFilters } from "@/lib/admin/support/types";
import { SUPPORT_SORT_OPTIONS } from "@/lib/admin/support/types";
import { buildSupportHref } from "@/lib/admin/support/utils";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-300/50";

type SupportFilterBarProps = {
  filters: SupportFilters;
  filteredTotal: number;
  total: number;
};

export default function SupportFilterBar({
  filters,
  filteredTotal,
  total,
}: SupportFilterBarProps) {
  return (
    <form
      method="get"
      action="/admin/support"
      className="rounded-[28px] border border-white/10 bg-white/5 p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Filter & Sort
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()}{" "}
            cases
          </p>
        </div>

        <Link
          href="/admin/support"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
        >
          Clear filters
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="xl:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Search
          </span>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Ticket ID, sender, subject…"
            className={fieldClass}
          />
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Queue
          </span>
          <select name="type" defaultValue={filters.type} className={fieldClass}>
            <option value="all">All queues</option>
            <option value="customer">Customer</option>
            <option value="guru">Guru</option>
            <option value="platform">Platform</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            User type
          </span>
          <select
            name="userType"
            defaultValue={filters.userType}
            className={fieldClass}
          >
            <option value="all">All</option>
            <option value="parent">Pet Parent</option>
            <option value="guru">Pet Guru</option>
            <option value="ambassador">Ambassador</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status}
            className={fieldClass}
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Priority
          </span>
          <select
            name="priority"
            defaultValue={filters.priority}
            className={fieldClass}
          >
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Sort by
          </span>
          <select name="sort" defaultValue={filters.sort} className={fieldClass}>
            {SUPPORT_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filters.caseId ? (
          <input type="hidden" name="case" value={filters.caseId} />
        ) : null}

        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
        >
          Apply filters
        </button>

        <Link
          href={buildSupportHref({
            ...filters,
            status: "open",
            sort: "priority_desc",
          })}
          className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20"
        >
          Open + urgent first
        </Link>
      </div>
    </form>
  );
}
