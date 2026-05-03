"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  Download,
  Eye,
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
  joined: string;
  href: string;
  publicHref: string;
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

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        alt={name}
        src={src}
        className="h-12 w-12 shrink-0 rounded-full border border-green-100 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50 text-sm font-black text-green-800 shadow-sm">
      {getInitials(name) || "SG"}
    </div>
  );
}

function applicationStatusClasses(status: ApplicationStatus) {
  switch (status) {
    case "bookable":
    case "approved":
      return "border-emerald-200 bg-emerald-100 text-emerald-900";
    case "pre_approved":
    case "verification_pending":
      return "border-sky-200 bg-sky-100 text-sky-900";
    case "reviewing":
      return "border-violet-200 bg-violet-100 text-violet-900";
    case "needs_info":
    case "new":
      return "border-amber-200 bg-amber-100 text-amber-900";
    case "rejected":
    case "suspended":
      return "border-rose-200 bg-rose-100 text-rose-900";
    default:
      return "border-slate-200 bg-slate-100 text-slate-800";
  }
}

function qualityClasses(quality: string) {
  if (quality === "Complete") {
    return "border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  return "border-amber-200 bg-amber-100 text-amber-900";
}

function credentialClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  ) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized === "pending" || normalized === "in progress") {
    return "border-sky-200 bg-sky-100 text-sky-900";
  }

  if (normalized === "rejected" || normalized === "failed") {
    return "border-rose-200 bg-rose-100 text-rose-900";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatusPill({ guru }: { guru: GuruDisplayRow }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${applicationStatusClasses(
        guru.applicationStatus,
      )}`}
    >
      {guru.statusLabel}
    </span>
  );
}

function QualityPill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${qualityClasses(
        value,
      )}`}
    >
      {value}
    </span>
  );
}

function CredentialPill({ label, value }: { label: string; value: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-black ${credentialClasses(
        value,
      )}`}
    >
      {label}: {value}
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

  const Icon =
    direction === "asc"
      ? isTextSort
        ? ArrowUpAZ
        : ArrowUpWideNarrow
      : isTextSort
        ? ArrowDownAZ
        : ArrowDownWideNarrow;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1.5 text-left text-xs font-black uppercase tracking-[0.12em] transition ${
        isActive ? "text-green-800" : "text-slate-500 hover:text-green-800"
      }`}
    >
      {label}
      {isActive ? <Icon size={13} /> : null}
    </button>
  );
}

function GuruMobileCard({ guru }: { guru: GuruDisplayRow }) {
  return (
    <Link
      href={guru.href}
      className="block rounded-[26px] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:border-green-200 hover:shadow-md lg:hidden"
    >
      <div className="flex items-start gap-3">
        <Avatar name={guru.name} src={guru.avatarUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">
                {guru.name}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                {guru.email}
              </p>
            </div>

            <StatusPill guru={guru} />
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl bg-[#f8fbf6] p-4 text-sm font-bold text-slate-600">
            <MobileMetric label="Services" value={guru.services} />
            <MobileMetric label="Location" value={guru.location} />
            <MobileMetric label="Experience" value={guru.experience} />
            <MobileMetric label="Profile" value={guru.profileQuality} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CredentialPill label="ID" value={guru.identityStatus} />
            <CredentialPill label="BG" value={guru.backgroundStatus} />
            <CredentialPill label="Safety" value={guru.safetyStatus} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function GuruRecordsTable({
  gurus,
  exportHref,
}: GuruRecordsTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [profileFilter, setProfileFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");
  const [bookableFilter, setBookableFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const statuses = useMemo(
    () =>
      [
        "All",
        ...Array.from(new Set(gurus.map((guru) => guru.statusLabel))).filter(
          Boolean,
        ),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [gurus],
  );

  const profileQualities = useMemo(
    () =>
      [
        "All",
        ...Array.from(new Set(gurus.map((guru) => guru.profileQuality))).filter(
          Boolean,
        ),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [gurus],
  );

  const trustStatuses = useMemo(
    () =>
      [
        "All",
        "Ready",
        "Needs Trust Review",
        "Identity Pending",
        "Background Pending",
        "Safety Pending",
      ],
    [],
  );

  const filteredGurus = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = gurus.filter((guru) => {
      const trustText = [
        guru.identityStatus,
        guru.backgroundStatus,
        guru.safetyStatus,
      ]
        .join(" ")
        .toLowerCase();

      const searchText = [
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
      ]
        .join(" ")
        .toLowerCase();

      const identityReady = [
        "verified",
        "clear",
        "cleared",
        "approved",
      ].includes(guru.identityStatus.toLowerCase());

      const backgroundReady = [
        "verified",
        "clear",
        "cleared",
        "approved",
      ].includes(guru.backgroundStatus.toLowerCase());

      const safetyReady = [
        "verified",
        "clear",
        "cleared",
        "approved",
      ].includes(guru.safetyStatus.toLowerCase());

      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || guru.statusLabel === statusFilter;
      const matchesProfile =
        profileFilter === "All" || guru.profileQuality === profileFilter;
      const matchesBookable =
        bookableFilter === "All" ||
        (bookableFilter === "Bookable" && guru.bookable) ||
        (bookableFilter === "Not Bookable" && !guru.bookable);

      let matchesTrust = true;

      if (trustFilter === "Ready") {
        matchesTrust = identityReady && backgroundReady && safetyReady;
      }

      if (trustFilter === "Needs Trust Review") {
        matchesTrust = !identityReady || !backgroundReady || !safetyReady;
      }

      if (trustFilter === "Identity Pending") {
        matchesTrust =
          !identityReady ||
          trustText.includes("identity pending") ||
          guru.identityStatus.toLowerCase().includes("pending");
      }

      if (trustFilter === "Background Pending") {
        matchesTrust =
          !backgroundReady ||
          trustText.includes("background pending") ||
          guru.backgroundStatus.toLowerCase().includes("pending");
      }

      if (trustFilter === "Safety Pending") {
        matchesTrust =
          !safetyReady ||
          trustText.includes("safety pending") ||
          guru.safetyStatus.toLowerCase().includes("pending");
      }

      return (
        matchesQuery &&
        matchesStatus &&
        matchesProfile &&
        matchesBookable &&
        matchesTrust
      );
    });

    filtered.sort((a, b) => {
      let result = 0;

      if (sortKey === "name") result = compareText(a.name, b.name);
      if (sortKey === "email") result = compareText(a.email, b.email);
      if (sortKey === "services") result = compareText(a.services, b.services);
      if (sortKey === "location") result = compareText(a.location, b.location);
      if (sortKey === "experience") {
        result =
          Number(a.experience.match(/\d+/)?.[0] || 0) -
          Number(b.experience.match(/\d+/)?.[0] || 0);
      }
      if (sortKey === "applicationStatus") {
        result = compareText(a.statusLabel, b.statusLabel);
      }
      if (sortKey === "profileQuality") {
        result = compareText(a.profileQuality, b.profileQuality);
      }
      if (sortKey === "identityStatus") {
        result = compareText(a.identityStatus, b.identityStatus);
      }
      if (sortKey === "backgroundStatus") {
        result = compareText(a.backgroundStatus, b.backgroundStatus);
      }
      if (sortKey === "safetyStatus") {
        result = compareText(a.safetyStatus, b.safetyStatus);
      }
      if (sortKey === "bookable") {
        result = Number(a.bookable) - Number(b.bookable);
      }
      if (sortKey === "joined") {
        result = getDateValue(a.joined) - getDateValue(b.joined);
      }

      return sortDirection === "asc" ? result : -result;
    });

    return filtered;
  }, [
    gurus,
    query,
    statusFilter,
    profileFilter,
    trustFilter,
    bookableFilter,
    sortKey,
    sortDirection,
  ]);

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(
      nextSortKey === "joined" ||
        nextSortKey === "experience" ||
        nextSortKey === "bookable"
        ? "desc"
        : "asc",
    );
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setProfileFilter("All");
    setTrustFilter("All");
    setBookableFilter("All");
    setSortKey("joined");
    setSortDirection("desc");
  }

  const hasActiveFilters =
    query ||
    statusFilter !== "All" ||
    profileFilter !== "All" ||
    trustFilter !== "All" ||
    bookableFilter !== "All" ||
    sortKey !== "joined" ||
    sortDirection !== "desc";

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-xl font-black text-slate-950">Guru Records</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Search, filter, and sort individualized Guru admin records.
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Sorted by {sortLabels[sortKey]} ·{" "}
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
            {number(filteredGurus.length)} visible Gurus
          </div>

          <Link
            href={exportHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
          >
            <Download size={16} />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-green-900">
          <SlidersHorizontal size={17} />
          Organize Guru Data
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_1.1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search Gurus</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Guru, email, service, city, trust status..."
              className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
            />
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  Status: {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by profile quality</span>
            <select
              value={profileFilter}
              onChange={(event) => setProfileFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {profileQualities.map((quality) => (
                <option key={quality} value={quality}>
                  Profile: {quality}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by trust checks</span>
            <select
              value={trustFilter}
              onChange={(event) => setTrustFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {trustStatuses.map((status) => (
                <option key={status} value={status}>
                  Trust: {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by bookable status</span>
            <select
              value={bookableFilter}
              onChange={(event) => setBookableFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {["All", "Bookable", "Not Bookable"].map((status) => (
                <option key={status} value={status}>
                  Visibility: {status}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 text-sm font-black text-green-900 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {filteredGurus.map((guru) => (
          <GuruMobileCard key={`${guru.id}-${guru.applicationStatus}`} guru={guru} />
        ))}

        {filteredGurus.length === 0 ? (
          <div className="rounded-[26px] border border-[#e3ece5] bg-white p-8 text-center">
            <Search className="mx-auto mb-3 text-slate-400" size={34} />
            <p className="text-base font-black text-slate-950">
              No Guru records match these filters.
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Try clearing filters or searching another Guru, service, city, or
              trust status.
            </p>
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-[#edf3ee] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px]">
            <thead className="bg-[#f7faf4]">
              <tr>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Guru"
                    sortKey="name"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Services"
                    sortKey="services"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Location"
                    sortKey="location"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Experience"
                    sortKey="experience"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Application"
                    sortKey="applicationStatus"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Trust Checks"
                    sortKey="identityStatus"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Profile"
                    sortKey="profileQuality"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Bookable"
                    sortKey="bookable"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Joined"
                    sortKey="joined"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredGurus.map((guru) => (
                <tr
                  key={`${guru.id}-${guru.applicationStatus}`}
                  className="border-t border-[#edf3ee] transition hover:bg-[#fbfcf9]"
                >
                  <td className="px-5 py-4">
                    <Link href={guru.href} className="flex items-center gap-3">
                      <Avatar name={guru.name} src={guru.avatarUrl} />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-black text-slate-950 transition hover:text-green-800">
                          {guru.name}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-bold text-slate-500">
                          {guru.email}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    <span className="line-clamp-2 max-w-[180px]">
                      {guru.services}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {guru.location}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {guru.experience}
                  </td>

                  <td className="px-5 py-4">
                    <StatusPill guru={guru} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <CredentialPill label="ID" value={guru.identityStatus} />
                      <CredentialPill label="BG" value={guru.backgroundStatus} />
                      <CredentialPill label="Safety" value={guru.safetyStatus} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <QualityPill value={guru.profileQuality} />
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {guru.bookable ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {guru.joined}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={guru.href}
                        className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-50"
                      >
                        Review
                      </Link>

                      {guru.bookable ? (
                        <Link
                          href={guru.publicHref}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-green-800 px-3 py-2 text-xs font-black text-white transition hover:bg-green-900"
                        >
                          <Eye size={13} />
                          Public
                        </Link>
                      ) : (
                        <Link
                          href={guru.href}
                          className="inline-flex items-center justify-center rounded-xl bg-green-800 px-3 py-2 text-xs font-black text-white transition hover:bg-green-900"
                        >
                          Decide
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredGurus.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-14 text-center text-base font-bold text-slate-500"
                  >
                    <Search className="mx-auto mb-3 text-slate-400" size={34} />
                    <p className="text-base font-black text-slate-950">
                      No Guru records match these filters.
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Try clearing filters or searching another Guru, service,
                      city, or trust status.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}