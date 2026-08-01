"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DIRECTORY_ROLE_OPTIONS,
  DIRECTORY_STATUS_OPTIONS,
  DIRECTORY_PAGE_SIZE_OPTIONS,
  type DirectoryFilters,
} from "@/lib/admin/users/types";
import { buildDirectoryHref } from "@/lib/admin/users/normalize";

type UsersFilterBarProps = {
  filters: DirectoryFilters;
  filteredTotal: number;
  preserve?: {
    user?: string;
    email?: string;
    name?: string;
    scopedRole?: string;
  };
};

export default function UsersFilterBar({
  filters,
  filteredTotal,
  preserve,
}: UsersFilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const next = buildDirectoryHref({
      q: String(formData.get("q") || "").trim(),
      role: String(formData.get("role") || "all") as DirectoryFilters["role"],
      status: String(formData.get("status") || "all") as DirectoryFilters["status"],
      source: String(formData.get("source") || "all") as DirectoryFilters["source"],
      page: 1,
      pageSize: Number(formData.get("pageSize") || filters.pageSize),
      user: preserve?.user,
      email: preserve?.email,
      name: preserve?.name,
      scopedRole: preserve?.scopedRole,
    });

    startTransition(() => {
      router.push(next);
    });
  }

  return (
    <form
      action={onSubmit}
      className="rounded-[1.5rem] border border-slate-200 bg-[#fbfefd] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Search
          </span>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Name, email, or phone"
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 transition placeholder:text-slate-400 focus:ring-2"
          />
        </label>

        <label className="w-full lg:w-44">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Role
          </span>
          <select
            name="role"
            defaultValue={filters.role}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
          >
            {DIRECTORY_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full lg:w-44">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
          >
            {DIRECTORY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full lg:w-36">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Source
          </span>
          <select
            name="source"
            defaultValue={filters.source}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
          >
            <option value="all">All sources</option>
            <option value="profile">Profiles</option>
            <option value="guru">Guru records</option>
            <option value="launch">Launch leads</option>
          </select>
        </label>

        <label className="w-full lg:w-28">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Page size
          </span>
          <select
            name="pageSize"
            defaultValue={String(filters.pageSize)}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
          >
            {DIRECTORY_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Filtering…" : "Apply"}
        </button>
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {filteredTotal.toLocaleString()} matching
        {pending ? " · updating…" : ""}
      </p>
    </form>
  );
}
