"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  LayoutDashboard,
  Search,
  Settings,
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
  bookingCount?: number;
  totalBookings?: number;
  earnings?: number;
  totalEarnings?: number;
  totalRevenue?: number;
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

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSafeAdminHref(guru: GuruDisplayRow) {
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

function getGuruDashboardPreviewHref(guru: GuruDisplayRow) {
  /*
   * Guru dashboard-preview route does not exist yet.
   * Until app/admin/gurus/[id]/dashboard-preview/page.tsx is built,
   * keep Dashboard View pointed at the existing Guru admin detail page
   * so the registry never sends Admin to a 404.
   */
  return getSafeAdminHref(guru);
}

function getGuruLocationLabel(guru: GuruDisplayRow) {
  return guru.location && guru.location !== "Location not listed"
    ? guru.location
    : "Location not added yet";
}

function getGuruBookings(guru: GuruDisplayRow) {
  return (
    asNumber(guru.bookingCount) ||
    asNumber(guru.totalBookings) ||
    asNumber((guru as Record<string, unknown>).bookings_count) ||
    asNumber((guru as Record<string, unknown>).booking_count)
  );
}

function getGuruEarnings(guru: GuruDisplayRow) {
  return (
    asNumber(guru.earnings) ||
    asNumber(guru.totalEarnings) ||
    asNumber(guru.totalRevenue) ||
    asNumber((guru as Record<string, unknown>).total_earnings) ||
    asNumber((guru as Record<string, unknown>).earnings_total) ||
    asNumber((guru as Record<string, unknown>).revenue)
  );
}

function getGuruCompletion(guru: GuruDisplayRow) {
  if (guru.bookable) return 100;

  const step = guru.setupStep || 0;

  if (step >= 5) return 100;
  if (step === 4) return 80;
  if (step === 3) return 60;
  if (step === 2) return 40;
  if (step === 1) return 20;

  if (guru.profileQuality === "Complete") return 60;

  return 10;
}

function getCompletionClasses(percentage: number) {
  if (percentage >= 80) return "bg-green-100 text-green-800";
  if (percentage >= 50) return "bg-amber-100 text-amber-800";

  return "bg-rose-100 text-rose-800";
}

function getGuruStatusClasses(guru: GuruDisplayRow) {
  if (guru.bookable || guru.applicationStatus === "bookable") {
    return "bg-green-100 text-green-800";
  }

  if (
    guru.applicationStatus === "approved" ||
    guru.applicationStatus === "pre_approved"
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (
    guru.applicationStatus === "reviewing" ||
    guru.applicationStatus === "verification_pending"
  ) {
    return "bg-sky-100 text-sky-800";
  }

  if (
    guru.applicationStatus === "needs_info" ||
    guru.applicationStatus === "new"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    guru.applicationStatus === "rejected" ||
    guru.applicationStatus === "suspended"
  ) {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-100 text-slate-700";
}

function getGuruStatusLabel(guru: GuruDisplayRow) {
  if (guru.bookable) return "Bookable Guru";

  return guru.statusLabel || "Application Received";
}

function searchMatches(guru: GuruDisplayRow, query: string) {
  if (!query) return true;

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
    guru.bookable ? "bookable active public visible" : "not bookable hidden",
    guru.setupStepLabel || "",
    guru.setupStep ? `step ${guru.setupStep}` : "not started",
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

function sortGurusForRegistry(gurus: GuruDisplayRow[]) {
  return [...gurus].sort((a, b) => {
    const aBookable = a.bookable ? 1 : 0;
    const bBookable = b.bookable ? 1 : 0;

    if (aBookable !== bBookable) return bBookable - aBookable;

    const aCompletion = getGuruCompletion(a);
    const bCompletion = getGuruCompletion(b);

    if (aCompletion !== bCompletion) return bCompletion - aCompletion;

    return a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return <img alt="" src={src} className="h-full w-full object-cover" />;
  }

  return <>{getInitials(name) || "G"}</>;
}

export default function GuruRecordsTable({
  gurus,
  exportHref,
}: GuruRecordsTableProps) {
  const [query, setQuery] = useState("");

  const visibleGurus = useMemo(() => {
    const filtered = gurus.filter((guru) => searchMatches(guru, query.trim()));
    return sortGurusForRegistry(filtered);
  }, [gurus, query]);

  function clearSearch() {
    setQuery("");
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Super Admin Guru Registry
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Click into each Guru view
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
            View each Guru through their dashboard view, public profile, or admin
            cleanup controls. Public profile previews are customer-facing. Admin
            cleanup controls are updatable.
          </p>
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
              placeholder="Search Gurus..."
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <Download size={17} />
            Export
          </Link>

          <Link
            href="/admin/gurus"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
          >
            <SlidersHorizontal size={17} />
            Open Gurus
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Guru queue
            </p>
            <p className="mt-1 text-xs font-bold text-emerald-900">
              Showing {number(visibleGurus.length)} of {number(gurus.length)}{" "}
              real Guru records. Demo, test, fake, bot, and deleted placeholder
              rows are excluded before this table renders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/gurus"
              className="inline-flex items-center rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              All Real Gurus
            </Link>
            <Link
              href="/admin/gurus?queue=pending-reviews"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-900 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              Pending Review
            </Link>
            <Link
              href="/admin/gurus?status=bookable"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-900 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              Bookable
            </Link>
            <Link
              href="/admin/gurus?filter=profile-updates"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-900 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              Profile Updates
            </Link>
            <Link
              href="/admin/gurus?queue=flagged-review"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-900 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              Flagged Review
            </Link>
          </div>
        </div>
      </div>

      {visibleGurus.length ? (
        <div className="overflow-hidden rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9]">
          <div className="hidden grid-cols-[1.3fr_0.95fr_0.72fr_0.62fr_0.55fr_0.55fr_1.45fr] gap-3 border-b border-[#e3ece5] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 xl:grid">
            <span>Guru</span>
            <span>Location</span>
            <span>Status</span>
            <span>Completion</span>
            <span>Bookings</span>
            <span>Earnings</span>
            <span className="text-right">Views / Controls</span>
          </div>

          <div className="divide-y divide-[#e3ece5]">
            {visibleGurus.map((guru) => {
              const completion = getGuruCompletion(guru);
              const bookings = getGuruBookings(guru);
              const earnings = getGuruEarnings(guru);
              const adminHref = getSafeAdminHref(guru);
              const dashboardHref = getGuruDashboardPreviewHref(guru);

              return (
                <div
                  key={`${guru.id}-${guru.email}`}
                  className="grid gap-4 bg-white px-4 py-4 transition hover:bg-green-50/60 xl:grid-cols-[1.3fr_0.95fr_0.72fr_0.62fr_0.55fr_0.55fr_1.45fr] xl:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-800 text-sm font-black text-white">
                        <Avatar name={guru.name} src={guru.avatarUrl} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {guru.name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {guru.email || "No email on Guru profile yet"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-600">
                    {getGuruLocationLabel(guru)}
                  </p>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-black",
                        getGuruStatusClasses(guru),
                      ].join(" ")}
                    >
                      {getGuruStatusLabel(guru)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-black",
                        getCompletionClasses(completion),
                      ].join(" ")}
                    >
                      {completion}%
                    </span>
                  </div>

                  <p className="text-sm font-black text-slate-950">
                    {number(bookings)}
                    <span className="ml-1 text-xs font-bold text-slate-400">
                      total
                    </span>
                  </p>

                  <p className="text-sm font-black text-green-800">
                    {money(earnings)}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:justify-end">
                    <Link
                      href={dashboardHref}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 shadow-sm transition hover:bg-sky-100"
                    >
                      <LayoutDashboard size={14} />
                      Dashboard View
                    </Link>

                    <Link
                      href={guru.publicHref || "/search"}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                    >
                      <Eye size={14} />
                      Public Profile
                    </Link>

                    <Link
                      href={adminHref}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-green-800 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-green-900"
                    >
                      <Settings size={14} />
                      Admin Cleanup
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-6 text-sm font-bold leading-6 text-green-900">
          No visible Guru records were found for this current Admin queue. Try
          clearing the search box or returning to the full Guru records page.
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-900">
        This section renders the real Guru queue passed from{" "}
        <span className="font-black">app/admin/gurus/page.tsx</span> using the
        same registry format as the Pet Parent admin view.
      </div>
    </div>
  );
}