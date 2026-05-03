"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

type CustomerInsight = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
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
};

type SortKey =
  | "name"
  | "segment"
  | "source"
  | "location"
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
  usersHref: string;
};

const sortLabels: Record<SortKey, string> = {
  name: "Customer",
  segment: "Segment",
  source: "Source",
  location: "Location",
  totalSpend: "Spend",
  bookingCount: "Bookings",
  averageBookingValue: "Avg. Booking",
  petCount: "Pets",
  messageCount: "Messages",
  lastBookingDate: "Last Booking",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getLocation(customer: CustomerInsight) {
  return (
    [customer.city, customer.state, customer.country].filter(Boolean).join(", ") ||
    customer.zipCode ||
    "Unknown"
  );
}

function segmentClasses(segment: string) {
  if (segment === "VIP") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (segment === "Repeat") {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  if (segment === "New") {
    return "border border-amber-200 bg-amber-100 text-amber-900";
  }

  return "border border-slate-200 bg-slate-100 text-slate-800";
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        alt={name}
        className="h-11 w-11 shrink-0 rounded-full object-cover"
        src={src}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-black text-green-800">
      {getInitials(name) || "SG"}
    </div>
  );
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function getDateValue(value: string | null) {
  if (!value) return 0;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
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
  const Icon =
    direction === "asc"
      ? sortKey === "name" ||
        sortKey === "segment" ||
        sortKey === "source" ||
        sortKey === "location"
        ? ArrowUpAZ
        : ArrowUpWideNarrow
      : sortKey === "name" ||
          sortKey === "segment" ||
          sortKey === "source" ||
          sortKey === "location"
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

function CustomerMobileCard({
  customer,
  usersHref,
}: {
  customer: CustomerInsight;
  usersHref: string;
}) {
  return (
    <Link
      href={`${usersHref}/${customer.id}`}
      className="block rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:border-green-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={customer.name} src={customer.avatarUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">
                {customer.name}
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                {customer.email || "No email found"}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${segmentClasses(
                customer.segment,
              )}`}
            >
              {customer.segment}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#f8fbf6] p-4 text-sm">
            <MobileMetric label="Spend" value={money(customer.totalSpend)} />
            <MobileMetric label="Bookings" value={number(customer.bookingCount)} />
            <MobileMetric label="Source" value={customer.source || "Direct"} />
            <MobileMetric label="Location" value={getLocation(customer)} />
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

export default function CustomerInsightsTable({
  customers,
  exportHref,
  usersHref,
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
        ...Array.from(new Set(customers.map((customer) => customer.segment))).filter(
          Boolean,
        ),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [customers],
  );

  const sources = useMemo(
    () =>
      [
        "All",
        ...Array.from(new Set(customers.map((customer) => customer.source || "Direct"))),
      ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : compareText(a, b))),
    [customers],
  );

  const locations = useMemo(
    () =>
      [
        "All",
        ...Array.from(new Set(customers.map((customer) => getLocation(customer)))),
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
        customer.segment,
        customer.source,
        customer.campaign,
        location,
        customer.zipCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesSegment =
        segmentFilter === "All" || customer.segment === segmentFilter;
      const matchesSource =
        sourceFilter === "All" || (customer.source || "Direct") === sourceFilter;
      const matchesLocation =
        locationFilter === "All" || location === locationFilter;

      return matchesQuery && matchesSegment && matchesSource && matchesLocation;
    });

    filtered.sort((a, b) => {
      let result = 0;

      if (sortKey === "name") result = compareText(a.name, b.name);
      if (sortKey === "segment") result = compareText(a.segment, b.segment);
      if (sortKey === "source") result = compareText(a.source, b.source);
      if (sortKey === "location") result = compareText(getLocation(a), getLocation(b));
      if (sortKey === "totalSpend") result = a.totalSpend - b.totalSpend;
      if (sortKey === "bookingCount") result = a.bookingCount - b.bookingCount;
      if (sortKey === "averageBookingValue") {
        result = a.averageBookingValue - b.averageBookingValue;
      }
      if (sortKey === "petCount") result = a.petCount - b.petCount;
      if (sortKey === "messageCount") result = a.messageCount - b.messageCount;
      if (sortKey === "lastBookingDate") {
        result = getDateValue(a.lastBookingDate) - getDateValue(b.lastBookingDate);
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

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(
      nextSortKey === "name" ||
        nextSortKey === "segment" ||
        nextSortKey === "source" ||
        nextSortKey === "location"
        ? "asc"
        : "desc",
    );
  }

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
          <h2 className="text-xl font-black text-slate-950">
            Top Customers by Spend
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Search, filter, and sort individualized customer KPI data.
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Sorted by {sortLabels[sortKey]} · {sortDirection === "asc" ? "Ascending" : "Descending"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
            {number(filteredCustomers.length)} visible customers
          </div>

          <Link
            href={exportHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
          >
            <ArrowDownWideNarrow size={16} />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-green-900">
          <SlidersHorizontal size={17} />
          Organize Customer Data
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <label className="relative">
            <span className="sr-only">Search customers</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, email, source, city, ZIP..."
              className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
            />
          </label>

          <label>
            <span className="sr-only">Filter by segment</span>
            <select
              value={segmentFilter}
              onChange={(event) => setSegmentFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {segments.map((segment) => (
                <option key={segment} value={segment}>
                  Segment: {segment}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
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
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  Location: {location}
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
        {filteredCustomers.map((customer) => (
          <CustomerMobileCard
            key={customer.id}
            customer={customer}
            usersHref={usersHref}
          />
        ))}

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[26px] border border-[#e3ece5] bg-white p-8 text-center">
            <Search className="mx-auto mb-3 text-slate-400" size={34} />
            <p className="text-base font-black text-slate-950">
              No customers match these filters.
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Try clearing filters or searching another customer, source, or
              location.
            </p>
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-[#edf3ee] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead className="bg-[#f7faf4]">
              <tr>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Customer"
                    sortKey="name"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Segment"
                    sortKey="segment"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Source"
                    sortKey="source"
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
                    label="Spend"
                    sortKey="totalSpend"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Bookings"
                    sortKey="bookingCount"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Avg. Booking"
                    sortKey="averageBookingValue"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Pets"
                    sortKey="petCount"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Messages"
                    sortKey="messageCount"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    label="Last Booking"
                    sortKey="lastBookingDate"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-[#edf3ee] transition hover:bg-[#fbfcf9]"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`${usersHref}/${customer.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={customer.name} src={customer.avatarUrl} />
                      <div className="min-w-0">
                        <p className="max-w-[210px] truncate text-sm font-black text-slate-950">
                          {customer.name}
                        </p>
                        <p className="max-w-[210px] truncate text-xs font-bold text-slate-500">
                          {customer.email || "No email found"}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${segmentClasses(
                        customer.segment,
                      )}`}
                    >
                      {customer.segment}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {customer.source || "Direct"}
                    {customer.campaign ? (
                      <span className="block text-xs text-slate-400">
                        {customer.campaign}
                      </span>
                    ) : null}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {[customer.city, customer.state, customer.country]
                      .filter(Boolean)
                      .join(", ") || "Unknown"}
                    {customer.zipCode ? (
                      <span className="block text-xs text-slate-400">
                        ZIP {customer.zipCode}
                      </span>
                    ) : null}
                  </td>

                  <td className="px-5 py-4 text-sm font-black text-slate-950">
                    {money(customer.totalSpend)}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {number(customer.bookingCount)}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {money(customer.averageBookingValue)}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {number(customer.petCount)}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {number(customer.messageCount)}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-slate-600">
                    {formatDate(customer.lastBookingDate)}
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-14 text-center text-base font-bold text-slate-500"
                  >
                    <Search className="mx-auto mb-3 text-slate-400" size={34} />
                    <p className="text-base font-black text-slate-950">
                      No customers match these filters.
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Try clearing filters or searching another customer,
                      source, or location.
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