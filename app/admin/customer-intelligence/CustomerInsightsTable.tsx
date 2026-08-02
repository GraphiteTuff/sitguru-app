"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  Eye,
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { emailFallback, fallbackInitials } from "@/lib/sitguru/display";

type CustomerInsight = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  signupQualityLabel?: string;
  nameSource?: string;
  emailSource?: string;
  photoSource?: string;
  locationSource?: string;
  source: string;
  campaign: string;
  bookingCount: number;
  paidBookingCount: number;
  completedBookingCount: number;
  totalSpend: number;
  averageBookingValue: number;
  petCount: number;
  messageCount: number;
  lastBookingDate: string | null;
  firstSeenDate: string | null;
  segment: string;
  profileCompletion?: number;
};

type SortKey =
  | "name"
  | "segment"
  | "source"
  | "location"
  | "profileCompletion"
  | "totalSpend"
  | "bookingCount"
  | "averageBookingValue"
  | "petCount"
  | "messageCount"
  | "lastBookingDate";

type SortDirection = "asc" | "desc";

type CustomerInsightsTableProps = {
  customers: CustomerInsight[];
  exportHref: string;
  usersHref?: string;
};

const sortLabels: Record<SortKey, string> = {
  name: "Customer",
  segment: "Status",
  source: "Source",
  location: "Location",
  profileCompletion: "Completion",
  totalSpend: "Spend",
  bookingCount: "Bookings",
  averageBookingValue: "Average Booking",
  petCount: "Pets",
  messageCount: "Messages",
  lastBookingDate: "Last Booking",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Not available";
  }
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function getDateValue(value: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCompletionValue(customer: CustomerInsight) {
  if (typeof customer.profileCompletion === "number") {
    return Math.max(0, Math.min(100, Math.round(customer.profileCompletion)));
  }

  const fields = [
    customer.name && customer.name !== "Customer" ? "name" : "",
    customer.email ? "email" : "",
    customer.city || customer.state || customer.zipCode ? "location" : "",
    customer.petCount > 0 ? "pets" : "",
    customer.messageCount > 0 ? "messages" : "",
    customer.bookingCount > 0 ? "bookings" : "",
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

function getCompletionClasses(percentage: number) {
  if (percentage >= 80) return "bg-emerald-100 text-emerald-800";
  if (percentage >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function getLocation(customer: CustomerInsight) {
  const cityStateCountry = [customer.city, customer.state, customer.country]
    .filter(Boolean)
    .join(", ");

  if (cityStateCountry && customer.zipCode) {
    return `${cityStateCountry} ${customer.zipCode}`;
  }

  return cityStateCountry || customer.zipCode || "Location not added yet";
}

function getCustomerStatus(customer: CustomerInsight) {
  return customer.signupQualityLabel || customer.segment || "Registered";
}

function segmentClasses(segment: string) {
  const normalized = segment.toLowerCase();

  if (normalized.includes("vip") || normalized.includes("active")) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (normalized.includes("repeat")) return "bg-sky-100 text-sky-800";
  if (normalized.includes("new")) return "bg-amber-100 text-amber-800";
  if (
    normalized.includes("incomplete") ||
    normalized.includes("missing") ||
    normalized.includes("needs")
  ) {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized.includes("spam") || normalized.includes("test")) {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-100 text-slate-700";
}

function getCustomerAdminProfileHref(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}`;
}

function getCustomerDashboardPreviewHref(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}/dashboard-preview`;
}

function getCustomerPublicProfilePreviewHref(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}/public-profile-preview`;
}

function getMessageHref(customer: CustomerInsight) {
  return `/admin/messages?userId=${encodeURIComponent(customer.id)}`;
}

function getDisplaySourceBadge(source?: string) {
  if (!source) return null;

  const normalized = source.toLowerCase();
  if (normalized.includes("legacy") || normalized.includes("fallback")) {
    return "Fallback / legacy";
  }
  if (normalized.includes("missing")) return "Missing";
  return source;
}

function getNextAction(customer: CustomerInsight) {
  const completion = getCompletionValue(customer);
  const status = getCustomerStatus(customer).toLowerCase();

  if (status.includes("spam") || status.includes("test")) {
    return "Review for archive / cleanup";
  }
  if (completion < 50) return "Complete profile details";
  if (customer.bookingCount === 0) return "Encourage first booking";
  if (customer.paidBookingCount === 0) return "Review unpaid booking activity";
  if (customer.petCount === 0) return "Ask for pet profile setup";
  return "Open Pet Parent review";
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
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white text-sm font-black text-[#0D5C3A] shadow-sm sm:h-16 sm:w-16">
      <div className="absolute inset-0 bg-white" aria-hidden />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="relative z-[1] h-full w-full object-cover object-center"
        />
      ) : (
        <span className="relative z-[1]">
          {fallbackInitials(name, email, "PP")}
        </span>
      )}
    </div>
  );
}

function CustomerActionButtons({ customer }: { customer: CustomerInsight }) {
  return (
    <div className="grid min-w-[170px] gap-2">
      <Link
        href={getCustomerAdminProfileHref(customer.id)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
      >
        <Settings size={16} />
        Review Parent
      </Link>

      <Link
        href={getMessageHref(customer)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
      >
        <MessageCircle size={15} />
        Message
      </Link>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={getCustomerDashboardPreviewHref(customer.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
        >
          <LayoutDashboard size={14} />
          Dashboard
        </Link>
        <Link
          href={getCustomerPublicProfilePreviewHref(customer.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100"
        >
          <Eye size={14} />
          Public
        </Link>
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: CustomerInsight }) {
  const completion = getCompletionValue(customer);
  const status = getCustomerStatus(customer);
  const phone = String(customer.phone || "").trim();

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.95fr_0.95fr_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Avatar
              name={customer.name}
              email={customer.email}
              src={customer.avatarUrl}
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-black text-slate-950 sm:text-lg">
                  {customer.name || "Unnamed Pet Parent"}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${segmentClasses(
                    status,
                  )}`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-sky-800">
                  Pet Parent
                </span>
                {customer.photoSource ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                    Photo · {getDisplaySourceBadge(customer.photoSource)}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                <p className="truncate">
                  {emailFallback(customer.email, "No email provided")}
                  {phone ? ` · ${phone}` : ""}
                </p>
                <p>{getLocation(customer)}</p>
                <p>
                  Source: {customer.source || "Direct"}
                  {customer.campaign ? ` · ${customer.campaign}` : ""}
                </p>
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
              className={`rounded-full px-3 py-1 text-xs font-black ${getCompletionClasses(
                completion,
              )}`}
            >
              {completion}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0D5C3A]"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <p>
              <span className="font-black text-slate-800">Pets:</span>{" "}
              {number(customer.petCount)}
            </p>
            <p>
              <span className="font-black text-slate-800">Messages:</span>{" "}
              {number(customer.messageCount)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Activity
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">
            {getNextAction(customer)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <p>
              <span className="font-black text-slate-800">Spend:</span>{" "}
              {money(customer.totalSpend)}
            </p>
            <p>
              <span className="font-black text-slate-800">Bookings:</span>{" "}
              {number(customer.bookingCount)}
            </p>
            <p className="col-span-2">
              <span className="font-black text-slate-800">Last booking:</span>{" "}
              {formatDate(customer.lastBookingDate)}
            </p>
            <p className="col-span-2">
              <span className="font-black text-slate-800">Avg booking:</span>{" "}
              {money(customer.averageBookingValue)}
            </p>
          </div>
        </div>

        <CustomerActionButtons customer={customer} />
      </div>
    </article>
  );
}

export default function CustomerInsightsTable({
  customers,
  exportHref,
}: CustomerInsightsTableProps) {
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpend");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const segments = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(customers.map((customer) => getCustomerStatus(customer))),
        ).filter(Boolean),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [customers],
  );

  const sources = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(customers.map((customer) => customer.source || "Direct")),
        ),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [customers],
  );

  const locations = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(customers.map((customer) => getLocation(customer))),
        ),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = customers.filter((customer) => {
      const location = getLocation(customer);
      const searchText = [
        customer.name,
        customer.email,
        customer.phone || "",
        getCustomerStatus(customer),
        customer.source,
        customer.campaign,
        location,
        customer.zipCode,
        String(getCompletionValue(customer)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesSegment =
        segmentFilter === "All" ||
        getCustomerStatus(customer) === segmentFilter;
      const matchesSource =
        sourceFilter === "All" ||
        (customer.source || "Direct") === sourceFilter;
      const matchesLocation =
        locationFilter === "All" || location === locationFilter;

      return (
        matchesQuery && matchesSegment && matchesSource && matchesLocation
      );
    });

    filtered.sort((a, b) => {
      let result = 0;

      if (sortKey === "name") result = compareText(a.name, b.name);
      if (sortKey === "segment") {
        result = compareText(getCustomerStatus(a), getCustomerStatus(b));
      }
      if (sortKey === "source") result = compareText(a.source, b.source);
      if (sortKey === "location") {
        result = compareText(getLocation(a), getLocation(b));
      }
      if (sortKey === "profileCompletion") {
        result = getCompletionValue(a) - getCompletionValue(b);
      }
      if (sortKey === "totalSpend") result = a.totalSpend - b.totalSpend;
      if (sortKey === "bookingCount") result = a.bookingCount - b.bookingCount;
      if (sortKey === "averageBookingValue") {
        result = a.averageBookingValue - b.averageBookingValue;
      }
      if (sortKey === "petCount") result = a.petCount - b.petCount;
      if (sortKey === "messageCount") result = a.messageCount - b.messageCount;
      if (sortKey === "lastBookingDate") {
        result =
          getDateValue(a.lastBookingDate) - getDateValue(b.lastBookingDate);
      }

      return sortDirection === "asc" ? result : -result;
    });

    return filtered;
  }, [
    customers,
    query,
    segmentFilter,
    sourceFilter,
    locationFilter,
    sortKey,
    sortDirection,
  ]);

  function clearFilters() {
    setQuery("");
    setSegmentFilter("All");
    setSourceFilter("All");
    setLocationFilter("All");
    setSortKey("totalSpend");
    setSortDirection("desc");
  }

  const hasActiveFilters =
    query ||
    segmentFilter !== "All" ||
    sourceFilter !== "All" ||
    locationFilter !== "All" ||
    sortKey !== "totalSpend" ||
    sortDirection !== "desc";

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Pet Parent Work Queue
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Who needs attention next?
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Avatar-first Pet Parent cards with spend, bookings, profile
            progress, and quick actions — responsive on phone and desktop.
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Sorted by {sortLabels[sortKey]} ·{" "}
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
            {number(filteredCustomers.length)} visible Pet Parents
          </div>

          <Link
            href={exportHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            <ArrowDownWideNarrow size={16} />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-emerald-100 bg-[#fbfefd] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-emerald-900">
          <SlidersHorizontal size={17} />
          Organize Pet Parent Data
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search Pet Parents</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, source, city, ZIP..."
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={segmentFilter}
              onChange={(event) => setSegmentFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              {segments.map((segment) => (
                <option key={segment} value={segment}>
                  Status: {segment}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  Source: {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by location</span>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  Location: {location}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort Pet Parents</span>
            <select
              value={`${sortKey}:${sortDirection}`}
              onChange={(event) => {
                const [nextKey, nextDirection] = event.target.value.split(":") as [
                  SortKey,
                  SortDirection,
                ];
                setSortKey(nextKey);
                setSortDirection(nextDirection);
              }}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              {(Object.keys(sortLabels) as SortKey[]).flatMap((key) => [
                <option key={`${key}:desc`} value={`${key}:desc`}>
                  Sort: {sortLabels[key]} ↓
                </option>,
                <option key={`${key}:asc`} value={`${key}:asc`}>
                  Sort: {sortLabels[key]} ↑
                </option>,
              ])}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={16} />
            Reset
          </button>
        </div>
      </div>

      {filteredCustomers.length ? (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
          <Search className="mx-auto mb-3 text-emerald-700" size={34} />
          <p className="text-base font-black text-slate-950">
            {customers.length === 0
              ? "No real Pet Parent signups yet."
              : "No Pet Parents match these filters."}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {customers.length === 0
              ? "New live Pet Parent signups will appear here after a real profile is created in Supabase."
              : "Try clearing filters or searching another Pet Parent, source, or location."}
          </p>
        </div>
      )}
    </div>
  );
}
