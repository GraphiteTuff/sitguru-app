"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  Mail,
  MessageCircle,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";

export type AmbassadorDisplayRow = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  location: string;
  roles?: string[];
  contactMethod?: string;
  statusLabel: string;
  nextAction: string;
  lastActivity?: string;
  lastActivityAt?: string | null;
  lastLogin?: string;
  recordSourceLabel?: string;
  completionPercentage: number;
  missingRequirements?: string[];
  flaggedForReview?: boolean;
  possibleDuplicate?: boolean;
  needsAttention?: boolean;
  referralCode?: string;
  href: string;
  messageHref: string;
  publicHref?: string;
};

type AmbassadorSortKey =
  | "priority"
  | "name-asc"
  | "name-desc"
  | "completion-desc"
  | "completion-asc"
  | "activity-desc"
  | "activity-asc"
  | "status-active"
  | "status-attention";

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function getCompletion(row: AmbassadorDisplayRow) {
  const direct = Number(row.completionPercentage);
  if (Number.isFinite(direct)) return Math.max(0, Math.min(100, direct));
  return 10;
}

function getCompletionStyles(value: number) {
  if (value >= 80) return "bg-emerald-100 text-emerald-800";
  if (value >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function getStatusStyles(row: AmbassadorDisplayRow) {
  if (row.possibleDuplicate) return "bg-rose-100 text-rose-800";
  if (row.needsAttention || row.flaggedForReview) {
    return "bg-rose-100 text-rose-800";
  }
  const label = row.statusLabel.toLowerCase();
  if (label.includes("active")) return "bg-emerald-100 text-emerald-800";
  if (label.includes("archiv")) return "bg-slate-100 text-slate-700";
  if (label.includes("pause")) return "bg-amber-100 text-amber-800";
  if (label.includes("incomplete") || label.includes("onboarding")) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-amber-100 text-amber-800";
}

function getRoleStyles(role: string) {
  if (role === "Ambassador") return "bg-violet-100 text-violet-800";
  if (role === "Guru") return "bg-emerald-100 text-emerald-800";
  if (role === "Pet Parent") return "bg-sky-100 text-sky-800";
  if (role === "Super Admin") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

function getMissingSummary(row: AmbassadorDisplayRow) {
  const missing = row.missingRequirements || [];
  if (!missing.length) return "No profile blockers detected";
  const shown = missing.slice(0, 3);
  const remaining = missing.length - shown.length;
  return `${shown.join(", ")}${remaining > 0 ? ` +${remaining} more` : ""}`;
}

function searchMatches(row: AmbassadorDisplayRow, query: string) {
  if (!query) return true;
  return [
    row.id,
    row.userId || "",
    row.name,
    row.email,
    row.phone || "",
    row.location,
    row.statusLabel,
    row.nextAction,
    row.contactMethod || "",
    row.referralCode || "",
    ...(row.roles || []),
    ...(row.missingRequirements || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function getPriority(row: AmbassadorDisplayRow) {
  if (row.flaggedForReview) return 0;
  if (row.needsAttention) return 1;
  if (row.possibleDuplicate) return 2;
  if (getCompletion(row) < 50) return 3;
  if (row.statusLabel.toLowerCase().includes("active")) return 5;
  return 4;
}

function getActivityValue(row: AmbassadorDisplayRow) {
  const raw = String(row.lastActivityAt || row.lastActivity || "").trim();
  if (!raw || raw === "—") return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByPriority(rows: AmbassadorDisplayRow[]) {
  return [...rows].sort((a, b) => {
    const priorityDifference = getPriority(a) - getPriority(b);
    if (priorityDifference) return priorityDifference;
    const completionDifference = getCompletion(b) - getCompletion(a);
    if (completionDifference) return completionDifference;
    return a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}

function sortAmbassadors(
  rows: AmbassadorDisplayRow[],
  sortKey: AmbassadorSortKey,
) {
  if (sortKey === "priority") return sortByPriority(rows);

  return [...rows].sort((a, b) => {
    switch (sortKey) {
      case "name-asc":
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      case "name-desc":
        return b.name.localeCompare(a.name, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      case "completion-desc":
        return getCompletion(b) - getCompletion(a);
      case "completion-asc":
        return getCompletion(a) - getCompletion(b);
      case "activity-desc":
        return getActivityValue(b) - getActivityValue(a);
      case "activity-asc":
        return getActivityValue(a) - getActivityValue(b);
      case "status-active": {
        const aActive = a.statusLabel.toLowerCase().includes("active") ? 0 : 1;
        const bActive = b.statusLabel.toLowerCase().includes("active") ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }
      case "status-attention": {
        const aAttention = a.needsAttention || a.flaggedForReview ? 0 : 1;
        const bAttention = b.needsAttention || b.flaggedForReview ? 0 : 1;
        if (aAttention !== bAttention) return aAttention - bAttention;
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }
      default:
        return 0;
    }
  });
}

function Avatar({
  name,
  email,
  src,
}: {
  name: string;
  email?: string;
  src?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" src={src} className="h-full w-full object-cover" />
    );
  }

  const initials = String(name || email || "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return <>{initials || "A"}</>;
}

export default function AmbassadorRecordsTable({
  ambassadors,
}: {
  ambassadors: AmbassadorDisplayRow[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<AmbassadorSortKey>("priority");

  const visibleAmbassadors = useMemo(() => {
    return sortAmbassadors(
      ambassadors.filter((row) => searchMatches(row, query.trim())),
      sortKey,
    );
  }, [ambassadors, query, sortKey]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Admin Work Queue
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Who needs attention next?
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Each Ambassador appears once. Role badges show whether they also use
            SitGuru as a Pet Parent or Guru. Sort and search keep the review
            process simple.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, email, role..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 sm:w-[360px]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <select
            value={sortKey}
            onChange={(event) =>
              setSortKey(event.target.value as AmbassadorSortKey)
            }
            aria-label="Sort queue"
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="priority">Priority (default)</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="completion-desc">Profile progress High–Low</option>
            <option value="completion-asc">Profile progress Low–High</option>
            <option value="activity-desc">Last activity Newest–Oldest</option>
            <option value="activity-asc">Last activity Oldest–Newest</option>
            <option value="status-active">Status (Active first)</option>
            <option value="status-attention">Status (Needs attention first)</option>
          </select>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
        Showing {number(visibleAmbassadors.length)} of{" "}
        {number(ambassadors.length)} people in this queue.
      </div>

      {visibleAmbassadors.length ? (
        <div className="mt-5 space-y-3">
          {visibleAmbassadors.map((ambassador) => {
            const completion = getCompletion(ambassador);
            const roles = ambassador.roles?.length
              ? ambassador.roles
              : ["Ambassador"];

            return (
              <article
                key={ambassador.id}
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr_1.05fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-700 text-sm font-black text-white">
                        <Avatar
                          name={ambassador.name}
                          email={ambassador.email}
                          src={ambassador.avatarUrl}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-black text-slate-950">
                            {ambassador.name || "Unnamed Ambassador"}
                          </h3>
                          {ambassador.flaggedForReview ||
                          ambassador.needsAttention ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-800">
                              <AlertTriangle size={11} /> Flagged
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {roles.map((role) => (
                            <span
                              key={role}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getRoleStyles(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                          <p>
                            {ambassador.contactMethod ||
                              "Contact not classified"}
                          </p>
                          <p className="truncate">
                            {ambassador.email || "No email provided"}
                            {ambassador.phone ? ` • ${ambassador.phone}` : ""}
                          </p>
                          <p>{ambassador.location || "Location not added yet"}</p>
                          {ambassador.referralCode ? (
                            <p className="font-black text-emerald-700">
                              Code: {ambassador.referralCode}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Profile progress
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getCompletionStyles(completion)}`}
                      >
                        {completion}%
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                      <span className="font-black text-slate-800">Missing:</span>{" "}
                      {getMissingSummary(ambassador)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusStyles(ambassador)}`}
                    >
                      {ambassador.possibleDuplicate
                        ? "Possible Duplicate"
                        : ambassador.statusLabel}
                    </span>
                    <p className="mt-3 text-sm font-black text-slate-950">
                      {ambassador.nextAction || "Open Ambassador review"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last activity: {ambassador.lastActivity || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last login: {ambassador.lastLogin || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Source: {ambassador.recordSourceLabel || "Ambassador workspace"}
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <Link
                      href={ambassador.href}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                    >
                      <UserRoundCheck size={16} />
                      Review Ambassador
                    </Link>

                    {roles.includes("Pet Parent") && ambassador.userId ? (
                      <Link
                        href={`/admin/petparents/${encodeURIComponent(ambassador.userId)}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                      >
                        <UserRoundCheck size={15} /> Review Pet Parent
                      </Link>
                    ) : null}

                    {roles.includes("Guru") ? (
                      <Link
                        href={`/admin/gurus?q=${encodeURIComponent(
                          ambassador.email || ambassador.name,
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                      >
                        <UserRoundCheck size={15} /> Review Guru
                      </Link>
                    ) : null}

                    <Link
                      href={ambassador.messageHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                    >
                      {ambassador.contactMethod === "Email only" ? (
                        <Mail size={15} />
                      ) : (
                        <MessageCircle size={15} />
                      )}
                      Message
                    </Link>

                    {ambassador.publicHref ? (
                      <Link
                        href={ambassador.publicHref}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={15} /> Public Profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm font-bold leading-6 text-emerald-900">
          No Ambassador accounts match this queue or search. Clear the search or
          adjust filters above.
        </div>
      )}
    </div>
  );
}
