import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ReferralCode = {
  id: string;
  owner_user_id: string | null;
  owner_type:
    | "customer"
    | "guru"
    | "partner"
    | "affiliate"
    | "ambassador"
    | "admin";
  partner_id: string | null;
  ambassador_id: string | null;
  code: string;
  slug: string | null;
  campaign_type:
    | "general"
    | "customer_referral"
    | "guru_referral"
    | "partner_referral"
    | "affiliate"
    | "ambassador"
    | "rescue_donation";
  status: "active" | "paused" | "disabled";
  created_at: string;
  partners: {
    id: string;
    business_name: string;
    partner_type: string;
    status: string;
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
    status: string;
  } | null;
};

type ReferralClick = {
  id: string;
  referral_code_id: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
  referral_codes: {
    id: string;
    code: string;
    slug: string | null;
    owner_type: string;
    campaign_type: string;
  } | null;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Provided";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: ReferralCode["status"]) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "disabled":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

function ownerClasses(ownerType: ReferralCode["owner_type"]) {
  switch (ownerType) {
    case "partner":
      return "border-green-200 bg-green-50 text-green-800";
    case "affiliate":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "ambassador":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "guru":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "customer":
      return "border-slate-200 bg-slate-50 text-slate-800";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

function getOwnerName(code: ReferralCode) {
  if (code.partners?.business_name) return code.partners.business_name;
  if (code.ambassadors?.display_name) return code.ambassadors.display_name;
  return formatLabel(code.owner_type);
}

function getReferralUrl(code: ReferralCode) {
  if (!code.slug) return "Not generated";

  if (code.owner_type === "ambassador") {
    return `/r/${code.slug} • /g/${code.slug} • /p/${code.slug}`;
  }

  return `/p/${code.slug}`;
}

function getPrimaryReferralUrl(code: ReferralCode) {
  if (!code.slug) return "#";

  if (code.owner_type === "ambassador") {
    return `/p/${code.slug}`;
  }

  return `/p/${code.slug}`;
}

function truncate(value: string | null | undefined, max = 56) {
  if (!value) return "Not provided";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default async function AdminPartnerCampaignsPage() {
  const supabase = await createClient();

  const { data: codesData, error: codesError } = await supabase
    .from("referral_codes")
    .select(
      `
        *,
        partners (
          id,
          business_name,
          partner_type,
          status
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type,
          status
        )
      `,
    )
    .order("created_at", { ascending: false });

  const { data: clicksData, error: clicksError } = await supabase
    .from("referral_clicks")
    .select(
      `
        *,
        referral_codes (
          id,
          code,
          slug,
          owner_type,
          campaign_type
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(25);

  const referralCodes = (codesData ?? []) as ReferralCode[];
  const recentClicks = (clicksData ?? []) as ReferralClick[];

  const activeCount = referralCodes.filter(
    (code) => code.status === "active",
  ).length;
  const pausedCount = referralCodes.filter(
    (code) => code.status === "paused",
  ).length;
  const disabledCount = referralCodes.filter(
    (code) => code.status === "disabled",
  ).length;
  const totalClicks = recentClicks.length;

  const partnerCodes = referralCodes.filter(
    (code) => code.owner_type === "partner",
  ).length;
  const affiliateCodes = referralCodes.filter(
    (code) => code.owner_type === "affiliate",
  ).length;
  const ambassadorCodes = referralCodes.filter(
    (code) => code.owner_type === "ambassador",
  ).length;

  const uniqueLandingPages = new Set(
    recentClicks.map((click) => click.landing_page).filter(Boolean),
  ).size;

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
                Campaigns
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Campaigns & Click Tracking
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                View referral codes, campaign links, active partner routes, and
                recent click activity across SitGuru Partner Network pages.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/active"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Active Partners
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
              <p className="text-sm font-bold text-green-800">Active Codes</p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">Paused Codes</p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {pausedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-bold text-red-800">Disabled Codes</p>
              <p className="mt-2 text-3xl font-black text-red-950">
                {disabledCount}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">
                Recent Clicks Loaded
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {totalClicks}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-6">
          {codesError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">
                Could not load referral codes
              </h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading referral codes:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {codesError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Referral codes
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Active campaign links
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Created automatically when applications are approved.
                </p>
              </div>

              {referralCodes.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    📣
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No referral codes yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Approve a partner, affiliate, or ambassador application to
                    generate referral codes.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {referralCodes.map((code) => (
                    <article
                      key={code.id}
                      className="overflow-hidden rounded-2xl border border-green-100 bg-[#fbfaf6]"
                    >
                      <div className="flex flex-col gap-4 border-b border-green-100 bg-white p-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${ownerClasses(
                                code.owner_type,
                              )}`}
                            >
                              {formatLabel(code.owner_type)}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                code.status,
                              )}`}
                            >
                              {formatLabel(code.status)}
                            </span>

                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                              {formatLabel(code.campaign_type)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black text-green-950">
                            {getOwnerName(code)}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            Code:{" "}
                            <span className="font-black text-green-900">
                              {code.code}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            href={getPrimaryReferralUrl(code)}
                            className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
                          >
                            Open Link
                          </Link>

                          <Link
                            href="/admin/partners/rewards"
                            className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                          >
                            Rewards
                          </Link>
                        </div>
                      </div>

                      <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Slug
                          </p>
                          <p className="mt-2 break-words text-sm font-bold text-slate-900">
                            {code.slug || "Not generated"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Referral URL
                          </p>
                          <p className="mt-2 break-words text-sm font-bold text-slate-900">
                            {getReferralUrl(code)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Created
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {formatDateTime(code.created_at)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {clicksError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">
                Could not load referral clicks
              </h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading referral clicks:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {clicksError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Recent tracking
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Recent referral clicks
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 25 clicks.
                </p>
              </div>

              {recentClicks.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    🖱️
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No clicks tracked yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Open a referral route like /p/slug, /r/slug, or /g/slug to
                    create test click rows.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-green-100">
                  <div className="grid grid-cols-[1fr_0.8fr_1.2fr_1fr] bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-green-900">
                    <span>Code</span>
                    <span>Landing</span>
                    <span>Source</span>
                    <span>Time</span>
                  </div>

                  {recentClicks.map((click) => (
                    <div
                      key={click.id}
                      className="grid grid-cols-[1fr_0.8fr_1.2fr_1fr] border-t border-green-100 bg-white px-4 py-4 text-sm"
                    >
                      <div>
                        <p className="font-black text-green-950">
                          {click.referral_codes?.code || "Unknown Code"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatLabel(click.referral_codes?.owner_type)}
                        </p>
                      </div>

                      <div className="break-words text-slate-700">
                        {click.landing_page || "Not provided"}
                      </div>

                      <div>
                        <p className="break-words text-slate-700">
                          {truncate(click.referrer, 42)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          UTM:{" "}
                          {[
                            click.utm_source,
                            click.utm_medium,
                            click.utm_campaign,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "None"}
                        </p>
                      </div>

                      <div className="text-slate-600">
                        {formatDateTime(click.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-800 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black text-white">Campaign Mix</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-bold text-white">Partner Codes</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {partnerCodes}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-bold text-white">Affiliate Codes</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {affiliateCodes}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-bold text-white">
                  Ambassador Codes
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {ambassadorCodes}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-bold text-white">
                  Landing Pages Clicked
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {uniqueLandingPages}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Testing Checklist
            </h2>

            <div className="mt-5 space-y-3">
              {[
                "Approve a test partner application",
                "Open the generated /p/slug page",
                "Open /r/slug for customer referral",
                "Open /g/slug for Guru referral",
                "Check referral_clicks in Supabase",
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
            <h2 className="text-2xl font-black text-green-950">Next Build</h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Next we should create conversion and reward tables so clicks can
              eventually turn into qualified bookings, Guru approvals, partner
              activations, and payouts.
            </p>

            <Link
              href="/admin/partners/rewards"
              className="mt-5 block rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-green-900"
            >
              Rewards Placeholder
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}