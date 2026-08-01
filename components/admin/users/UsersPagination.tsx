import Link from "next/link";
import type { DirectoryFilters } from "@/lib/admin/users/types";
import { buildDirectoryHref } from "@/lib/admin/users/normalize";

type UsersPaginationProps = {
  filters: DirectoryFilters;
  pageCount: number;
  filteredTotal: number;
  preserve?: {
    user?: string;
    email?: string;
    name?: string;
    scopedRole?: string;
  };
};

export default function UsersPagination({
  filters,
  pageCount,
  filteredTotal,
  preserve,
}: UsersPaginationProps) {
  const page = filters.page;
  const from = filteredTotal === 0 ? 0 : (page - 1) * filters.pageSize + 1;
  const to = Math.min(page * filters.pageSize, filteredTotal);

  function hrefFor(nextPage: number) {
    return buildDirectoryHref({
      q: filters.q,
      role: filters.role,
      status: filters.status,
      source: filters.source,
      page: nextPage,
      pageSize: filters.pageSize,
      user: preserve?.user,
      email: preserve?.email,
      name: preserve?.name,
      scopedRole: preserve?.scopedRole,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-600">
        Showing{" "}
        <span className="font-black text-slate-950">
          {from}-{to}
        </span>{" "}
        of{" "}
        <span className="font-black text-slate-950">
          {filteredTotal.toLocaleString()}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`inline-flex min-h-10 min-w-24 items-center justify-center rounded-xl border px-3 text-xs font-black transition ${
            page <= 1
              ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Previous
        </Link>
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          Page {page} / {pageCount}
        </span>
        <Link
          href={hrefFor(Math.min(pageCount, page + 1))}
          aria-disabled={page >= pageCount}
          className={`inline-flex min-h-10 min-w-24 items-center justify-center rounded-xl border px-3 text-xs font-black transition ${
            page >= pageCount
              ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
