import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

type ReferralCode = {
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
    business_name: string;
    partner_type: string;
    city: string | null;
    state: string | null;
    status: "active" | "paused" | "suspended" | "archived";
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
    city: string | null;
    state: string | null;
    territory: string | null;
    tier: "bronze" | "silver" | "gold" | "city_captain";
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
  if (!value) return "SitGuru Partner";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getDisplayName(referral: ReferralCode) {
  if (referral.ambassadors?.display_name) return referral.ambassadors.display_name;
  if (referral.partners?.business_name) return referral.partners.business_name;
  return "a SitGuru Partner";
}

function getProgramLabel(referral: ReferralCode) {
  if (referral.ambassadors) return formatLabel(referral.ambassadors.ambassador_type);
  if (referral.partners) return formatLabel(referral.partners.partner_type);
  return formatLabel(referral.campaign_type);
}

function getLocation(referral: ReferralCode) {
  if (referral.ambassadors) {
    return (
      referral.ambassadors.territory ||
      [referral.ambassadors.city, referral.ambassadors.state]
        .filter(Boolean)
        .join(", ")
    );
  }

  if (referral.partners) {
    return [referral.partners.city, referral.partners.state]
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

export default async function CustomerReferralPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("referral_codes")
    .select(
      `
        *,
        partners (
          id,
          business_name,
          partner_type,
          city,
          state,
          status
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type,
          city,
          state,
          territory,
          tier,
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

  const referral = data as ReferralCode;

  if (referral.partners && referral.partners.status !== "active") {
    notFound();
  }

  if (referral.ambassadors && referral.ambassadors.status !== "active") {
    notFound();
  }

  await trackReferralClick({
    referralCodeId: referral.id,
    landingPage: `/r/${params.slug}`,
    utmSource: searchParams?.utm_source,
    utmMedium: searchParams?.utm_medium,
    utmCampaign: searchParams?.utm_campaign,
  });

  const displayName = getDisplayName(referral);
  const programLabel = getProgramLabel(referral);
  const location = getLocation(referral);
  const findGuruHref = `/find-a-guru?ref=${encodeURIComponent(referral.code)}`;
  const signupHref = `/signup?ref=${encodeURIComponent(referral.code)}`;

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
              Customer Referral
            </div>

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">
              <span>🎁</span>
              {programLabel}
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              {displayName} invited you to SitGuru
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Get started with trusted local pet care and use this referral to
              help SitGuru track rewards for the person or partner who invited
              you.
            </p>

            {location ? (
              <p className="mt-4 inline-flex w-fit rounded-full border border-green-100 bg-[#fbfaf6] px-4 py-2 text-sm font-bold text-green-900">
                📍 {location}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={findGuruHref}
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Find a Guru
              </Link>

              <Link
                href={signupHref}
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Create Pet Parent Account
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-black text-green-950">
                Referral Code: {referral.code}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                This referral code will be passed into SitGuru as you search,
                sign up, or book.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-amber-50 p-4 shadow-2xl shadow-green-950/10">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="rounded-[1.25rem] bg-[radial-gradient(circle_at_35%_25%,#bbf7d0,transparent_28%),radial-gradient(circle_at_80%_20%,#fed7aa,transparent_30%),linear-gradient(135deg,#f0fdf4,#fff7ed)] p-6">
                <div className="max-w-md rounded-2xl bg-white/90 p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
                    Pet parent referral
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-green-950">
                    Trusted care starts with a warm introduction.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Search for local Gurus, connect through SitGuru, and book
                    trusted pet care when you are ready.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Find Gurus", "🔎"],
                    ["Message", "💬"],
                    ["Book Care", "📅"],
                  ].map(([label, icon]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/90 p-4 text-center shadow-sm"
                    >
                      <p className="text-3xl">{icon}</p>
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
                  Referral links help SitGuru reward verified growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Search locally",
              description:
                "Start by searching for Gurus based on location, availability, and the care your pet needs.",
              icon: "📍",
            },
            {
              title: "Connect safely",
              description:
                "Message through SitGuru and choose a Guru that feels like the right fit.",
              icon: "🛡️",
            },
            {
              title: "Book confidently",
              description:
                "Complete your booking through SitGuru so referral tracking and rewards can qualify.",
              icon: "✅",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {item.icon}
              </div>
              <h2 className="mt-5 text-2xl font-black text-green-950">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-green-950 shadow-2xl shadow-green-950/20">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-200">
                Ready to find care?
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Start your SitGuru search.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-green-100">
                Your referral code will travel with you so SitGuru can connect
                the activity back to this referral.
              </p>
            </div>

            <Link
              href={findGuruHref}
              className="rounded-xl bg-white px-6 py-3 text-center text-sm font-black text-green-950 transition hover:bg-green-50"
            >
              Find a Guru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}