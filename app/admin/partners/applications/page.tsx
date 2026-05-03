import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Filter,
  Mail,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type PartnerApplication = {
  id: string;
  applicant_type:
    | "local_partner"
    | "national_partner"
    | "affiliate"
    | "ambassador";
  business_name: string | null;
  contact_name: string;
  email: string;
  business_type: string | null;
  city: string | null;
  state: string | null;
  status: "pending" | "approved" | "rejected" | "needs_review";
  created_at: string;
};

type AdminPartnerApplicationsPageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
    q?: string;
  }>;
};

function formatApplicantType(type: PartnerApplication["applicant_type"]) {
  switch (type) {
    case "local_partner":
      return "Local Partner";
    case "national_partner":
      return "National Partner";
    case "affiliate":
      return "Growth Affiliate";
    case "ambassador":
      return "Ambassador";
    default:
      return "Partner";
  }
}

function formatStatus(status: PartnerApplication["status"]) {
  switch (status) {
    case "needs_review":
      return "Needs Review";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusClasses(status: PartnerApplication["status"]) {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "needs_review":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
}

function typeClasses(type: PartnerApplication["applicant_type"]) {
  switch (type) {
    case "local_partner":
      return "border-green-200 bg-green-50 text-green-800";
    case "national_partner":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "affiliate":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "ambassador":
      return "border-orange-200 bg-orange-50 text-orange-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function isWithinDays(value: string, days: number) {
  const created = new Date(value).getTime();
  const now = Date.now();
  const difference = now - created;

  return difference <= days * 24 * 60 * 60 * 1000;
}

function buildFilteredHref(baseHref: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();

  return queryString ? `${baseHref}?${queryString}` : baseHref;
}

function getLocationKey(application: PartnerApplication) {
  const city = application.city?.trim();
  const state = application.state?.trim();

  if (city && state) return `${city}, ${state}`;
  if (state) return state;
  if (city) return city;

  return "Not provided";
}

function getBusinessTypeKey(application: PartnerApplication) {
  return application.business_type?.trim() || "Not provided";
}

function countByValue<T>(
  items: T[],
  getKey: (item: T) => string,
  limit: number
) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const statusFilters = [
  {
    label: "All",
    value: "",
    href: "/admin/partners/applications",
  },
  {
    label: "Pending",
    value: "pending",
    href: "/admin/partners/applications?status=pending",
  },
  {
    label: "Needs Review",
    value: "needs_review",
    href: "/admin/partners/applications?status=needs_review",
  },
  {
    label: "Approved",
    value: "approved",
    href: "/admin/partners/applications?status=approved",
  },
  {
    label: "Rejected",
    value: "rejected",
    href: "/admin/partners/applications?status=rejected",
  },
];

const typeFilters = [
  {
    label: "Local Partners",
    value: "local_partner",
    href: "/admin/partners/applications?type=local_partner",
  },
  {
    label: "National Partners",
    value: "national_partner",
    href: "/admin/partners/applications?type=national_partner",
  },
  {
    label: "Affiliates",
    value: "affiliate",
    href: "/admin/partners/applications?type=affiliate",
  },
  {
    label: "Ambassadors",
    value: "ambassador",
    href: "/admin/partners/applications?type=ambassador",
  },
];

export default async function AdminPartnerApplicationsPage({
  searchParams,
}: AdminPartnerApplicationsPageProps) {
  const params = await searchParams;

  const selectedStatus = params?.status || "";
  const selectedType = params?.type || "";
  const searchQuery = params?.q?.trim() || "";

  const supabase = await createClient();

  let query = supabase
    .from("partner_applications")
    .select(
      "id, applicant_type, business_name, contact_name, email, business_type, city, state, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (selectedStatus) {
    query = query.eq("status", selectedStatus);
  }

  if (selectedType) {
    query = query.eq("applicant_type", selectedType);
  }

  if (searchQuery) {
    query = query.or(
      `business_name.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query;
  const applications = (data ?? []) as PartnerApplication[];

  const totalApplications = applications.length;

  const pendingApplications = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const needsReviewApplications = applications.filter(
    (application) => application.status === "needs_review"
  ).length;

  const approvedApplications = applications.filter(
    (application) => application.status === "approved"
  ).length;

  const rejectedApplications = applications.filter(
    (application) => application.status === "rejected"
  ).length;

  const localPartnerApplications = applications.filter(
    (application) => application.applicant_type === "local_partner"
  ).length;

  const nationalPartnerApplications = applications.filter(
    (application) => application.applicant_type === "national_partner"
  ).length;

  const affiliateApplications = applications.filter(
    (application) => application.applicant_type === "affiliate"
  ).length;

  const ambassadorApplications = applications.filter(
    (application) => application.applicant_type === "ambassador"
  ).length;

  const last7DaysApplications = applications.filter((application) =>
    isWithinDays(application.created_at, 7)
  ).length;

  const last30DaysApplications = applications.filter((application) =>
    isWithinDays(application.created_at, 30)
  ).length;

  const reviewQueue = pendingApplications + needsReviewApplications;
  const approvalRate = percent(approvedApplications, totalApplications);
  const rejectionRate = percent(rejectedApplications, totalApplications);
  const reviewQueueRate = percent(reviewQueue, totalApplications);

  const topLocations = countByValue(applications, getLocationKey, 5);
  const topBusinessTypes = countByValue(applications, getBusinessTypeKey, 5);

  const primaryKpis = [
    {
      label: "Total Applications",
      value: totalApplications,
      helper: "All results matching the current filters.",
      href: "/admin/partners/applications",
      icon: ClipboardList,
      tone: "border-emerald-100 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Review Queue",
      value: reviewQueue,
      helper: "Pending and needs-review applications.",
      href: "/admin/partners/applications?status=pending",
      icon: ShieldAlert,
      tone: "border-blue-100 bg-blue-50 text-blue-900",
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      helper: "Approved applications versus filtered total.",
      href: "/admin/partners/applications?status=approved",
      icon: CheckCircle2,
      tone: "border-green-100 bg-green-50 text-green-900",
    },
    {
      label: "Last 30 Days",
      value: last30DaysApplications,
      helper: "New applications inside the filtered results.",
      href: "/admin/partners/applications",
      icon: TrendingUp,
      tone: "border-purple-100 bg-purple-50 text-purple-900",
    },
  ];

  const statusBreakdown = [
    {
      label: "Pending",
      value: pendingApplications,
      rate: percent(pendingApplications, totalApplications),
      href: "/admin/partners/applications?status=pending",
      icon: Clock,
      bar: "bg-blue-600",
      card: "border-blue-100 bg-blue-50",
      text: "text-blue-900",
    },
    {
      label: "Needs Review",
      value: needsReviewApplications,
      rate: percent(needsReviewApplications, totalApplications),
      href: "/admin/partners/applications?status=needs_review",
      icon: ShieldAlert,
      bar: "bg-amber-500",
      card: "border-amber-100 bg-amber-50",
      text: "text-amber-900",
    },
    {
      label: "Approved",
      value: approvedApplications,
      rate: approvalRate,
      href: "/admin/partners/applications?status=approved",
      icon: CheckCircle2,
      bar: "bg-green-700",
      card: "border-green-100 bg-green-50",
      text: "text-green-900",
    },
    {
      label: "Rejected",
      value: rejectedApplications,
      rate: rejectionRate,
      href: "/admin/partners/applications?status=rejected",
      icon: XCircle,
      bar: "bg-red-600",
      card: "border-red-100 bg-red-50",
      text: "text-red-900",
    },
  ];

  const typeBreakdown = [
    {
      label: "Local Partners",
      value: localPartnerApplications,
      rate: percent(localPartnerApplications, totalApplications),
      href: "/admin/partners/applications?type=local_partner",
      icon: Building2,
      helper:
        "Local businesses such as vets, groomers, trainers, shelters, and pet care services.",
      card: "border-green-100 bg-green-50",
      text: "text-green-900",
      bar: "bg-green-700",
    },
    {
      label: "National Partners",
      value: nationalPartnerApplications,
      rate: percent(nationalPartnerApplications, totalApplications),
      href: "/admin/partners/applications?type=national_partner",
      icon: Sparkles,
      helper: "Larger brand or multi-market partner opportunities.",
      card: "border-blue-100 bg-blue-50",
      text: "text-blue-900",
      bar: "bg-blue-700",
    },
    {
      label: "Affiliates",
      value: affiliateApplications,
      rate: percent(affiliateApplications, totalApplications),
      href: "/admin/partners/applications?type=affiliate",
      icon: TrendingUp,
      helper: "Creators, bloggers, Gurus, influencers, and growth promoters.",
      card: "border-purple-100 bg-purple-50",
      text: "text-purple-900",
      bar: "bg-purple-700",
    },
    {
      label: "Ambassadors",
      value: ambassadorApplications,
      rate: percent(ambassadorApplications, totalApplications),
      href: "/admin/partners/applications?type=ambassador",
      icon: Star,
      helper: "Students, recent grads, City Captains, and campus growth leads.",
      card: "border-orange-100 bg-orange-50",
      text: "text-orange-900",
      bar: "bg-orange-600",
    },
  ];

  const exportHref = buildFilteredHref("/api/admin/partners/export", {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedType ? { type: selectedType } : {}),
  });

  const allApplicationsHref = "/admin/partners/applications";

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/active"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Active Partners
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href={exportHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <ClipboardList className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Partner Network Review Queue
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Partner Applications
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Review, filter, open, and export SitGuru partner, affiliate,
                ambassador, national partner, and local partner applications
                with KPI cards, pipeline visuals, program breakdowns, and
                location insights.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryKpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${kpi.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">{kpi.label}</p>
                    <p className="mt-3 text-4xl font-black leading-none">
                      {kpi.value}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                  {kpi.helper}
                </p>

                <div className="mt-4 inline-flex items-center text-sm font-black">
                  Drill into data
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Performance KPIs
                  </p>

                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    Application Pipeline
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Visual status breakdown using the currently loaded
                    Supabase application rows.
                  </p>
                </div>

                <Link
                  href={exportHref}
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Current View
                </Link>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {statusBreakdown.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-black ${item.text}`}>
                            {item.label}
                          </p>

                          <p className="mt-2 text-3xl font-black text-[#17382B]">
                            {item.value}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                          <Icon className={`h-5 w-5 ${item.text}`} />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
                          <span>{item.rate}% of total</span>
                          <span>Open →</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full ${item.bar}`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Program Visuals
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Partner Program Split
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Breakdown by Local Partners, National Partners, Affiliates,
                  and Ambassadors.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {typeBreakdown.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.card}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                          <Icon className={`h-6 w-6 ${item.text}`} />
                        </div>

                        <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-black text-[#17382B]">
                          {item.rate}%
                        </span>
                      </div>

                      <h3 className={`mt-4 text-2xl font-black ${item.text}`}>
                        {item.label}
                      </h3>

                      <p className="mt-2 text-4xl font-black leading-none text-[#17382B]">
                        {item.value}
                      </p>

                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        {item.helper}
                      </p>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${item.bar}`}
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>

                      <div className={`mt-5 inline-flex items-center text-sm font-black ${item.text}`}>
                        View segment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <Filter className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-[#17382B]">
                      Drill Filters
                    </h2>

                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                      Move quickly through application status, partner type, and
                      exportable review queues.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Status
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => {
                      const isActive =
                        selectedStatus === filter.value ||
                        (!selectedStatus && filter.value === "");

                      return (
                        <Link
                          key={filter.href}
                          href={filter.href}
                          className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                            isActive
                              ? "border-emerald-700 bg-emerald-700 !text-white"
                              : "border-emerald-100 bg-[#FBFCF8] text-emerald-900 hover:bg-emerald-50"
                          }`}
                        >
                          {filter.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Partner Type
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {typeFilters.map((filter) => {
                      const isActive = selectedType === filter.value;

                      return (
                        <Link
                          key={filter.href}
                          href={filter.href}
                          className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                            isActive
                              ? "border-emerald-700 bg-emerald-700 !text-white"
                              : "border-emerald-100 bg-white text-emerald-900 hover:bg-emerald-50"
                          }`}
                        >
                          {filter.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <form
                  action="/admin/partners/applications"
                  className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
                >
                  {selectedStatus ? (
                    <input type="hidden" name="status" value={selectedStatus} />
                  ) : null}

                  {selectedType ? (
                    <input type="hidden" name="type" value={selectedType} />
                  ) : null}

                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-[#FBFCF8] px-4 py-3">
                    <Search className="h-4 w-4 text-emerald-800" />
                    <input
                      name="q"
                      defaultValue={searchQuery}
                      placeholder="Search name, business, email, city, or state..."
                      className="w-full bg-transparent text-sm font-semibold text-[#17382B] outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                  >
                    Search
                  </button>

                  <Link
                    href={allApplicationsHref}
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                  >
                    Clear
                  </Link>
                </form>
              </div>
            </section>

            {error ? (
              <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-900">
                Could not load partner applications: {error.message}
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Application Data
                  </p>

                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    {applications.length} Applications
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Results reflect the current status, type, and search
                    filters.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedStatus ? (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900">
                      Status: {selectedStatus.replace("_", " ")}
                    </span>
                  ) : null}

                  {selectedType ? (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900">
                      Type: {selectedType.replace("_", " ")}
                    </span>
                  ) : null}

                  {searchQuery ? (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900">
                      Search: {searchQuery}
                    </span>
                  ) : null}
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <h3 className="text-xl font-black text-[#17382B]">
                    No applications found
                  </h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-700">
                    Change the filter, clear the search, or return to the main
                    Partners dashboard.
                  </p>

                  <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <BackToPartnersButton />

                    <Link
                      href="/admin/partners/applications"
                      className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      Clear Filters
                    </Link>

                    <Link
                      href="/admin/partners/active"
                      className="inline-flex w-fit items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                    >
                      Next: Active Partners
                      <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-emerald-100">
                  <div className="hidden grid-cols-[1.3fr_1fr_1fr_0.9fr_0.7fr] bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-900 lg:grid">
                    <span>Applicant</span>
                    <span>Program</span>
                    <span>Location</span>
                    <span>Status</span>
                    <span className="text-right">Review</span>
                  </div>

                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="grid gap-4 border-t border-emerald-100 bg-white px-4 py-5 text-sm first:border-t-0 lg:grid-cols-[1.3fr_1fr_1fr_0.9fr_0.7fr] lg:items-center"
                    >
                      <div>
                        <p className="text-base font-black text-[#17382B]">
                          {application.business_name ||
                            application.contact_name}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                          <Mail className="h-3.5 w-3.5" />
                          {application.email}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${typeClasses(
                            application.applicant_type
                          )}`}
                        >
                          {formatApplicantType(application.applicant_type)}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-700">
                        {[application.city, application.state]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {formatDate(application.created_at)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                            application.status
                          )}`}
                        >
                          {formatStatus(application.status)}
                        </span>
                      </div>

                      <div className="lg:text-right">
                        <Link
                          href={`/admin/partners/applications/${application.id}`}
                          className="inline-flex rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]"
                        >
                          Open
                          <ArrowRight className="ml-2 h-3.5 w-3.5 !text-white" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2rem] bg-[#003D1F] p-6 !text-white shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 !text-white">
                <BarChart3 className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Application Health
              </h2>

              <div className="mt-6 space-y-4 !text-white">
                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Applications Last 7 Days
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {last7DaysApplications}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Applications Last 30 Days
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {last30DaysApplications}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Review Queue Rate
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {reviewQueueRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Approval Rate
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {approvalRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Next Priority
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Keep the pending and needs-review queue low, approve strong
                    local partners first, and convert high-quality affiliate and
                    ambassador applicants into tracked growth channels.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Location Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Locations
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topLocations.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No location data yet.
                  </div>
                ) : (
                  topLocations.map((location) => (
                    <div
                      key={location.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {location.label}
                        </p>

                        <p className="text-xl font-black text-emerald-900">
                          {location.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{
                            width: `${percent(
                              location.value,
                              totalApplications
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Business Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Business Types
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topBusinessTypes.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No business type data yet.
                  </div>
                ) : (
                  topBusinessTypes.map((businessType) => (
                    <div
                      key={businessType.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {businessType.label}
                        </p>

                        <p className="text-xl font-black text-blue-900">
                          {businessType.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-700"
                          style={{
                            width: `${percent(
                              businessType.value,
                              totalApplications
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-[#17382B]">
                Quick Exports
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Download filtered application data by status or program type.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/api/admin/partners/export"
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-[#FBFCF8] px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
                >
                  Export All Applications
                  <Download className="h-4 w-4" />
                </Link>

                <Link
                  href="/api/admin/partners/export?status=pending"
                  className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-100"
                >
                  Export Pending
                  <Download className="h-4 w-4" />
                </Link>

                <Link
                  href="/api/admin/partners/export?status=approved"
                  className="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-100"
                >
                  Export Approved
                  <Download className="h-4 w-4" />
                </Link>

                <Link
                  href="/api/admin/partners/export?type=ambassador"
                  className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-black text-orange-900 transition hover:bg-orange-100"
                >
                  Export Ambassadors
                  <Download className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/applications/page.tsx"
          folderPath="app/admin/partners/applications"
          primaryTable="partner_applications"
          operation="Read, filter, search, drill, export, and visualize Partner Network application rows"
          selectQuery='supabase.from("partner_applications").select("id, applicant_type, business_name, contact_name, email, business_type, city, state, status, created_at").order("created_at", { ascending: false }).limit(500)'
          readFields={[
            "id",
            "applicant_type",
            "business_name",
            "contact_name",
            "email",
            "business_type",
            "city",
            "state",
            "status",
            "created_at",
          ]}
          filters={[
            "status",
            "applicant_type",
            "URL searchParams.status",
            "URL searchParams.type",
          ]}
          searchFields={[
            "business_name",
            "contact_name",
            "email",
            "city",
            "state",
          ]}
          writeActions={[
            "No direct write action on this list page",
            "Individual application review page handles approval workflow",
          ]}
          exportRoutes={[
            "/api/admin/partners/export",
            "/api/admin/partners/export?status=pending",
            "/api/admin/partners/export?status=approved",
            "/api/admin/partners/export?type=affiliate",
            "/api/admin/partners/export?type=ambassador",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/applications/[id]",
            "/admin/partners/active",
            "/admin/partners/ambassadors",
            "/admin/partners/affiliates",
          ]}
          relatedTables={[
            "partners",
            "ambassadors",
            "affiliates",
            "partner_campaigns",
            "partner_rewards",
            "partner_payouts",
          ]}
          notes={[
            "KPI cards are calculated from the currently loaded partner_applications rows.",
            "Pipeline visuals use status counts from pending, needs_review, approved, and rejected applications.",
            "Program split visuals use applicant_type counts for local partners, national partners, affiliates, and ambassadors.",
            "Top locations and business types are calculated from city, state, and business_type fields.",
            "Export route receives status and type as query parameters when selected.",
          ]}
        />
      </div>
    </main>
  );
}