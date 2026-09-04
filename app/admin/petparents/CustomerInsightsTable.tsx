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
  roles?: string[];
  contactMethod?: string;
  missingRequirements?: string[];
  flaggedForReview?: boolean;
  possibleDuplicate?: boolean;
  nextAction?: string;
  lastActivity?: string;
  lastLogin?: string;
  recordSourceLabel?: string;
};

type CustomerInsightsTableProps = {
  customers: CustomerInsight[];
  exportHref: string;
  usersHref?: string;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getCompletion(customer: CustomerInsight) {
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

function getCompletionStyles(value: number) {
  if (value >= 80) return "bg-emerald-100 text-emerald-800";
  if (value >= 50) return "bg-amber-100 text-amber-800";
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

function getRoles(customer: CustomerInsight) {
  return customer.roles?.length ? customer.roles : ["Pet Parent"];
}

function hasUsableEmail(value: string) {
  return Boolean(value) && value !== "—" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasUsablePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && !/^0+$/.test(digits) && !value.includes("XXX");
}

function getContactMethod(customer: CustomerInsight) {
  if (customer.contactMethod) return customer.contactMethod;

  const emailReady = hasUsableEmail(customer.email);
  const phoneReady = hasUsablePhone(String(customer.phone || ""));

  if (emailReady && phoneReady) return "Email + phone";
  if (phoneReady) return "Phone only";
  if (emailReady) return "Email only";
  return "No usable contact";
}

function getMissingRequirements(customer: CustomerInsight) {
  if (customer.missingRequirements) return customer.missingRequirements;

  const missing: string[] = [];
  const hasRealName =
    Boolean(customer.name) &&
    customer.name !== "Customer" &&
    customer.name !== "Signup Review Needed" &&
    customer.name !== "Unnamed Pet Parent";

  if (!hasRealName) missing.push("Full name");
  if (!hasUsableEmail(customer.email)) missing.push("Email");
  if (!customer.city && !customer.state && !customer.zipCode) {
    missing.push("Location");
  }
  if (customer.petCount <= 0) missing.push("Pet profile");
  if (customer.bookingCount <= 0) missing.push("First booking");

  return missing;
}

function getMissingSummary(customer: CustomerInsight) {
  const missing = getMissingRequirements(customer);
  if (!missing.length) return "No profile blockers detected";

  const shown = missing.slice(0, 3);
  const remaining = missing.length - shown.length;
  return `${shown.join(", ")}${remaining > 0 ? ` +${remaining} more` : ""}`;
}

function getFlaggedForReview(customer: CustomerInsight) {
  if (typeof customer.flaggedForReview === "boolean") {
    return customer.flaggedForReview;
  }

  const status = `${customer.signupQualityLabel || ""} ${customer.segment || ""}`.toLowerCase();
  return (
    status.includes("spam") ||
    status.includes("test") ||
    status.includes("needs review") ||
    status.includes("needs profile")
  );
}

function getPossibleDuplicate(customer: CustomerInsight) {
  if (typeof customer.possibleDuplicate === "boolean") {
    return customer.possibleDuplicate;
  }

  const status = `${customer.signupQualityLabel || ""} ${customer.segment || ""} ${customer.nextAction || ""}`.toLowerCase();
  return status.includes("duplicate");
}

function getCustomerStatusLabel(customer: CustomerInsight) {
  if (getPossibleDuplicate(customer)) return "Possible Duplicate";

  const label = customer.signupQualityLabel || customer.segment || "Registered";
  const normalized = label.toLowerCase();

  if (normalized.includes("spam") || normalized.includes("test")) {
    return label;
  }
  if (
    normalized.includes("needs") ||
    normalized.includes("incomplete") ||
    normalized.includes("missing")
  ) {
    return label.includes("Needs") || label.includes("Incomplete") || label.includes("Missing")
      ? label
      : "Needs Review";
  }
  if (normalized.includes("active") || normalized === "vip" || normalized === "repeat") {
    return label === "VIP" || label === "Repeat" ? label : "Active";
  }
  if (normalized === "new") return "New";
  if (normalized === "lead") return "Lead";

  return label;
}

function getStatusStyles(customer: CustomerInsight) {
  if (getPossibleDuplicate(customer)) return "bg-rose-100 text-rose-800";

  const label = getCustomerStatusLabel(customer).toLowerCase();

  if (label.includes("spam") || label.includes("test")) {
    return "bg-rose-100 text-rose-800";
  }
  if (
    label.includes("needs") ||
    label.includes("incomplete") ||
    label.includes("missing")
  ) {
    return "bg-amber-100 text-amber-800";
  }
  if (
    label.includes("active") ||
    label === "vip" ||
    label === "repeat" ||
    label === "new"
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-100 text-slate-700";
}

function getRoleStyles(role: string) {
  if (role === "Guru") return "bg-emerald-100 text-emerald-800";
  if (role === "Pet Parent") return "bg-sky-100 text-sky-800";
  if (role === "Ambassador") return "bg-violet-100 text-violet-800";
  return "bg-slate-100 text-slate-700";
}

function getNextAction(customer: CustomerInsight) {
  if (customer.nextAction) return customer.nextAction;

  if (getPossibleDuplicate(customer)) {
    return "Review possible duplicate accounts";
  }

  const completion = getCompletion(customer);
  const status = getCustomerStatusLabel(customer).toLowerCase();

  if (status.includes("spam") || status.includes("test")) {
    return "Review for archive / cleanup";
  }
  if (completion < 50) return "Complete profile details";
  if (customer.bookingCount === 0) return "Encourage first booking";
  if (customer.paidBookingCount === 0) return "Review unpaid booking activity";
  if (customer.petCount === 0) return "Ask for pet profile setup";
  return "Open Pet Parent review";
}

function getLastActivity(customer: CustomerInsight) {
  if (customer.lastActivity) return customer.lastActivity;
  return formatDate(customer.lastBookingDate || customer.firstSeenDate);
}

function getRecordSourceLabel(customer: CustomerInsight) {
  return customer.recordSourceLabel || customer.source || "Direct";
}

function searchMatches(customer: CustomerInsight, query: string) {
  if (!query) return true;

  return [
    customer.id,
    customer.name,
    customer.email,
    customer.phone || "",
    getLocation(customer),
    getCustomerStatusLabel(customer),
    getNextAction(customer),
    getContactMethod(customer),
    getRecordSourceLabel(customer),
    ...getRoles(customer),
    ...getMissingRequirements(customer),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function getPriority(customer: CustomerInsight) {
  if (getFlaggedForReview(customer)) return 0;
  if (getPossibleDuplicate(customer)) return 1;
  const status = getCustomerStatusLabel(customer).toLowerCase();
  if (
    status.includes("needs") ||
    status.includes("incomplete") ||
    status.includes("missing")
  ) {
    return 2;
  }
  if (getCompletion(customer) < 50) return 3;
  if (customer.bookingCount === 0) return 4;
  return 5;
}

type CustomerSortKey =
  | "priority"
  | "name-asc"
  | "name-desc"
  | "completion-desc"
  | "completion-asc"
  | "activity-desc"
  | "activity-asc"
  | "spend-desc"
  | "spend-asc"
  | "bookings-desc"
  | "bookings-asc";

function getActivityTime(customer: CustomerInsight) {
  const iso = customer.lastBookingDate || customer.firstSeenDate;
  if (iso) {
    const parsed = new Date(iso).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }

  const display = customer.lastActivity || "";
  if (!display || display === "—") return 0;
  const parsed = new Date(display).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareNames(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function sortCustomersByPriority(customers: CustomerInsight[]) {
  return [...customers].sort((a, b) => {
    const priorityDifference = getPriority(a) - getPriority(b);
    if (priorityDifference) return priorityDifference;

    const completionDifference = getCompletion(b) - getCompletion(a);
    if (completionDifference) return completionDifference;

    return compareNames(a.name, b.name);
  });
}

function sortCustomers(customers: CustomerInsight[], sortKey: CustomerSortKey) {
  if (sortKey === "priority") return sortCustomersByPriority(customers);

  return [...customers].sort((a, b) => {
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
      case "spend-desc": {
        const diff = (b.totalSpend || 0) - (a.totalSpend || 0);
        return diff || compareNames(a.name, b.name);
      }
      case "spend-asc": {
        const diff = (a.totalSpend || 0) - (b.totalSpend || 0);
        return diff || compareNames(a.name, b.name);
      }
      case "bookings-desc": {
        const diff = (b.bookingCount || 0) - (a.bookingCount || 0);
        return diff || compareNames(a.name, b.name);
      }
      case "bookings-asc": {
        const diff = (a.bookingCount || 0) - (b.bookingCount || 0);
        return diff || compareNames(a.name, b.name);
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
  const photoUrl = String(src || "").trim();
  const lower = photoUrl.toLowerCase();
  const hasPhoto =
    Boolean(photoUrl) &&
    !lower.includes("sitguru-logo") &&
    !lower.includes("sitguru-admin-avatar") &&
    !lower.includes("sitguru-message-avatar") &&
    !lower.includes("avatar-placeholder") &&
    !lower.includes("/images/demo/");

  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={photoUrl}
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover object-center"
      />
    );
  }

  return <>{fallbackInitials(name, email, "PP")}</>;
}

export default function CustomerInsightsTable({
  customers,
  exportHref,
}: CustomerInsightsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CustomerSortKey>("priority");

  const visibleCustomers = useMemo(() => {
    return sortCustomers(
      customers.filter((customer) => searchMatches(customer, query.trim())),
      sortKey,
    );
  }, [customers, query, sortKey]);

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
            Same Guru-style review cards for Pet Parents. Role badges show Guru or
            Ambassador when they also use those paths. Sort and search keep the
            next action obvious.
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
              setSortKey(event.target.value as CustomerSortKey)
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
            <option value="spend-desc">Spend High–Low</option>
            <option value="spend-asc">Spend Low–High</option>
            <option value="bookings-desc">Bookings High–Low</option>
            <option value="bookings-asc">Bookings Low–High</option>
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
        Showing {number(visibleCustomers.length)} of {number(customers.length)} people in this queue.
      </div>

      {visibleCustomers.length ? (
        <div className="mt-5 space-y-3">
          {visibleCustomers.map((customer) => {
            const completion = getCompletion(customer);
            const roles = getRoles(customer);
            const contactMethod = getContactMethod(customer);
            const phone = String(customer.phone || "").trim();
            const canMessage = Boolean(customer.id);
            const adminHref = `/admin/petparents/${encodeURIComponent(customer.id)}`;
            const messageHref = `/admin/messages?userId=${encodeURIComponent(customer.id)}`;
            const publicHref = `/admin/petparents/${encodeURIComponent(customer.id)}/public-profile-preview`;

            return (
              <article
                key={customer.id}
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr_1.05fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-700 text-sm font-black text-white">
                        <Avatar
                          name={customer.name}
                          email={customer.email}
                          src={customer.avatarUrl}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-black text-slate-950">
                            {customer.name || "Unnamed Pet Parent"}
                          </h3>
                          {getFlaggedForReview(customer) ? (
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
                          <p>{contactMethod}</p>
                          <p className="truncate">
                            {emailFallback(customer.email, "No email provided")}
                            {phone && phone !== "No phone on file"
                              ? ` • ${phone}`
                              : ""}
                          </p>
                          <p>{getLocation(customer)}</p>
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
                      {getMissingSummary(customer)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusStyles(customer)}`}
                    >
                      {getCustomerStatusLabel(customer)}
                    </span>
                    <p className="mt-3 text-sm font-black text-slate-950">
                      {getNextAction(customer)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last activity: {getLastActivity(customer)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Last login: {customer.lastLogin || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Source: {getRecordSourceLabel(customer)}
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <Link
                      href={adminHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                    >
                      <UserRoundCheck size={16} />
                      Review Pet Parent
                    </Link>

                    {roles.includes("Guru") ? (
                      <Link
                        href={`/admin/gurus?q=${encodeURIComponent(
                          customer.email || customer.name || customer.id,
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                      >
                        <UserRoundCheck size={15} /> Review Guru
                      </Link>
                    ) : null}

                    {roles.includes("Ambassador") ? (
                      <Link
                        href={`/admin/ambassadors?q=${encodeURIComponent(
                          customer.email || customer.name || customer.id,
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-800 transition hover:bg-violet-100"
                      >
                        <UserRoundCheck size={15} /> Review Ambassador
                      </Link>
                    ) : null}

                    {canMessage ? (
                      <Link
                        href={messageHref}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                      >
                        {contactMethod === "Email only" ? (
                          <Mail size={15} />
                        ) : (
                          <MessageCircle size={15} />
                        )}
                        Message
                      </Link>
                    ) : null}

                    <Link
                      href={publicHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye size={15} /> Public Profile
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm font-bold leading-6 text-emerald-900">
          {customers.length === 0
            ? "No real Pet Parent signups yet. New live Pet Parent signups will appear here after a real profile is created in Supabase."
            : "No Pet Parent accounts match this queue or search. Clear the search to see everyone again."}
        </div>
      )}
    </div>
  );
}
