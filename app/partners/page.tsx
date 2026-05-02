import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PartnerApplication = {
  id: string;
  applicant_type: "local_partner" | "national_partner" | "affiliate" | "ambassador";
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
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const quickLinks = [
  {
    title: "Applications",
    description: "Review pending partner, affiliate, and ambassador applications.",
    href: "/admin/partners/applications",
    icon: "📝",
  },
  {
    title: "Active Partners",
    description: "Manage approved local and national partners.",
    href: "/admin/partners/active",
    icon: "🤝",
  },
  {
    title: "Ambassadors",
    description: "Manage ambassadors, tiers, territories, and City Captains.",
    href: "/admin/partners/ambassadors",
    icon: "⭐",
  },
  {
    title: "Affiliates",
    description: "Manage creators, bloggers, Gurus, and promotional affiliates.",
    href: "/admin/partners/affiliates",
    icon: "📈",
  },
  {
    title: "Campaigns",
    description: "Create referral campaigns, QR codes, and offer rules.",
    href: "/admin/partners/campaigns",
    icon: "📣",
  },
  {
    title: "Rewards",
    description: "Approve, reject, reverse, or review referral rewards.",
    href: "/admin/partners/rewards",
    icon: "🎁",
  },
  {
    title: "Payouts",
    description: "Track monthly payout batches and partner payments.",
    href: "/admin/partners/payouts",
    icon: "💵",
  },
  {
    title: "Messages",
    description: "Message partners, affiliates, ambassadors, and applicants.",
    href: "/admin/partners/messages",
    icon: "💬",
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
    .limit(6);

  const recentApplications = (data ?? []) as PartnerApplication[];

  const { count: totalApplications } = await supabase
    .from("partner_applications")
    .select("id", { count: "exact", head: true });

  const { count: pendingApplications } = await supabase
    .from("partner_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: needsReviewApplications } = await supabase
    .from("partner_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "needs_review");

  const { count: approvedApplications } = await supabase
    .from("partner_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const pendingLocal = recentApplications.filter(
    (app) => app.applicant_type === "local_partner" && app.status === "pending"
  ).length;

  const pendingAmbassadors = recentApplications.filter(
    (app) => app.applicant_type === "ambassador" && app.status === "pending"
  ).length;

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-green-800">
                <Link href="/admin" className="hover:text-green-950">
                  Admin
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Partners
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Partners & Affiliates
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage the SitGuru Partner Network: Local Partners, National
                Partners, Growth Affiliates, Ambassadors, campaigns, rewards,
                payouts, and partner messages.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partners"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                View Public Pages
              </Link>

              <Link
                href="/admin/partners/applications"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Review Applications
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">
                Total Applications
              </p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {totalApplications ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">Pending</p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {pendingApplications ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">Needs Review</p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {needsReviewApplications ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-800">Approved</p>
              <p className="mt-2 text-3xl font-black text-emerald-950">
                {approvedApplications ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                  Admin sections
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                  Partner Network tools
                </h2>
              </div>

              <p className="text-sm font-semibold text-slate-500">
                Some sections are placeholders until the next build steps.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="rounded-[1.25rem] border border-green-100 bg-[#fbfaf6] p-5 shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:bg-green-50 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                    {link.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-green-950">
                    {link.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                  Recent activity
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                  Recent applications
                </h2>
              </div>

              <Link
                href="/admin/partners/applications"
                className="text-sm font-black text-green-800 hover:text-green-950"
              >
                View all →
              </Link>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
                Could not load recent applications: {error.message}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                  🐾
                </div>
                <h3 className="mt-4 text-xl font-black text-green-950">
                  No recent applications yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Applications submitted from the Partner Network pages will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-green-100">
                <div className="grid grid-cols-[1.25fr_1fr_1fr_0.9fr_0.7fr] bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-green-900">
                  <span>Applicant</span>
                  <span>Program</span>
                  <span>Location</span>
                  <span>Status</span>
                  <span className="text-right">Review</span>
                </div>

                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="grid grid-cols-[1.25fr_1fr_1fr_0.9fr_0.7fr] items-center border-t border-green-100 bg-white px-4 py-4 text-sm"
                  >
                    <div>
                      <p className="font-black text-green-950">
                        {application.business_name || application.contact_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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

                    <div className="text-slate-600">
                      {[application.city, application.state]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                      <p className="mt-1 text-xs text-slate-400">
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

                    <div className="text-right">
                      <Link
                        href={`/admin/partners/applications/${application.id}`}
                        className="rounded-lg bg-green-800 px-3 py-2 text-xs font-black text-white transition hover:bg-green-900"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black">Network Health</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Pending Local Partner Apps
                </p>
                <p className="mt-2 text-3xl font-black">{pendingLocal}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Pending Ambassador Apps
                </p>
                <p className="mt-2 text-3xl font-black">
                  {pendingAmbassadors}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Next Priority
                </p>
                <p className="mt-2 text-sm leading-6 text-green-100">
                  Approve strong local partners first, then create referral
                  codes and ambassador lead tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Recommended Next Build
            </h2>

            <div className="mt-5 space-y-3">
              {[
                "Create approved partners table",
                "Create ambassadors table",
                "Auto-create referral codes on approval",
                "Add QR code download buttons",
                "Add partner and ambassador dashboards",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 text-sm font-bold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">Quick Actions</h2>

            <div className="mt-5 space-y-3">
              <Link
                href="/admin/partners/applications"
                className="block rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-green-900"
              >
                Review Applications
              </Link>

              <Link
                href="/partners"
                className="block rounded-xl border border-green-200 bg-[#fbfaf6] px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Open Partner Network
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}