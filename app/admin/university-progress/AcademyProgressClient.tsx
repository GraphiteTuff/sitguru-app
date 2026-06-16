"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Filter,
  MessageCircle,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import type { AcademyProgressRecord } from "./page";

type SortOption =
  | "name-az"
  | "academy-az"
  | "progress-high"
  | "progress-low"
  | "updated-new"
  | "completed-new"
  | "status";

type Props = {
  records: AcademyProgressRecord[];
  completedRecords: AcademyProgressRecord[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateValue(value?: string | null) {
  if (!value) return 0;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function sortedRecords(records: AcademyProgressRecord[], sortBy: SortOption) {
  return [...records].sort((a, b) => {
    if (sortBy === "name-az") return a.name.localeCompare(b.name);
    if (sortBy === "progress-high") return b.progress - a.progress;
    if (sortBy === "progress-low") return a.progress - b.progress;
    if (sortBy === "updated-new") {
      return dateValue(b.updatedAt || b.assignedAt) - dateValue(a.updatedAt || a.assignedAt);
    }
    if (sortBy === "completed-new") {
      return dateValue(b.completedAt) - dateValue(a.completedAt);
    }
    if (sortBy === "status") {
      const statusCompare = a.status.localeCompare(b.status);
      if (statusCompare !== 0) return statusCompare;
      return a.name.localeCompare(b.name);
    }

    const academyCompare = a.academy.localeCompare(b.academy);
    if (academyCompare !== 0) return academyCompare;
    return a.name.localeCompare(b.name);
  });
}

export default function AcademyProgressClient({
  records,
  completedRecords,
}: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [academyFilter, setAcademyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cleanupFilter, setCleanupFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("updated-new");

  const roles = useMemo(() => unique(records.map((record) => record.role)), [records]);
  const academies = useMemo(
    () => unique(records.map((record) => record.academy)),
    [records],
  );
  const statuses = useMemo(
    () => unique(records.map((record) => record.status)),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = records.filter((record) => {
      const searchable = [
        record.name,
        record.email,
        record.role,
        record.academy,
        record.status,
        record.cleanupIssue || "",
        record.source,
        record.rawUserKey,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesRole = roleFilter === "All" || record.role === roleFilter;
      const matchesAcademy = academyFilter === "All" || record.academy === academyFilter;
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesCleanup =
        cleanupFilter === "All" ||
        (cleanupFilter === "Needs Cleanup" && Boolean(record.cleanupIssue)) ||
        (cleanupFilter === "Clean" && !record.cleanupIssue);

      return matchesSearch && matchesRole && matchesAcademy && matchesStatus && matchesCleanup;
    });

    return sortedRecords(filtered, sortBy);
  }, [academyFilter, cleanupFilter, records, roleFilter, search, sortBy, statusFilter]);

  const activeFilterCount = [
    search.trim() ? "search" : "",
    roleFilter !== "All" ? "role" : "",
    academyFilter !== "All" ? "academy" : "",
    statusFilter !== "All" ? "status" : "",
    cleanupFilter !== "All" ? "cleanup" : "",
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setRoleFilter("All");
    setAcademyFilter("All");
    setStatusFilter("All");
    setCleanupFilter("All");
    setSortBy("updated-new");
  }

  return (
    <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
      <div className="min-w-0 xl:col-span-8">
        <DashboardCard>
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Academy Roster
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Search and review one clean academy record per person and academy.
              </p>
            </div>

            <div className="inline-flex rounded-2xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-black text-green-900">
              Showing {filteredRecords.length} of {records.length}
            </div>
          </div>

          <div className="mb-5 rounded-[24px] border border-green-100 bg-green-50/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-green-950">
              <SlidersHorizontal size={17} />
              Filter & Sort
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="md:col-span-2 xl:col-span-1">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Search
                </span>
                <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-green-100 bg-white px-3">
                  <Search size={16} className="text-green-800" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name, email, academy..."
                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <SelectField label="Role" value={roleFilter} onChange={setRoleFilter} options={["All", ...roles]} />
              <SelectField label="Academy" value={academyFilter} onChange={setAcademyFilter} options={["All", ...academies]} />
              <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", ...statuses]} />
              <SelectField label="Cleanup" value={cleanupFilter} onChange={setCleanupFilter} options={["All", "Needs Cleanup", "Clean"]} />

              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="min-h-11 w-full rounded-2xl border border-green-100 bg-white px-3 text-sm font-black text-slate-800 outline-none"
                >
                  <option value="updated-new">Recently Updated</option>
                  <option value="completed-new">Recently Completed</option>
                  <option value="name-az">Person A-Z</option>
                  <option value="academy-az">Academy A-Z</option>
                  <option value="progress-high">Progress High-Low</option>
                  <option value="progress-low">Progress Low-High</option>
                  <option value="status">Status</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-green-900">
                <Filter size={14} />
                {activeFilterCount > 0 ? `${activeFilterCount} active filters` : "No active filters"}
              </div>

              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-50"
                >
                  <X size={15} />
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

          <MobileProgressList records={filteredRecords} />

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  <th className="pb-3">Person</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Academy</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Progress</th>
                  <th className="pb-3">Last Activity</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr key={record.key} className="border-b border-[#f1f5f2] last:border-0">
                      <td className="py-4">
                        <PersonCell record={record} />
                      </td>
                      <td className="py-4">
                        <RoleBadge role={record.role} />
                      </td>
                      <td className="py-4 font-bold text-slate-700">{record.academy}</td>
                      <td className="py-4">
                        <StatusBadge status={record.status} />
                        {record.cleanupIssue ? (
                          <p className="mt-2 max-w-[200px] text-xs font-bold leading-5 text-rose-700">
                            {record.cleanupIssue}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-4">
                        <ProgressBar value={record.progress} />
                      </td>
                      <td className="py-4 font-bold text-slate-600">
                        {formatDate(record.updatedAt || record.completedAt || record.assignedAt)}
                      </td>
                      <td className="py-4">
                        <RowActions record={record} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8">
                      <EmptyState
                        title="No academy progress records match your filters"
                        detail="Clear filters or adjust search to find more academy progress records."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>

      <div className="min-w-0 xl:col-span-4">
        <DashboardCard>
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-950">
              Completed Academy Users
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Quick list of people who reached 100%.
            </p>
          </div>

          <div className="grid max-h-[720px] gap-3 overflow-y-auto pr-1">
            {completedRecords.length ? (
              completedRecords.slice(0, 50).map((record) => (
                <div key={`completed-${record.key}`} className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={record.name} avatarUrl={record.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{record.name}</p>
                      <p className="truncate text-xs font-bold text-slate-500">{record.email}</p>
                      <p className="mt-1 text-xs font-black text-green-800">{record.academy}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Completed: {formatDate(record.completedAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No completed academies yet"
                detail="Completed people will show here once they reach 100%."
              />
            )}
          </div>
        </DashboardCard>
      </div>
    </section>
  );
}

function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-green-100 bg-white px-3 text-sm font-black text-slate-800 outline-none"
      >
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PersonCell({ record }: { record: AcademyProgressRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={record.name} avatarUrl={record.avatarUrl} cleanup={Boolean(record.cleanupIssue)} />
      <div className="min-w-0">
        <p className="truncate font-black text-slate-950">{record.name}</p>
        <p className="truncate text-xs font-bold text-slate-500">{record.email}</p>
        {record.cleanupIssue ? (
          <p className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-rose-700">
            Needs Cleanup
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RowActions({ record }: { record: AcademyProgressRecord }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={record.profileHref}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-50"
      >
        <UserRound size={14} />
        Profile
      </Link>
      <Link
        href={record.messageHref}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 transition hover:bg-blue-100"
      >
        <MessageCircle size={14} />
        Message
      </Link>
      <Link
        href={record.assignmentHref}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
      >
        <BadgeCheck size={14} />
        Academy
      </Link>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="min-w-[140px]">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500">Progress</span>
        <span className="text-xs font-black text-green-800">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-green-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AcademyProgressRecord["status"] }) {
  const styles =
    status === "Completed"
      ? "bg-green-100 text-green-800"
      : status === "In Progress"
        ? "bg-amber-100 text-amber-800"
        : status === "Needs Cleanup"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}>{status}</span>;
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "Guru"
      ? "border-green-100 bg-green-50 text-green-800"
      : role === "Ambassador"
        ? "border-blue-100 bg-blue-50 text-blue-800"
        : role === "Pet Parent"
          ? "border-purple-100 bg-purple-50 text-purple-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles}`}>{role}</span>;
}

function Avatar({
  name,
  avatarUrl,
  cleanup = false,
}: {
  name: string;
  avatarUrl?: string | null;
  cleanup?: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (avatarUrl) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-green-100 bg-green-50 shadow-sm">
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${cleanup ? "bg-rose-50 text-rose-700" : "bg-green-50 text-green-800"}`}>
      {cleanup ? <ShieldAlert size={16} /> : initials || "SG"}
    </div>
  );
}

function MobileProgressList({ records }: { records: AcademyProgressRecord[] }) {
  if (!records.length) {
    return (
      <div className="md:hidden">
        <EmptyState
          title="No academy progress records found"
          detail="Clear filters or adjust search to find academy progress records."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {records.map((record) => (
        <article key={`mobile-${record.key}`} className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={record.name} avatarUrl={record.avatarUrl} cleanup={Boolean(record.cleanupIssue)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">{record.name}</p>
              <p className="truncate text-xs font-bold text-slate-500">{record.email}</p>
            </div>
            <StatusBadge status={record.status} />
          </div>

          {record.cleanupIssue ? (
            <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {record.cleanupIssue}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2">
            <MobileMetaRow label="Role" value={record.role} />
            <MobileMetaRow label="Academy" value={record.academy} />
            <ProgressBar value={record.progress} />
            <MobileMetaRow label="Last Activity" value={formatDate(record.updatedAt || record.completedAt || record.assignedAt)} />
          </div>

          <div className="mt-4">
            <RowActions record={record} />
          </div>
        </article>
      ))}
    </div>
  );
}

function MobileMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="truncate text-right text-xs font-black text-slate-700">{value}</span>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-6 text-center">
      <p className="font-black text-green-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-green-900/70">{detail}</p>
    </div>
  );
}
