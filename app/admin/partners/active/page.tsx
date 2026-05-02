import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Partner = {
  id: string;
  application_id: string | null;
  owner_user_id: string | null;
  partner_type: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  social_url: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  slug: string | null;
  referral_code: string | null;
  commission_type: "fixed" | "percent" | "donation" | "manual";
  customer_booking_reward: number;
  guru_referral_reward: number;
  partner_activation_reward: number;
  donation_reward: number;
  status: "active" | "paused" | "suspended" | "archived";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatPartnerType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClasses(status: Partner["status"]) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "suspended":
      return "border-red-200 bg-red-50 text-red-800";
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function commissionClasses(type: Partner["commission_type"]) {
  switch (type) {
    case "donation":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "percent":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "manual":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-green-200 bg-green-50 text-green-800";
  }
}

function partnerCategoryIcon(type: string) {
  if (type.includes("insurance")) return "🛡️";
  if (type.includes("groomer")) return "✂️";
  if (type.includes("trainer")) return "🦮";
  if (type.includes("rescue")) return "💚";
  if (type.includes("vet")) return "🩺";
  if (type.includes("apartment")) return "🏢";
  if (type.includes("tech")) return "📱";
  if (type.includes("food")) return "🥣";
  if (type.includes("wellness")) return "🌿";
  if (type.includes("national")) return "🌐";
  if (type.includes("local")) return "📍";
  return "🤝";
}

function buildReferralUrl(slug: string | null) {
  if (!slug) return "Not generated";
  return `/p/${slug}`;
}

export default async function AdminActivePartnersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });

  const partners = (data ?? []) as Partner[];

  const activeCount = partners.filter((partner) => partner.status === "active").length;
  const pausedCount = partners.filter((partner) => partner.status === "paused").length;
  const donationCount = partners.filter(
    (partner) => partner.commission_type === "donation"
  ).length;
  const affiliateCount = partners.filter(
    (partner) => partner.partner_type === "other"
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
                <Link href="/admin/partners" className="hover:text-green-950">
                  Partners
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Active Partners
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Active Partners
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage approved SitGuru local partners, national partners, and
                affiliate-style partners created through the application approval
                workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/applications"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Review Applications
              </Link>

              <Link
                href="/admin/partners"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Partner Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">Active</p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">Paused</p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {pausedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-bold text-purple-800">
                Donation Partners
              </p>
              <p className="mt-2 text-3xl font-black text-purple-950">
                {donationCount}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">
                Affiliate Partners
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {affiliateCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <h2 className="text-xl font-black">Could not load partners</h2>
            <p className="mt-2 text-sm leading-6">
              Supabase returned an error while loading active partners:
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
              {error.message}
            </pre>
            <p className="mt-4 text-sm font-bold">
              This usually means the Admin RLS policy for the partners table
              still needs to be added or adjusted.
            </p>
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🤝
            </div>
            <h2 className="mt-5 text-3xl font-black text-green-950">
              No approved partners yet
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Once Admin approves Local Partner, National Partner, or Growth
              Affiliate applications, approved records will appear here.
            </p>
            <Link
              href="/admin/partners/applications"
              className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              Review Applications
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {partners.map((partner) => (
              <article
                key={partner.id}
                className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-sm"
              >
                <div className="border-b border-green-100 bg-[#fbfaf6] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                        {partnerCategoryIcon(partner.partner_type)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                            {formatPartnerType(partner.partner_type)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              partner.status
                            )}`}
                          >
                            {partner.status.charAt(0).toUpperCase() +
                              partner.status.slice(1)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${commissionClasses(
                              partner.commission_type
                            )}`}
                          >
                            {partner.commission_type.charAt(0).toUpperCase() +
                              partner.commission_type.slice(1)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-2xl font-black text-green-950">
                          {partner.business_name}
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Approved {formatDate(partner.approved_at)} • Created{" "}
                          {formatDate(partner.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {partner.application_id ? (
                        <Link
                          href={`/admin/partners/applications/${partner.application_id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                        >
                          View Application
                        </Link>
                      ) : null}

                      {partner.email ? (
                        <Link
                          href={`mailto:${partner.email}`}
                          className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
                        >
                          Email
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-3">
                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Contact
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {partner.contact_name || "Not provided"}
                    </p>
                    {partner.email ? (
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {partner.email}
                      </p>
                    ) : null}
                    {partner.phone ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {partner.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Location
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {[partner.city, partner.state].filter(Boolean).join(", ") ||
                        "Not provided"}
                    </p>
                    {partner.zip_code ? (
                      <p className="mt-1 text-sm text-slate-600">
                        ZIP {partner.zip_code}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Referral
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      Code: {partner.referral_code || "Not generated"}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-600">
                      Link: {buildReferralUrl(partner.slug)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-green-100 p-5 lg:grid-cols-4">
                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Customer Booking Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${partner.customer_booking_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Guru Referral Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${partner.guru_referral_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Activation Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${partner.partner_activation_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Donation Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${partner.donation_reward}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-green-100 bg-[#fbfaf6] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-green-800 hover:text-green-950"
                      >
                        Open Website →
                      </a>
                    ) : (
                      <span>No website provided</span>
                    )}

                    {partner.social_url ? (
                      <>
                        <span className="mx-2 text-slate-300">|</span>
                        <a
                          href={partner.social_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-green-800 hover:text-green-950"
                        >
                          Open Social →
                        </a>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/p/${partner.slug || ""}`}
                      className="rounded-xl border border-green-200 bg-white px-4 py-2 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                    >
                      Public Referral Page
                    </Link>

                    <Link
                      href="/admin/partners/campaigns"
                      className="rounded-xl bg-green-800 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-green-900"
                    >
                      Create Campaign
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
