import Link from "next/link";
import type { SupportFilters } from "@/lib/admin/support/types";
import { SUPPORT_SORT_OPTIONS } from "@/lib/admin/support/types";
import { buildSupportHref } from "@/lib/admin/support/utils";

const fieldClass =
  "mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100";

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
      className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Filter & Sort
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()}{" "}
            cases
          </p>
        </div>

        <Link
          href="/admin/support"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="xl:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Apply filters
        </button>

        <Link
          href={buildSupportHref({
            ...filters,
            status: "open",
            sort: "priority_desc",
          })}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800 transition hover:bg-rose-100"
        >
          Open + urgent first
        </Link>
      </div>
    </form>
  );
}
