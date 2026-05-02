import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

type PartnerReferralCode = {
  id: string;
  owner_user_id: string | null;
  owner_type: "customer" | "guru" | "partner" | "affiliate" | "ambassador" | "admin";
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
    status: "active" | "paused" | "suspended" | "archived";
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    email: string;
    city: string | null;
    state: string | null;
    territory: string | null;
    ambassador_type: string;
    tier: "bronze" | "silver" | "gold" | "city_captain";
    referral_code: string | null;
    status: "active" | "paused" | "suspended" | "archived";
  } | null;
};

type PageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Partner";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getReferralDisplayName(referral: PartnerReferralCode) {
  if (referral.partners?.business_name) return referral.partners.business_name;
  if (referral.ambassadors?.display_name) return referral.ambassadors.display_name;
  return "SitGuru Partner";
}

function getReferralCategory(referral: PartnerReferralCode) {
  if (referral.partners) {
    if (referral.owner_type === "affiliate") return "Growth Affiliate";
    return formatLabel(referral.partners.partner_type);
  }

  if (referral.ambassadors) {
    return formatLabel(referral.ambassadors.ambassador_type);
  }

  return formatLabel(referral.campaign_type);
}

function getLocation(referral: PartnerReferralCode) {
  if (referral.partners) {
    return [referral.partners.city, referral.partners.state].filter(Boolean).join(", ");
  }

  if (referral.ambassadors) {
    return (
      referral.ambassadors.territory ||
      [referral.ambassadors.city, referral.ambassadors.state].filter(Boolean).join(", ")
    );
  }

  return "";
}

function getPartnerIcon(referral: PartnerReferralCode) {
  const type = (
    referral.partners?.partner_type ||
    referral.ambassadors?.ambassador_type ||
    referral.owner_type ||
    ""
  ).toLowerCase();

  if (type.includes("insurance")) return "🛡️";
  if (type.includes("groomer")) return "✂️";
  if (type.includes("trainer")) return "🦮";
  if (type.includes("rescue")) return "💚";
  if (type.includes("vet")) return "🩺";
  if (type.includes("apartment")) return "🏢";
  if (type.includes("ambassador")) return "⭐";
  if (type.includes("affiliate")) return "📈";
  if (type.includes("tech")) return "📱";
  if (type.includes("food")) return "🥣";
  if (type.includes("wellness")) return "🌿";
  if (type.includes("national")) return "🌐";
  return "🐾";
}

function getPrimaryCta(referral: PartnerReferralCode) {
  if (referral.owner_type === "ambassador") {
    return {
      label: "Find a Guru",
      href: `/find-a-guru?ref=${encodeURIComponent(referral.code)}`,
    };
  }

  if (referral.owner_type === "affiliate") {
    return {
      label: "Book Trusted Pet Care",
      href: `/find-a-guru?ref=${encodeURIComponent(referral.code)}`,
    };
  }

  return {
    label: "Get $25 Off First Booking",
    href: `/find-a-guru?ref=${encodeURIComponent(referral.code)}`,
  };
}

function getSecondaryCta(referral: PartnerReferralCode) {
  return {
    label: "Become a Guru",
    href: `/guru/apply?ref=${encodeURIComponent(referral.code)}`,
  };
}

export default async function PublicPartnerReferralPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("referral_codes")
    .select(
      `
        *,
        partners (
          id,
          partner_type,
          business_name,
          contact_name,
          email,
          phone,
          website,
          social_url,
          business_type,
          city,
          state,
          zip_code,
          slug,
          referral_code,
          commission_type,
          status
        ),
        ambassadors (
          id,
          display_name,
          email,
          city,
          state,
          territory,
          ambassador_type,
          tier,
          referral_code,
          status
        )
      `
    )
    .eq("slug", params.slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const referral = data as PartnerReferralCode;

  if (referral.partners && referral.partners.status !== "active") {
    notFound();
  }

  if (referral.ambassadors && referral.ambassadors.status !== "active") {
    notFound();
  }

  await trackReferralClick({
    referralCodeId: referral.id,
    landingPage: `/p/${params.slug}`,
    utmSource: searchParams?.utm_source,
    utmMedium: searchParams?.utm_medium,
    utmCampaign: searchParams?.utm_campaign,
  });

  const displayName = getReferralDisplayName(referral);
  const category = getReferralCategory(referral);
  const location = getLocation(referral);
  const icon = getPartnerIcon(referral);
  const primaryCta = getPrimaryCta(referral);
  const secondaryCta = getSecondaryCta(referral);

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 text-sm font-semibold text-green-800">
              <Link href="/" className="hover:text-green-950">
                SitGuru
              </Link>
              <span className="mx-2 text-slate-400">/</span>
              Partner Referral
            </div>

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">
              <span>{icon}</span>
              {category}
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              {displayName} recommends SitGuru
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Find trusted local pet care through SitGuru and support a partner
              helping pets, pet parents, and local communities grow stronger.
            </p>

            {location ? (
              <p className="mt-4 inline-flex w-fit rounded-full border border-green-100 bg-[#fbfaf6] px-4 py-2 text-sm font-bold text-green-900">
                📍 {location}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                {primaryCta.label}
              </Link>

              <Link
                href={secondaryCta.href}
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                {secondaryCta.label}
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-black text-green-950">
                Referral Code: {referral.code}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                This code helps SitGuru track qualified referrals, completed
                bookings, and partner rewards.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-amber-50 p-4 shadow-2xl shadow-green-950/10">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="rounded-[1.25rem] bg-[radial-gradient(circle_at_35%_25%,#bbf7d0,transparent_28%),radial-gradient(circle_at_80%_20%,#fed7aa,transparent_30%),linear-gradient(135deg,#f0fdf4,#fff7ed)] p-6">
                <div className="max-w-md rounded-2xl bg-white/90 p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
                    Trusted pet care
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-green-950">
                    Better care starts with a trusted connection.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    SitGuru helps pet parents connect with trusted Gurus for
                    sitting, walking, and pet-care support.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Trusted Gurus", "🐾"],
                    ["Easy Booking", "📅"],
                    ["Local Support", "💚"],
                  ].map(([label, tileIcon]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/90 p-4 text-center shadow-sm"
                    >
                      <p className="text-3xl">{tileIcon}</p>
                      <p className="mt-2 text-sm font-black text-green-950">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
                <p className="text-sm font-black text-green-950">
                  Better care. Stronger communities. Happier pets.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Partner referrals help SitGuru grow with trusted local
                  recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🐶
            </div>
            <h2 className="mt-5 text-2xl font-black text-green-950">
              Find trusted pet care
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Search for Gurus who can support your pet’s care needs, schedule,
              and location.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              💬
            </div>
            <h2 className="mt-5 text-2xl font-black text-green-950">
              Message and book
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connect with a Guru, ask questions, and book care through the
              SitGuru experience.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🎁
            </div>
            <h2 className="mt-5 text-2xl font-black text-green-950">
              Support the partner network
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Qualified activity from this page can help SitGuru reward the
              partner, affiliate, or ambassador who referred you.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              About this referral
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              A partner-powered SitGuru introduction
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              This page was created for a SitGuru partner, affiliate, or
              ambassador. Their referral link helps track growth while giving
              pet parents a trusted way to discover SitGuru.
            </p>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Partner
                </p>
                <p className="mt-2 text-xl font-black text-green-950">
                  {displayName}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Program
                </p>
                <p className="mt-2 text-xl font-black text-green-950">
                  {category}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Referral Code
                </p>
                <p className="mt-2 text-xl font-black text-green-950">
                  {referral.code}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Location
                </p>
                <p className="mt-2 text-xl font-black text-green-950">
                  {location || "SitGuru Network"}
                </p>
              </div>
            </div>

            {referral.partners?.website || referral.partners?.social_url ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {referral.partners.website ? (
                  <a
                    href={referral.partners.website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-green-200 bg-white px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                  >
                    Visit Partner Website
                  </a>
                ) : null}

                {referral.partners.social_url ? (
                  <a
                    href={referral.partners.social_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-green-200 bg-white px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                  >
                    Visit Partner Social
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-green-950 shadow-2xl shadow-green-950/20">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-200">
                Ready to start?
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Find trusted pet care with SitGuru.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-green-100">
                Use this referral link to start your SitGuru search and support
                a partner helping us grow better pet care.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href={primaryCta.href}
                className="rounded-xl bg-white px-6 py-3 text-center text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                {primaryCta.label}
              </Link>

              <Link
                href="/partners"
                className="rounded-xl border border-white/25 px-6 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                Learn About Partners
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}