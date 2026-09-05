"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  Eye,
  Mail,
  MessageCircle,
  Search,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import { emailFallback, fallbackInitials } from "@/lib/sitguru/display";
import MergeDuplicateGuruButton from "@/components/admin/MergeDuplicateGuruButton";

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "needs_info"
  | "pre_approved"
  | "verification_pending"
  | "approved"
  | "bookable"
  | "rejected"
  | "suspended";

type RecordCategory =
  | "real_guru"
  | "needs_identity"
  | "account_repair"
  | "possible_duplicate"
  | "placeholder"
  | "internal"
  | "archived";

type GuruDisplayRow = {
  id: string;
  userId?: string;
  guruUserId?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  slug: string;
  services: string;
  location: string;
  experience: string;
  applicationStatus: ApplicationStatus;
  statusLabel: string;
  profileQuality: string;
  identityStatus: string;
  backgroundStatus: string;
  safetyStatus: string;
  bookable: boolean;
  isPublicVisible?: boolean;
  adminStatus?: string;
  profileQualityStatus?: string;
  qualityClassification?: string;
  missingRequirements?: string[];
  approvedThisWeek?: boolean;
  flaggedForReview?: boolean;
  setupStep?: number;
  setupStepLabel?: string;
  joined: string;
  lastActivity?: string;
  lastLogin?: string;
  href: string;
  publicHref: string;
  messageHref?: string;
  inferredFromFallback?: boolean;
  recordSourceLabel?: string;
  roles?: string[];
  contactMethod?: string;
  nextAction?: string;
  completionPercentage?: number;
  recordCategory?: RecordCategory;
  possibleDuplicate?: boolean;
  readyForReview?: boolean;
};

type GuruRecordsTableProps = {
  gurus: GuruDisplayRow[];
  exportHref: string;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function getSafeAdminHref(guru: GuruDisplayRow) {
  const existingHref = String(guru.href || "").trim();
  if (existingHref) return existingHref;

  const fallbackId = String(
    guru.id || guru.guruUserId || guru.userId || guru.email || "",
  ).trim();

  return fallbackId
    ? `/admin/gurus/${encodeURIComponent(fallbackId)}`
    : "/admin/gurus";
}

function getCompletion(guru: GuruDisplayRow) {
  const direct = Number(guru.completionPercentage);
  if (Number.isFinite(direct)) return Math.max(0, Math.min(100, direct));
  if (guru.bookable) return 100;
  return 10;
}

function normalizePhoneKey(value: string | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function toProperPersonName(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Angel Costner";
  return cleaned
    .split(" ")
    .map((part) => {
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function getMergePartner(
  guru: GuruDisplayRow,
  all: GuruDisplayRow[],
): GuruDisplayRow | null {
  if (!guru.possibleDuplicate) return null;
  const phoneKey = normalizePhoneKey(guru.phone);
  if (phoneKey.length < 10) return null;

  const siblings = all.filter((row) => {
    if (row.id === guru.id) return false;
    if ((row.userId || row.guruUserId) === (guru.userId || guru.guruUserId)) {
      return false;
    }
    return normalizePhoneKey(row.phone) === phoneKey;
  });

  if (!siblings.length) return null;

  // Prefer the stronger profile as canonical partner.
  return [...siblings].sort(
    (a, b) => getCompletion(b) - getCompletion(a),
  )[0];
}

function getCompletionStyles(value: number) {
  if (value >= 80) return "bg-emerald-100 text-emerald-800";
  if (value >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function getStatusStyles(guru: GuruDisplayRow) {
  if (guru.recordCategory === "account_repair") {
    return "bg-violet-100 text-violet-800";
  }
  if (guru.recordCategory === "possible_duplicate") {
    return "bg-rose-100 text-rose-800";
  }
  if (guru.recordCategory === "needs_identity") {
    return "bg-amber-100 text-amber-800";
  }
  if (guru.bookable) return "bg-emerald-100 text-emerald-800";
  if (guru.readyForReview) return "bg-sky-100 text-sky-800";
  if (["approved", "pre_approved"].includes(guru.applicationStatus)) {
    return "bg-green-100 text-green-800";
  }
  if (["rejected", "suspended"].includes(guru.applicationStatus)) {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-amber-100 text-amber-800";
}

function getStatusLabel(guru: GuruDisplayRow) {
  if (guru.recordCategory === "account_repair") return "Account Repair";
  if (guru.recordCategory === "possible_duplicate") return "Possible Duplicate";
  if (guru.recordCategory === "needs_identity") return "Needs Identity";
  if (guru.bookable) return "Bookable";
  if (guru.readyForReview) return "Ready for Review";
  return guru.statusLabel || "Pending Setup";
}

function getRoleStyles(role: string) {
  if (role === "Guru") return "bg-emerald-100 text-emerald-800";
  if (role === "Pet Parent") return "bg-sky-100 text-sky-800";
  if (role === "Ambassador") return "bg-violet-100 text-violet-800";
  if (role === "Super Admin") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

function getMissingSummary(guru: GuruDisplayRow) {
  const missing = guru.missingRequirements || [];
  if (!missing.length) return "No profile blockers detected";

  const shown = missing.slice(0, 3);
  const remaining = missing.length - shown.length;
  return `${shown.join(", ")}${remaining > 0 ? ` +${remaining} more` : ""}`;
}

function searchMatches(guru: GuruDisplayRow, query: string) {
  if (!query) return true;

  return [
    guru.id,
    guru.userId || "",
    guru.name,
    guru.email,
    guru.phone || "",
    guru.location,
    guru.services,
    guru.statusLabel,
    guru.nextAction || "",
    guru.contactMethod || "",
    ...(guru.roles || []),
    ...(guru.missingRequirements || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function getPriority(guru: GuruDisplayRow) {
  if (guru.flaggedForReview) return 0;
  if (guru.recordCategory === "account_repair") return 1;
  if (guru.recordCategory === "possible_duplicate") return 2;
  if (guru.recordCategory === "needs_identity") return 3;
  if (guru.readyForReview) return 4;
  if (!guru.bookable) return 5;
  return 6;
}

type GuruSortKey =
  | "priority"
  | "name-asc"
  | "name-desc"
  | "completion-desc"
  | "completion-asc"
  | "activity-desc"
  | "activity-asc"
  | "status-bookable"
  | "status-setup";

function getActivityTime(guru: GuruDisplayRow) {
  const raw = guru.lastActivity || guru.joined || "";
  if (!raw || raw === "—") return 0;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareNames(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function sortGurusByPriority(gurus: GuruDisplayRow[]) {
  return [...gurus].sort((a, b) => {
    const priorityDifference = getPriority(a) - getPriority(b);
    if (priorityDifference) return priorityDifference;

    const completionDifference = getCompletion(b) - getCompletion(a);
    if (completionDifference) return completionDifference;

    return compareNames(a.name, b.name);
  });
}

function sortGurus(gurus: GuruDisplayRow[], sortKey: GuruSortKey) {
  if (sortKey === "priority") return sortGurusByPriority(gurus);

  return [...gurus].sort((a, b) => {
    switch (sortKey) {
      case "name-asc":
        return compareNames(a.name, b.name);
      case "name-desc":
        return compareNames(b.name, a.name);
      case "completion-desc": {
        const diff = getCompletion(b) - getCompletion(a);
        return diff || compareNames(a.name, b.name);
      }
      case "completion-asc": {
        const diff = getCompletion(a) - getCompletion(b);
        return diff || compareNames(a.name, b.name);
      }
      case "activity-desc": {
        const diff = getActivityTime(b) - getActivityTime(a);
        return diff || compareNames(a.name, b.name);
      }
      case "activity-asc": {
        const diff = getActivityTime(a) - getActivityTime(b);
        return diff || compareNames(a.name, b.name);
      }
      case "status-bookable": {
        const aRank = a.bookable ? 0 : 1;
        const bRank = b.bookable ? 0 : 1;
        return aRank - bRank || getPriority(a) - getPriority(b) || compareNames(a.name, b.name);
      }
      case "status-setup": {
        const aRank = a.bookable ? 1 : 0;
        const bRank = b.bookable ? 1 : 0;
        return aRank - bRank || getPriority(a) - getPriority(b) || compareNames(a.name, b.name);
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
    return <img alt="" src={src} className="h-full w-full object-cover" />;
  }

  return <>{fallbackInitials(name, email, "G")}</>;
}

export default function GuruRecordsTable({
  gurus,
  exportHref,
}: GuruRecordsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<GuruSortKey>("priority");

  const visibleGurus = useMemo(() => {
    return sortGurus(
      gurus.filter((guru) => searchMatches(guru, query.trim())),
      sortKey,
    );
  }, [gurus, query, sortKey]);

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
            Each person appears once. Role badges show whether they also use SitGuru as a Pet Parent or Ambassador. The recommended next action keeps the review process simple.
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
            onChange={(event) => setSortKey(event.target.value as GuruSortKey)}
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
            <option value="status-bookable">Status (Bookable first)</option>
            <option value="status-setup">Status (Needs setup first)</option>
          </select>

          <Link
            href={exportHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            <Download size={17} />
            Export
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
        Showing {number(visibleGurus.length)} of {number(gurus.length)} people in this queue.
      </div>

      {visibleGurus.length ? (
        <div className="mt-5 space-y-3">
          {visibleGurus.map((guru) => {
            const completion = getCompletion(guru);
            const adminHref = getSafeAdminHref(guru);
            const canMessage = Boolean(guru.messageHref);
            const canViewPublic = guru.isPublicVisible || guru.bookable;

            return (
              <article
                key={`${guru.id}-${guru.userId || ""}`}
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr_1.05fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-700 text-sm font-black text-white">
                        <Avatar
                          name={guru.name}
                          email={guru.email}
                          src={guru.avatarUrl}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-black text-slate-950">
                            {guru.name || "Unnamed Guru"}
                          </h3>
                          {guru.flaggedForReview ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-800">
                              <AlertTriangle size={11} /> Flagged
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(guru.roles || ["Guru"]).map((role) => (
                            <span
                              key={role}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getRoleStyles(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                          <p>{guru.contactMethod || "Contact not classified"}</p>
                          <p className="truncate">
                            {emailFallback(guru.email, "No email provided")}
                            {guru.phone && guru.phone !== "No phone on file"
                              ? ` • ${guru.phone}`
                              : ""}
                          </p>
                          <p>{guru.location || "Location not added yet"}</p>
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
                      {getMissingSummary(guru)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusStyles(guru)}`}
                    >
                      {getStatusLabel(guru)}
                    </span>
                    <p className="mt-3 text-sm font-black text-slate-950">
                      {guru.nextAction || "Open Guru review"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last activity: {guru.lastActivity || guru.joined || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last login: {guru.lastLogin || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Source: {guru.recordSourceLabel || "Guru workspace"}
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <Link
                      href={adminHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                    >
                      {guru.recordCategory === "account_repair" ? (
                        <Wrench size={16} />
                      ) : (
                        <UserRoundCheck size={16} />
                      )}
                      {guru.recordCategory === "account_repair"
                        ? "Repair Account"
                        : "Review Guru"}
                    </Link>

                    {(guru.roles || []).includes("Pet Parent") &&
                    (guru.userId || guru.guruUserId) ? (
                      <Link
                        href={`/admin/petparents/${encodeURIComponent(
                          guru.userId || guru.guruUserId || "",
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                      >
                        <UserRoundCheck size={15} /> Review Pet Parent
                      </Link>
                    ) : null}

                    {(guru.roles || []).includes("Ambassador") &&
                    (guru.userId || guru.guruUserId) ? (
                      <Link
                        href={`/admin/ambassadors?q=${encodeURIComponent(
                          guru.email ||
                            guru.name ||
                            guru.userId ||
                            guru.guruUserId ||
                            "",
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-800 transition hover:bg-violet-100"
                      >
                        <UserRoundCheck size={15} /> Review Ambassador
                      </Link>
                    ) : null}

                    {(() => {
                      const partner = getMergePartner(guru, gurus);
                      if (!partner) return null;
                      const selfCompletion = getCompletion(guru);
                      const partnerCompletion = getCompletion(partner);
                      const keepSelf = selfCompletion >= partnerCompletion;
                      const canonicalUserId = String(
                        (keepSelf
                          ? guru.userId || guru.guruUserId || guru.id
                          : partner.userId || partner.guruUserId || partner.id) ||
                          "",
                      );
                      const duplicateUserId = String(
                        (keepSelf
                          ? partner.userId || partner.guruUserId || partner.id
                          : guru.userId || guru.guruUserId || guru.id) || "",
                      );
                      const displayName = toProperPersonName(
                        keepSelf ? guru.name : partner.name || guru.name,
                      );
                      // Only render the merge CTA on the duplicate (weaker) card
                      // to avoid two identical merge buttons.
                      if (keepSelf) return null;
                      return (
                        <MergeDuplicateGuruButton
                          canonicalUserId={canonicalUserId}
                          duplicateUserId={duplicateUserId}
                          displayName={displayName}
                          label={`Merge into ${displayName}`}
                        />
                      );
                    })()}

                    {canMessage ? (
                      <Link
                        href={guru.messageHref || "/admin/messages"}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                      >
                        {guru.contactMethod === "Email only" ? (
                          <Mail size={15} />
                        ) : (
                          <MessageCircle size={15} />
                        )}
                        Message
                      </Link>
                    ) : null}

                    {canViewPublic ? (
                      <Link
                        href={guru.publicHref || "/search"}
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
          No Guru accounts match this queue or search. Clear the search or choose another queue above.
        </div>
      )}
    </div>
  );
}