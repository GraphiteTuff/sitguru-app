import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type AffiliatePartner = {
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

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  if (!value) return "Not provided";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusClasses(status: AffiliatePartner["status"]) {
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

function affiliateIcon(type: string | null) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("influencer")) return "🎥";
  if (normalized.includes("blogger")) return "✍️";
  if (normalized.includes("guru")) return "🐾";
  if (normalized.includes("customer")) return "💚";
  if (normalized.includes("newsletter")) return "📰";
  if (normalized.includes("facebook")) return "👥";
  if (normalized.includes("event")) return "📣";
  if (normalized.includes("community")) return "📍";

  return "📈";
}

function buildAffiliateReferralUrl(slug: string | null) {
  if (!slug) return "Not generated";
  return `/p/${slug}`;
}

export default async function AdminAffiliatesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("partner_type", "other")
    .order("created_at", { ascending: false });

  const affiliates = (data ?? []) as AffiliatePartner[];

  const activeCount = affiliates.filter(
    (affiliate) => affiliate.status === "active"
  ).length;

  const pausedCount = affiliates.filter(
    (affiliate) => affiliate.status === "paused"
  ).length;

  const suspendedCount = affiliates.filter(
    (affiliate) => affiliate.status === "suspended"
  ).length;

  const totalPotentialCustomerRewards = affiliates.reduce(
    (sum, affiliate) => sum + Number(affiliate.customer_booking_reward || 0),
    0
  );

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
                Affiliates
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Growth Affiliates
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage approved Growth Affiliates such as influencers, bloggers,
                Gurus, customers, newsletters, Facebook group admins, and
                community promoters.
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

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-bold text-red-800">Suspended</p>
              <p className="mt-2 text-3xl font-black text-red-950">
                {suspendedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">
                Base Reward Pool
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                ${totalPotentialCustomerRewards}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <h2 className="text-xl font-black">Could not load affiliates</h2>
            <p className="mt-2 text-sm leading-6">
              Supabase returned an error while loading Growth Affiliates:
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
              {error.message}
            </pre>
            <p className="mt-4 text-sm font-bold">
              This usually means the Admin RLS policy for the partners table
              still needs to be added or adjusted.
            </p>
          </div>
        ) : affiliates.length === 0 ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              📈
            </div>
            <h2 className="mt-5 text-3xl font-black text-green-950">
              No approved affiliates yet
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Once Admin approves Growth Affiliate applications, they will
              appear here with referral links, reward defaults, and campaign
              options.
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
            {affiliates.map((affiliate) => (
              <article
                key={affiliate.id}
                className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-sm"
              >
                <div className="border-b border-green-100 bg-[#fbfaf6] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                        {affiliateIcon(affiliate.business_type)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-800">
                            Growth Affiliate
                          </span>

                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                            {formatLabel(affiliate.business_type)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              affiliate.status
                            )}`}
                          >
                            {formatLabel(affiliate.status)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-2xl font-black text-green-950">
                          {affiliate.business_name}
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Approved {formatDate(affiliate.approved_at)} • Created{" "}
                          {formatDate(affiliate.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {affiliate.application_id ? (
                        <Link
                          href={`/admin/partners/applications/${affiliate.application_id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                        >
                          View Application
                        </Link>
                      ) : null}

                      {affiliate.email ? (
                        <Link
                          href={`mailto:${affiliate.email}`}
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
                      {affiliate.contact_name || "Not provided"}
                    </p>
                    {affiliate.email ? (
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {affiliate.email}
                      </p>
                    ) : null}
                    {affiliate.phone ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {affiliate.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Location
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {[affiliate.city, affiliate.state].filter(Boolean).join(", ") ||
                        "Not provided"}
                    </p>
                    {affiliate.zip_code ? (
                      <p className="mt-1 text-sm text-slate-600">
                        ZIP {affiliate.zip_code}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Referral
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      Code: {affiliate.referral_code || "Not generated"}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-600">
                      Link: {buildAffiliateReferralUrl(affiliate.slug)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-green-100 p-5 lg:grid-cols-4">
                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      First Booking Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${affiliate.customer_booking_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Guru Referral Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${affiliate.guru_referral_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Activation Reward
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      ${affiliate.partner_activation_reward}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Commission Type
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-950">
                      {formatLabel(affiliate.commission_type)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-green-100 bg-[#fbfaf6] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    {affiliate.website ? (
                      <a
                        href={affiliate.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-green-800 hover:text-green-950"
                      >
                        Open Website →
                      </a>
                    ) : (
                      <span>No website provided</span>
                    )}

                    {affiliate.social_url ? (
                      <>
                        <span className="mx-2 text-slate-300">|</span>
                        <a
                          href={affiliate.social_url}
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
                      href="/admin/partners/messages"
                      className="rounded-xl border border-green-200 bg-white px-4 py-2 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                    >
                      Message Affiliate
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
