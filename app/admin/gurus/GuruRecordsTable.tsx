"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  Download,
  Eye,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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

type GuruDisplayRow = {
  id: string;
  userId?: string;
  guruUserId?: string;
  name: string;
  email: string;
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
  approvedThisWeek?: boolean;
  flaggedForReview?: boolean;
  setupStep?: number;
  setupStepLabel?: string;
  joined: string;
  href: string;
  publicHref: string;
  messageHref?: string;
};

type SortKey =
  | "name"
  | "email"
  | "services"
  | "location"
  | "experience"
  | "applicationStatus"
  | "profileQuality"
  | "identityStatus"
  | "backgroundStatus"
  | "safetyStatus"
  | "setupStep"
  | "bookable"
  | "joined";

type SortDirection = "asc" | "desc";

type GuruRecordsTableProps = {
  gurus: GuruDisplayRow[];
  exportHref: string;
};

const sortLabels: Record<SortKey, string> = {
  name: "Guru",
  email: "Email",
  services: "Services",
  location: "Location",
  experience: "Experience",
  applicationStatus: "Application",
  profileQuality: "Profile",
  identityStatus: "Identity",
  backgroundStatus: "Background",
  safetyStatus: "Safety",
  setupStep: "Setup Step",
  bookable: "Bookable",
  joined: "Joined",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function getDateValue(value: string) {
  if (!value || value === "—") return 0;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getExperienceNumber(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSafeReviewHref(guru: GuruDisplayRow) {
  const existingHref = String(guru.href || "").trim();

  if (
    existingHref.startsWith("/admin/gurus/") &&
    existingHref !== "/admin/gurus/"
  ) {
    return existingHref;
  }

  const fallbackId = String(
    guru.id || guru.guruUserId || guru.userId || guru.email || "",
  ).trim();

  if (fallbackId) {
    return `/admin/gurus/${encodeURIComponent(fallbackId)}`;
  }

  return "/admin/gurus";
}

function getGuruMessageHref(guru: GuruDisplayRow) {
  if (guru.messageHref) return guru.messageHref;

  const params = new URLSearchParams();

  const guruUserId = String(guru.guruUserId || guru.userId || "").trim();
  const guruId = String(guru.id || "").trim();
  const email = String(guru.email || "").trim().toLowerCase();

  if (guruUserId) {
    params.set("guruUserId", guruUserId);
  }

  if (guruId) {
    params.set("guruId", guruId);
  }

  if (email) {
    params.set("email", email);
  }

  params.set("source", "admin-gurus");

  return `/messages/admin?${params.toString()}`;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        alt={name}
        src={src}
        className="h-14 w-14 shrink-0 rounded-2xl border border-emerald-100 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-sm font-black text-emerald-800 shadow-sm">
      {getInitials(name) || "SG"}
    </div>
  );
}

function applicationStatusClasses(status: ApplicationStatus) {
  switch (status) {
    case "bookable":
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "pre_approved":
    case "verification_pending":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "reviewing":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "needs_info":
    case "new":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rejected":
    case "suspended":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function qualityClasses(quality: string) {
  if (quality === "Complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function credentialClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    normalized === "pending" ||
    normalized === "in progress" ||
    normalized === "not started"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (
    normalized === "needs review" ||
    normalized === "consider" ||
    normalized === "rejected" ||
    normalized === "failed" ||
    normalized === "suspended" ||
    normalized === "canceled"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function setupStepClasses(step?: number) {
  if (!step) return "border-slate-200 bg-slate-50 text-slate-700";
  if (step >= 5) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (step >= 4) return "border-sky-200 bg-sky-50 text-sky-800";
  if (step >= 3) return "border-violet-200 bg-violet-50 text-violet-800";
  if (step >= 2) return "border-amber-200 bg-amber-50 text-amber-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function actionClasses(step?: number, bookable?: boolean) {
  if (bookable || (step || 0) >= 5) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if ((step || 0) >= 4) {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  if ((step || 0) >= 3) {
    return "border-violet-200 bg-violet-50 text-violet-900";
  }

  if ((step || 0) >= 2) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function getNextNeededAction(guru: GuruDisplayRow) {
  const step = guru.setupStep || 0;

  if (guru.flaggedForReview) {
    return "Review flagged trust, safety, or quality concern before moving forward.";
  }

  if (guru.bookable || step >= 5) {
    return "No immediate setup action. Monitor quality, bookings, and customer readiness.";
  }

  if (step < 1) {
    return "Confirm account, email, and basic Guru profile record are created.";
  }

  if (step < 2) {
    return "Needs services, service area, travel radius, or pricing added.";
  }

  if (step < 3) {
    return "Needs public profile polish: bio, photo, experience, and customer-facing details.";
  }

  if (step < 4) {
    return "Needs Checkr / Trust workflow started or background-check package selected.";
  }

  return "Needs final Admin review before becoming approved or bookable.";
}

function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-black ${className}`}
    >
      {children}
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;
  const isTextSort =
    sortKey === "name" ||
    sortKey === "email" ||
    sortKey === "services" ||
    sortKey === "location" ||
    sortKey === "applicationStatus" ||
    sortKey === "profileQuality" ||
    sortKey === "identityStatus" ||
    sortKey === "backgroundStatus" ||
    sortKey === "safetyStatus";

  const Icon = isTextSort
    ? direction === "asc"
      ? ArrowDownAZ
      : ArrowUpAZ
    : direction === "asc"
      ? ArrowDownWideNarrow
      : ArrowUpWideNarrow;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black transition ${
        isActive
          ? "bg-emerald-700 text-white shadow-sm"
          : "bg-white text-slate-500 ring-1 ring-slate-100 hover:bg-emerald-50 hover:text-emerald-900"
      }`}
    >
      {label}
      {isActive ? <Icon size={13} /> : null}
    </button>
  );
}

function getSortValue(guru: GuruDisplayRow, sortKey: SortKey) {
  switch (sortKey) {
    case "name":
      return guru.name;
    case "email":
      return guru.email;
    case "services":
      return guru.services;
    case "location":
      return guru.location;
    case "experience":
      return getExperienceNumber(guru.experience);
    case "applicationStatus":
      return guru.statusLabel;
    case "profileQuality":
      return guru.profileQuality;
    case "identityStatus":
      return guru.identityStatus;
    case "backgroundStatus":
      return guru.backgroundStatus;
    case "safetyStatus":
      return guru.safetyStatus;
    case "setupStep":
      return guru.setupStep || 0;
    case "bookable":
      return guru.bookable ? 1 : 0;
    case "joined":
      return getDateValue(guru.joined);
    default:
      return "";
  }
}

function searchMatches(guru: GuruDisplayRow, query: string) {
  if (!query) return true;

  const nextAction = getNextNeededAction(guru);

  const searchableText = [
    guru.id,
    guru.userId || "",
    guru.guruUserId || "",
    guru.name,
    guru.email,
    guru.services,
    guru.location,
    guru.experience,
    guru.statusLabel,
    guru.profileQuality,
    guru.identityStatus,
    guru.backgroundStatus,
    guru.safetyStatus,
    guru.bookable ? "bookable visible active" : "not bookable hidden",
    guru.setupStepLabel || "",
    guru.setupStep ? `step ${guru.setupStep}` : "not started",
    nextAction,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-sm font-bold leading-6 text-slate-800">
        {value}
      </div>
    </div>
  );
}

function GuruRecordCard({ guru }: { guru: GuruDisplayRow }) {
  const setupLabel =
    guru.setupStepLabel ||
    (guru.setupStep ? `Step ${guru.setupStep}` : "Not Started");
  const nextAction = getNextNeededAction(guru);
  const messageHref = getGuruMessageHref(guru);
  const reviewHref = getSafeReviewHref(guru);

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdf4_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={guru.name} src={guru.avatarUrl} />

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
                {guru.name}
              </h3>

              <p className="mt-1 truncate text-sm font-bold text-slate-600">
                {guru.email}
              </p>

              <p className="mt-1 break-all text-xs font-semibold text-slate-400">
                Guru ID: {guru.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Pill className={applicationStatusClasses(guru.applicationStatus)}>
              {guru.statusLabel}
            </Pill>

            <Pill
              className={
                guru.bookable
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }
            >
              {guru.bookable ? "Bookable" : "Not Bookable"}
            </Pill>

            <Pill className={setupStepClasses(guru.setupStep)}>
              {setupLabel}
            </Pill>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Services" value={guru.services} />
            <FieldBlock label="Location" value={guru.location} />
            <FieldBlock label="Experience" value={guru.experience} />
            <FieldBlock label="Joined" value={guru.joined} />
          </div>

          <div
            className={`mt-4 rounded-3xl border p-4 ${actionClasses(
              guru.setupStep,
              guru.bookable,
            )}`}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-80">
              Next Needed Action
            </p>
            <p className="mt-2 text-sm font-black leading-6">{nextAction}</p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Readiness
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill className={qualityClasses(guru.profileQuality)}>
                Profile: {guru.profileQuality}
              </Pill>

              <Pill className={credentialClasses(guru.identityStatus)}>
                Identity: {guru.identityStatus}
              </Pill>

              <Pill className={credentialClasses(guru.backgroundStatus)}>
                Background: {guru.backgroundStatus}
              </Pill>

              <Pill className={credentialClasses(guru.safetyStatus)}>
                Safety: {guru.safetyStatus}
              </Pill>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a
              href={reviewHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Eye size={16} />
              Review Guru
            </a>

            <Link
              href={messageHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              <MessageCircle size={16} />
              Message Guru
            </Link>

            <Link
              href={guru.publicHref}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Public Profile
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GuruRecordsTable({
  gurus,
  exportHref,
}: GuruRecordsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const visibleGurus = useMemo(() => {
    const filtered = gurus.filter((guru) => searchMatches(guru, query.trim()));

    return [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      let result = 0;

      if (typeof aValue === "number" && typeof bValue === "number") {
        result = aValue - bValue;
      } else {
        result = compareText(String(aValue), String(bValue));
      }

      return sortDirection === "asc" ? result : result * -1;
    });
  }, [gurus, query, sortDirection, sortKey]);

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "joined" ? "desc" : "asc");
  }

  function clearSearch() {
    setQuery("");
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Guru Records
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Showing {number(visibleGurus.length)} of {number(gurus.length)}{" "}
                records from the current Admin queue.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search current results..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 sm:w-[320px]"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <Link
            href={exportHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Download size={17} />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fbfefc_0%,#f8fafc_100%)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Sort current queue
          </p>
          <p className="text-xs font-bold text-slate-400">
            Source rows: {number(gurus.length)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <SortButton
              key={key}
              label={sortLabels[key]}
              sortKey={key}
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={handleSort}
            />
          ))}
        </div>
      </div>

      {visibleGurus.length ? (
        <div className="grid gap-4">
          {visibleGurus.map((guru) => (
            <GuruRecordCard key={guru.id} guru={guru} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">
            No Gurus found for this current Admin queue.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Try clearing the search box or going back to the full Guru records
            page.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-900">
        This section only renders the Guru rows passed from{" "}
        <span className="font-black">app/admin/gurus/page.tsx</span>, so
        reached-step and missing-step queues stay filtered.
      </div>
    </div>
  );
}