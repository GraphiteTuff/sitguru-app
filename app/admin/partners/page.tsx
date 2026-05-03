import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  ClipboardList,
  Clock,
  Download,
  Gift,
  Handshake,
  Mail,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SupabaseCoordinationBanner from "./_components/supabase-coordination-banner";

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

const quickLinks = [
  {
    title: "Applications",
    description:
      "Review pending partner, affiliate, and ambassador applications.",
    href: "/admin/partners/applications",
    icon: ClipboardList,
    status: "Ready",
  },
  {
    title: "Active Partners",
    description: "Manage approved local partners and national partners.",
    href: "/admin/partners/active",
    icon: Handshake,
    status: "Ready",
  },
  {
    title: "Ambassadors",
    description:
      "Manage ambassadors, student leaders, City Captains, campuses, and territories.",
    href: "/admin/partners/ambassadors",
    icon: Star,
    status: "Ready",
  },
  {
    title: "Affiliates",
    description:
      "Manage creators, bloggers, Gurus, influencers, and promotional affiliates.",
    href: "/admin/partners/affiliates",
    icon: BarChart3,
    status: "Ready",
  },
  {
    title: "Campaigns",
    description:
      "Create referral campaigns, QR codes, lead sources, and offer rules.",
    href: "/admin/partners/campaigns",
    icon: Megaphone,
    status: "Ready",
  },
  {
    title: "Rewards",
    description:
      "Approve, reject, reverse, or review partner and referral rewards.",
    href: "/admin/partners/rewards",
    icon: Gift,
    status: "Ready",
  },
  {
    title: "Payouts",
    description:
      "Track monthly partner payout batches, payment statuses, and reward balances.",
    href: "/admin/partners/payouts",
    icon: BadgeDollarSign,
    status: "Ready",
  },
  {
    title: "Messages",
    description:
      "Message partners, affiliates, ambassadors, applicants, Gurus, and admins.",
    href: "/admin/messages",
    icon: MessageCircle,
    status: "Ready",
  },
];

export default async function AdminPartnersOverviewPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partner_applications")
    .select(
      "id, applicant_type, business_name, contact_name, email, business_type, city, state, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  const applications = (data ?? []) as PartnerApplication[];
  const recentApplications = applications.slice(0, 8);

  const totalApplications = applications.length;

  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  ).length;

  const needsReviewApplications = applications.filter(
    (app) => app.status === "needs_review"
  ).length;

  const approvedApplications = applications.filter(
    (app) => app.status === "approved"
  ).length;

  const rejectedApplications = applications.filter(
    (app) => app.status === "rejected"
  ).length;

  const localPartners = applications.filter(
    (app) => app.applicant_type === "local_partner"
  ).length;

  const nationalPartners = applications.filter(
    (app) => app.applicant_type === "national_partner"
  ).length;

  const affiliates = applications.filter(
    (app) => app.applicant_type === "affiliate"
  ).length;

  const ambassadors = applications.filter(
    (app) => app.applicant_type === "ambassador"
  ).length;

  const last7Days = applications.filter((app) =>
    isWithinDays(app.created_at, 7)
  ).length;

  const last30Days = applications.filter((app) =>
    isWithinDays(app.created_at, 30)
  ).length;

  const reviewQueue = pendingApplications + needsReviewApplications;
  const approvalRate = percent(approvedApplications, totalApplications);
  const rejectionRate = percent(rejectedApplications, totalApplications);
  const pendingRate = percent(pendingApplications, totalApplications);
  const needsReviewRate = percent(needsReviewApplications, totalApplications);

  const primaryKpis = [
    {
      label: "Total Applications",
      value: totalApplications,
      helper: "All Partner Network submissions.",
      href: "/admin/partners/applications",
      icon: ClipboardList,
      tone: "border-emerald-100 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Review Queue",
      value: reviewQueue,
      helper: "Pending and needs-review applications.",
      href: "/admin/partners/applications?status=pending",
      icon: Clock,
      tone: "border-blue-100 bg-blue-50 text-blue-900",
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      helper: "Approved applications versus total submissions.",
      href: "/admin/partners/applications?status=approved",
      icon: ShieldCheck,
      tone: "border-green-100 bg-green-50 text-green-900",
    },
    {
      label: "Last 30 Days",
      value: last30Days,
      helper: "New Partner Network submissions this month.",
      href: "/admin/partners/applications",
      icon: TrendingUp,
      tone: "border-purple-100 bg-purple-50 text-purple-900",
    },
  ];

  const statusBreakdown = [
    {
      label: "Pending",
      value: pendingApplications,
      rate: pendingRate,
      href: "/admin/partners/applications?status=pending",
      icon: Clock,
      bar: "bg-blue-600",
      card: "border-blue-100 bg-blue-50",
      text: "text-blue-900",
    },
    {
      label: "Needs Review",
      value: needsReviewApplications,
      rate: needsReviewRate,
      href: "/admin/partners/applications?status=needs_review",
      icon: ShieldCheck,
      bar: "bg-amber-500",
      card: "border-amber-100 bg-amber-50",
      text: "text-amber-900",
    },
    {
      label: "Approved",
      value: approvedApplications,
      rate: approvalRate,
      href: "/admin/partners/applications?status=approved",
      icon: Handshake,
      bar: "bg-green-700",
      card: "border-green-100 bg-green-50",
      text: "text-green-900",
    },
    {
      label: "Rejected",
      value: rejectedApplications,
      rate: rejectionRate,
      href: "/admin/partners/applications?status=rejected",
      icon: ArrowDownToLine,
      bar: "bg-red-600",
      card: "border-red-100 bg-red-50",
      text: "text-red-900",
    },
  ];

  const typeBreakdown = [
    {
      label: "Local Partners",
      value: localPartners,
      rate: percent(localPartners, totalApplications),
      href: "/admin/partners/applications?type=local_partner",
      icon: Handshake,
      helper:
        "Vets, groomers, trainers, shelters, stores, and local care businesses.",
    },
    {
      label: "National Partners",
      value: nationalPartners,
      rate: percent(nationalPartners, totalApplications),
      href: "/admin/partners/applications?type=national_partner",
      icon: Sparkles,
      helper:
        "Larger brands and multi-market partnership opportunities for SitGuru.",
    },
    {
      label: "Affiliates",
      value: affiliates,
      rate: percent(affiliates, totalApplications),
      href: "/admin/partners/applications?type=affiliate",
      icon: TrendingUp,
      helper:
        "Creators, bloggers, Gurus, influencers, and referral promoters.",
    },
    {
      label: "Ambassadors",
      value: ambassadors,
      rate: percent(ambassadors, totalApplications),
      href: "/admin/partners/applications?type=ambassador",
      icon: Star,
      helper:
        "Students, recent grads, City Captains, and campus growth leads.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-black text-emerald-700">
                <Link href="/admin" className="hover:text-emerald-950">
                  Admin
                </Link>
                <span className="text-slate-300">/</span>
                <span>Partners</span>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                SitGuru HQ Partner Growth
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Partners & Affiliates
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Track local partners, national partners, affiliates,
                ambassadors, campaigns, rewards, payouts, applications, and
                partner messages from one stronger SitGuru admin command center.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:pt-10">
              <Link
                href="/partners"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                View Public Pages
              </Link>

              <Link
                href="/admin/partners/applications"
                className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
              >
                Review Applications
                <ArrowRight className="ml-2 h-4 w-4 !text-white" />
              </Link>

              <Link
                href="/api/admin/partners/export"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Link>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-900">
            Could not load partner applications: {error.message}
          </section>
        ) : null}

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
                </div>

                <Link
                  href="/api/admin/partners/export"
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All
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
                  Program Drill Downs
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Partner Network Segments
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {typeBreakdown.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                          <Icon className="h-6 w-6" />
                        </div>

                        <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-emerald-800">
                          {item.rate}%
                        </span>
                      </div>

                      <h3 className="text-2xl font-black leading-tight text-[#17382B]">
                        {item.label}
                      </h3>

                      <p className="mt-2 text-4xl font-black leading-none text-[#0B1F17]">
                        {item.value}
                      </p>

                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        {item.helper}
                      </p>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>

                      <div className="mt-5 inline-flex items-center text-sm font-black text-emerald-700">
                        View segment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Admin Sections
                  </p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    Partner Network Tools
                  </h2>
                </div>

                <p className="max-w-md text-sm font-semibold leading-6 text-slate-700">
                  Each card opens a Partner Network admin section with filters,
                  reporting, payouts, messaging, visual KPIs, and exports.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="group rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                          <Icon className="h-6 w-6" />
                        </div>

                        <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-black text-emerald-800">
                          {link.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-black leading-tight text-[#17382B]">
                        {link.title}
                      </h3>

                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        {link.description}
                      </p>

                      <div className="mt-5 inline-flex items-center text-sm font-black text-emerald-700">
                        Open section
                        <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Recent Activity
                  </p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    Recent Applications
                  </h2>
                </div>

                <Link
                  href="/admin/partners/applications"
                  className="text-sm font-black text-emerald-700 hover:text-emerald-900"
                >
                  View all →
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <Users className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-xl font-black text-[#17382B]">
                    No recent applications yet
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Applications submitted from the SitGuru Partner Network
                    pages will appear here.
                  </p>
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

                  {recentApplications.map((application) => (
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
                <Sparkles className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Network Health
              </h2>

              <div className="mt-6 space-y-4 !text-white">
                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Applications Last 7 Days
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {last7Days}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Applications Last 30 Days
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {last30Days}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Review Queue
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {reviewQueue}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Next Priority
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Keep Partner Network approvals moving, then monitor partner
                    campaigns, referral codes, rewards, payouts, and ambassador
                    growth.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-[#17382B]">
                Quick Exports
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Download partner data by status or program type.
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

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-[#17382B]">
                Completed Partner Build
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Partner Network sections are now separated into dashboards for
                applications, active partners, ambassadors, affiliates,
                campaigns, rewards, and payouts.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Applications dashboard",
                  "Active partners dashboard",
                  "Ambassador operations",
                  "Affiliate operations",
                  "Campaign tracking",
                  "Rewards review",
                  "Payout operations",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner>
          this page reads partner_applications directly from Supabase. Partner
          type, application status, review queue, approval rate, recent
          applications, program counts, KPI cards, drill links, and export links
          are calculated from real application rows.
        </SupabaseCoordinationBanner>
      </div>
    </main>
  );
}