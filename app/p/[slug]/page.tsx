import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe,
  Heart,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Partner = {
  id: string;
  partner_type: string | null;
  business_name: string | null;
  website: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  slug: string | null;
  referral_code: string | null;
  status: "active" | "paused" | "suspended" | "archived" | null;
};

type ReferralCode = {
  code: string;
  slug: string | null;
  display_name: string | null;
  public_type: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  business_type: string | null;
  entity_type: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    source?: string;
    medium?: string;
    campaign?: string;
  }>;
};

const PUBLIC_PARTNER_COLUMNS =
  "id, partner_type, business_name, website, business_type, city, state, slug, referral_code, status";

async function findPartnerByReferralSlug(slug: string) {
  const supabase = await createClient();

  const referralResponse = await supabase
    .from("referral_code_public")
    .select(
      "code, slug, display_name, public_type, city, state, website, business_type, entity_type",
    )
    .eq("slug", slug)
    .maybeSingle();

  const referralData = (referralResponse.data || null) as ReferralCode | null;

  const partnerBySlug = await supabase
    .from("partners")
    .select(PUBLIC_PARTNER_COLUMNS)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (partnerBySlug.data) {
    return {
      partner: partnerBySlug.data as Partner,
      referralCode: referralData,
    };
  }

  if (referralData?.code) {
    const partnerByCode = await supabase
      .from("partners")
      .select(PUBLIC_PARTNER_COLUMNS)
      .eq("referral_code", referralData.code)
      .eq("status", "active")
      .maybeSingle();

    if (partnerByCode.data) {
      return {
        partner: partnerByCode.data as Partner,
        referralCode: referralData,
      };
    }
  }

  return {
    partner: null,
    referralCode: null,
  };
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Partner";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getPartnerIcon(partner: Partner | null) {
  const type = `${partner?.partner_type || ""} ${
    partner?.business_type || ""
  }`.toLowerCase();

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

  return "🐾";
}

function getDisplayName(partner: Partner | null) {
  return partner?.business_name || "SitGuru Partner";
}

function getLocation(partner: Partner | null) {
  return [partner?.city, partner?.state].filter(Boolean).join(", ");
}

function getReferralCode(referralCode: ReferralCode | null, partner: Partner) {
  return referralCode?.code || partner.referral_code || "";
}

function getTrackingSource(searchParams: Awaited<PageProps["searchParams"]>) {
  return (
    searchParams?.utm_source ||
    searchParams?.source ||
    "public_partner_referral_page"
  );
}

function getTrackingMedium(searchParams: Awaited<PageProps["searchParams"]>) {
  return searchParams?.utm_medium || searchParams?.medium || "referral";
}

function getTrackingCampaign(searchParams: Awaited<PageProps["searchParams"]>) {
  return (
    searchParams?.utm_campaign ||
    searchParams?.campaign ||
    "partner_referral_click"
  );
}

async function recordPartnerReferralClick({
  partner,
  referralCode,
  slug,
  searchParams,
}: {
  partner: Partner;
  referralCode: string;
  slug: string;
  searchParams: Awaited<PageProps["searchParams"]>;
}) {
  const supabase = await createClient();

  await supabase.from("partner_tracking_events").insert({
    partner_id: partner.id,
    referral_code: referralCode || partner.referral_code || slug,
    event_type: "click",
    event_source: getTrackingSource(searchParams),
    event_medium: getTrackingMedium(searchParams),
    event_campaign: getTrackingCampaign(searchParams),
    landing_page: `/p/${slug}`,
    current_url: `/p/${slug}`,
    revenue_amount: 0,
    reward_amount: 0,
    currency: "USD",
    metadata: {
      recorded_from: "app/p/[slug]/page.tsx",
      partner_slug: slug,
      partner_business_name: partner.business_name,
      partner_type: partner.partner_type,
    },
  });
}

export default async function PublicPartnerReferralPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = resolvedParams.slug;

  const { partner, referralCode } = await findPartnerByReferralSlug(slug);

  if (!partner || partner.status !== "active") {
    notFound();
  }

  const code = getReferralCode(referralCode, partner);
  const displayName = getDisplayName(partner);
  const location = getLocation(partner);
  const icon = getPartnerIcon(partner);

  await recordPartnerReferralClick({
    partner,
    referralCode: code,
    slug,
    searchParams: resolvedSearchParams,
  });

  const findGuruHref = `/find-a-guru?ref=${encodeURIComponent(code || slug)}`;
  const becomeGuruHref = `/guru/apply?ref=${encodeURIComponent(code || slug)}`;
  const partnerApplyHref = `/partners?ref=${encodeURIComponent(code || slug)}`;

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Back to SitGuru
              </Link>

              <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-100 text-5xl">
                {icon}
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                SitGuru Partner Referral
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Welcome from {displayName}
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
                You are visiting SitGuru through a trusted partner referral.
                Book loving pet care, find trusted Gurus, or learn how SitGuru
                helps pet parents simplify care.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900">
                  {formatLabel(partner.partner_type)}
                </span>

                {partner.business_type ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-900">
                    {partner.business_type}
                  </span>
                ) : null}

                {location ? (
                  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-900">
                    <MapPin className="mr-2 h-4 w-4" />
                    {location}
                  </span>
                ) : null}
              </div>
            </div>

            <aside className="rounded-[2rem] bg-[#003D1F] p-6 !text-white shadow-sm lg:w-[360px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 !text-white">
                <Sparkles className="h-6 w-6 !text-white" />
              </div>

              <h2 className="mt-6 text-3xl font-black leading-tight !text-white">
                Referral tracked
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 !text-white">
                This visit is coordinated with SitGuru partner tracking so
                referral clicks can be reviewed in the admin dashboard.
              </p>

              <div className="mt-6 rounded-2xl bg-white/12 p-4 !text-white">
                <p className="text-sm font-black !text-white">Referral Code</p>
                <p className="mt-2 break-words text-2xl font-black !text-white">
                  {code || slug}
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-white/12 p-4 !text-white">
                <p className="text-sm font-black !text-white">Partner</p>
                <p className="mt-2 text-lg font-black !text-white">
                  {displayName}
                </p>
              </div>
            </aside>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <Link
            href={findGuruHref}
            className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <PawPrint className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#17382B]">
              Find a trusted Guru
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              Search loving sitters and pet care helpers near you with your
              referral code connected.
            </p>

            <div className="mt-5 inline-flex items-center text-sm font-black text-emerald-800">
              Find a Guru
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Link>

          <Link
            href={becomeGuruHref}
            className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-800">
              <Star className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#17382B]">
              Become a Guru
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              Apply to become a SitGuru sitter and support trusted pet care in
              your community.
            </p>

            <div className="mt-5 inline-flex items-center text-sm font-black text-orange-900">
              Apply Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Link>

          <Link
            href={partnerApplyHref}
            className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-800">
              <Building2 className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#17382B]">
              Partner with SitGuru
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              Local businesses, creators, and community partners can join the
              SitGuru Partner Network.
            </p>

            <div className="mt-5 inline-flex items-center text-sm font-black text-blue-900">
              View Partner Programs
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Link>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-xl font-black text-[#17382B]">
              Trusted pet care
            </h3>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              SitGuru is designed to help pet parents find reliable support from
              caring Gurus.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <BadgeCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-xl font-black text-[#17382B]">
              Partner-supported growth
            </h3>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              Partner referrals help SitGuru grow through local communities,
              creators, and pet care businesses.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Heart className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-xl font-black text-[#17382B]">
              Pet-first experience
            </h3>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              Every referral supports SitGuru’s mission of trusted, simplified
              pet care.
            </p>
          </div>
        </section>

        {partner.website ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Partner Website
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#17382B]">
                  Learn more about {displayName}
                </h2>
              </div>

              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
              </a>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}