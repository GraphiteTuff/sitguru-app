import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/config/site";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";
import {
  creatorRoleLabel,
  isCreatorAmbassadorType,
  isReservedReferralCode,
  normalizeReferralCode,
  publicReferralUrl,
} from "@/lib/ambassador/creator-referral";

export const dynamic = "force-dynamic";

type ReferralHit = {
  id: string;
  code: string;
  slug: string | null;
  ambassadorName: string;
  ambassadorType: string | null;
  photoUrl: string | null;
  location: string;
  active: boolean;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
};

function inactive(code: string): ReferralHit {
  return {
    id: "",
    code,
    slug: null,
    ambassadorName: "",
    ambassadorType: null,
    photoUrl: null,
    location: "",
    active: false,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const code = normalizeReferralCode(slug);
  const title = code
    ? `Find Pet Care with SitGuru — Recommended by ${code}`
    : "Find Pet Care with SitGuru";
  const canonical = code ? publicReferralUrl(getAppOrigin(), code) : getAppOrigin();
  return {
    title,
    description: "Trusted pet care, simplified. Find a local Guru on SitGuru.",
    alternates: { canonical },
    openGraph: {
      title,
      description: "Trusted pet care, simplified.",
      url: canonical,
      siteName: "SitGuru",
    },
  };
}

export default async function CustomerReferralPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = (await searchParams) || {};
  const requested = normalizeReferralCode(slug);
  const referral = await loadReferral(requested);

  if (referral.active && referral.code) {
    await trackReferralClick({
      code: referral.code,
      landingPage: `/r/${requested || slug}`,
      utmSource: query.utm_source,
      utmMedium: query.utm_medium,
      utmCampaign: query.utm_campaign,
    });
  }

  const findHref = referral.active
    ? `/search?ref=${encodeURIComponent(referral.code)}`
    : "/search";
  const signupHref = referral.active
    ? `/signup?ref=${encodeURIComponent(referral.code)}`
    : "/signup";
  const roleLabel = creatorRoleLabel(referral.ambassadorType);
  const qrSrc = referral.active
    ? `/api/referrals/qr?code=${encodeURIComponent(referral.code)}`
    : "";

  return (
    <main className="min-h-[100svh] bg-[#f4fbf7] px-4 py-6 text-slate-950 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="text-sm font-black text-[#0D5C3A]">SitGuru</p>

        {referral.active ? (
          <article className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
              Recommended by
            </p>
            <div className="mt-3 flex items-center gap-3">
              {referral.photoUrl ? (
                <Image
                  src={referral.photoUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : null}
              <div>
                <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950">
                  {referral.ambassadorName}
                </h1>
                <p className="mt-1 text-sm font-bold text-slate-600">{roleLabel}</p>
              </div>
            </div>
            {referral.location ? (
              <p className="mt-3 text-sm font-semibold text-slate-600">{referral.location}</p>
            ) : null}
            <p className="mt-4 text-base font-semibold leading-7 text-slate-700">
              Trusted pet care, simplified. Find a local Guru, then book on SitGuru.
            </p>
            <Link
              href={findHref}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0D5C3A] px-5 text-base font-black text-white"
            >
              Find Pet Care
            </Link>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Use referral code
            </p>
            <p className="mt-1 text-3xl font-black tracking-wide text-slate-950">{referral.code}</p>
            <p className="mt-2 break-all text-sm font-bold text-slate-700">
              {publicReferralUrl(getAppOrigin(), referral.code).replace(/^https?:\/\//, "")}
            </p>
            {qrSrc ? (
              <Image
                src={qrSrc}
                alt={`QR code linking to SitGuru.com/r/${referral.code}`}
                width={220}
                height={220}
                unoptimized
                className="mt-4 h-52 w-52 rounded-2xl border border-slate-200 bg-white p-2"
              />
            ) : null}
            <Link href={signupHref} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#0D5C3A] underline">
              Create a Pet Parent account
            </Link>
            {isCreatorAmbassadorType(referral.ambassadorType) ? (
              <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                {referral.ambassadorName} may earn a referral reward if you book. SitGuru does not require a post to say anything specific. This is a disclosure reminder, not legal advice.
              </p>
            ) : null}
          </article>
        ) : (
          <article className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
            <h1 className="text-3xl font-black leading-tight text-slate-950">
              This referral link is no longer active, but you can still find pet care on SitGuru.
            </h1>
            <Link
              href={findHref}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0D5C3A] px-5 text-base font-black text-white"
            >
              Find Pet Care
            </Link>
          </article>
        )}
      </div>
    </main>
  );
}

type PublicAmbassadorCard = {
  referral_code?: string | null;
  display_name?: string | null;
  ambassador_type?: string | null;
  city?: string | null;
  state?: string | null;
  territory?: string | null;
  photo_url?: string | null;
};

function viewIsMissing(message: string) {
  return /ambassador_public_referrals|schema cache|does not exist|PGRST205/i.test(message);
}

async function loadReferral(code: string): Promise<ReferralHit> {
  if (!code || isReservedReferralCode(code)) return inactive(code);
  try {
    const supabase = await createClient();

    const bySlug = await supabase
      .from("referral_codes")
      .select("code, slug, status")
      .ilike("slug", code)
      .limit(1)
      .maybeSingle();

    const byCode =
      bySlug.data ||
      (
        await supabase
          .from("referral_codes")
          .select("code, slug, status")
          .ilike("code", code)
          .limit(1)
          .maybeSingle()
      ).data;

    const codeRow = byCode as {
      code: string;
      slug: string | null;
      status: string;
    } | null;

    if (codeRow && codeRow.status !== "active") {
      return inactive(normalizeReferralCode(codeRow.code));
    }

    const cardQuery = await supabase
      .from("ambassador_public_referrals")
      .select("referral_code, display_name, ambassador_type, city, state, territory, photo_url")
      .ilike("referral_code", normalizeReferralCode(codeRow?.code || code))
      .limit(1)
      .maybeSingle();

    let card = (cardQuery.data || null) as PublicAmbassadorCard | null;
    if (cardQuery.error) {
      if (!viewIsMissing(cardQuery.error.message)) {
        console.error("[referral-page] public card lookup failed:", cardQuery.error.message);
      }
      card = null;
      if (!viewIsMissing(cardQuery.error.message) || !codeRow) {
        return inactive(normalizeReferralCode(codeRow?.code || code));
      }
    }

    if (!card && !codeRow) return inactive(code);
    if (!card && codeRow && !cardQuery.error) return inactive(normalizeReferralCode(codeRow.code));

    const publicCode = normalizeReferralCode(card?.referral_code || codeRow?.code || code);
    return {
      id: "",
      code: publicCode,
      slug: codeRow?.slug || null,
      ambassadorName: card?.display_name || "a SitGuru Ambassador",
      ambassadorType: card?.ambassador_type || null,
      photoUrl: card?.photo_url || null,
      location: card?.territory || [card?.city, card?.state].filter(Boolean).join(", "),
      active: true,
    };
  } catch (error) {
    console.error(
      "[referral-page]",
      error instanceof Error ? error.message : "lookup_failed",
    );
    return inactive(code);
  }
}
