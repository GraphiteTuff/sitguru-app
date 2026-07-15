import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Link2,
  PawPrint,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  referral_link?: string | null;
  pet_parent_referral_url?: string | null;
  guru_referral_url?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type AmbassadorReferralRow = {
  id: string;
  ambassador_id: string;
  referral_code?: string | null;
  referral_type?: string | null;
  referred_user_id?: string | null;
  referred_lead_id?: string | null;
  booking_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  country?: string | null;
  status?: string | null;
  booking_status?: string | null;
  signup_date?: string | null;
  qualified_at?: string | null;
  completed_booking_at?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  platform?: string | null;
  referral_source?: string | null;
  referral_medium?: string | null;
  referral_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReferralSummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  date: string;
  type: "Pet Parent" | "Guru" | "Business" | "Booking";
  detail: string;
  tracking: string;
};

type ReferralStats = {
  petParentSignups: number;
  guruSignups: number;
  businessReferrals: number;
  completedBookings: number;
  totalReferrals: number;
};

type ReferralData = {
  petParents: ReferralSummary[];
  gurus: ReferralSummary[];
  businesses: ReferralSummary[];
  bookings: ReferralSummary[];
  stats: ReferralStats;
  warning: string;
};

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return "";
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getSafeStoredSignupUrl(value?: string | null) {
  const storedUrl = asString(value);
  if (!storedUrl) return null;

  try {
    const siteUrl = new URL(getSiteUrl());
    const parsed = new URL(storedUrl, siteUrl);

    if (parsed.origin !== siteUrl.origin || parsed.pathname !== "/signup") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getReferralUrl({
  storedUrl,
  referralCode,
  type,
}: {
  storedUrl?: string | null;
  referralCode: string;
  type: "pet_parent" | "guru";
}) {
  const siteUrl = getSiteUrl();
  const url =
    getSafeStoredSignupUrl(storedUrl) || new URL("/signup", siteUrl);

  const role = type === "guru" ? "guru" : "pet_parent";
  const next =
    type === "guru" ? "/guru/dashboard" : "/customer/dashboard";
  const campaign = `sitguru_ambassador_${type}_growth`;

  url.searchParams.set("role", role);
  url.searchParams.set("ambassador_code", referralCode);
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("referral_type", type);
  url.searchParams.set("source", "ambassador");
  url.searchParams.set("medium", "referral_link");
  url.searchParams.set("campaign", campaign);
  url.searchParams.set("platform", "web");
  url.searchParams.set("utm_source", "ambassador");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", type);
  url.searchParams.set("next", next);

  return url.toString();
}

function getQrCodeUrl(referralUrl: string) {
  const params = new URLSearchParams({
    size: "260x260",
    data: referralUrl,
    margin: "12",
    format: "svg",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: ambassadorByUserId, error: userIdError } =
    await supabaseAdmin
      .from("ambassadors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador referrals lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = ambassadorByUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador referrals lookup by ${column} failed:`,
          error.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = asString(ambassador.status).toLowerCase();
  const workspaceAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not_a_fit";

  return workspaceAllowed ? ambassador : null;
}

function normalizeReferralType(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "pet_parent" ||
    normalized === "pet-parent" ||
    normalized === "customer" ||
    normalized === "pet_owner"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "guru" ||
    normalized === "provider" ||
    normalized === "sitter" ||
    normalized === "walker"
  ) {
    return "guru";
  }

  if (
    normalized === "business" ||
    normalized === "partner" ||
    normalized === "community"
  ) {
    return "business";
  }

  return normalized || "referral";
}

function getReferralName(row: AmbassadorReferralRow) {
  if (normalizeReferralType(row.referral_type) === "business") {
    return (
      firstText(row.business_name, row.display_name, row.email) ||
      "Business Referral"
    );
  }

  return (
    firstText(row.display_name, row.email) ||
    (normalizeReferralType(row.referral_type) === "guru"
      ? "Future Guru"
      : "Pet Parent")
  );
}

function getReferralStatus(row: AmbassadorReferralRow, fallback: string) {
  return titleCase(
    firstText(row.booking_status, row.status) || fallback,
  );
}

function getReferralDate(row: AmbassadorReferralRow) {
  return firstText(
    row.completed_booking_at,
    row.qualified_at,
    row.signup_date,
    row.created_at,
    row.updated_at,
  );
}

function getReferralLocation(row: AmbassadorReferralRow) {
  return [row.city, row.state, row.country]
    .map(asString)
    .filter(Boolean)
    .join(", ");
}

function getTrackingLabel(row: AmbassadorReferralRow) {
  const source = firstText(
    row.source,
    row.referral_source,
    row.utm_source,
  );
  const campaign = firstText(
    row.campaign,
    row.referral_campaign,
    row.utm_campaign,
  );
  const platform = firstText(row.platform);
  const medium = firstText(
    row.medium,
    row.referral_medium,
    row.utm_medium,
  );

  const parts = [
    source ? `Source: ${titleCase(source)}` : "",
    campaign ? `Campaign: ${titleCase(campaign)}` : "",
    platform ? `Platform: ${titleCase(platform)}` : "",
    medium ? `Medium: ${titleCase(medium)}` : "",
  ].filter(Boolean);

  return parts.join(" • ") || "Tracked through Ambassador attribution";
}

function isCompletedBooking(row: AmbassadorReferralRow) {
  const bookingStatus = asString(row.booking_status).toLowerCase();
  const status = asString(row.status).toLowerCase();

  return Boolean(
    row.completed_booking_at ||
      bookingStatus === "booking_completed" ||
      bookingStatus === "completed" ||
      status === "booking_completed",
  );
}

function mapReferral(
  row: AmbassadorReferralRow,
  type: ReferralSummary["type"],
): ReferralSummary {
  const location = getReferralLocation(row);
  const normalizedType = normalizeReferralType(row.referral_type);

  let detail = location || "Referral details pending";

  if (type === "Business") {
    detail =
      [asString(row.business_type), location]
        .filter(Boolean)
        .join(" • ") || "Local business or community referral";
  } else if (type === "Booking") {
    detail = [
      asString(row.booking_id) ? `Booking ${row.booking_id}` : "",
      location,
    ]
      .filter(Boolean)
      .join(" • ") || "Referral-linked completed booking";
  } else if (normalizedType === "guru") {
    detail = location || "Future Guru referral";
  } else if (normalizedType === "pet_parent") {
    detail = location || "Pet Parent referral";
  }

  return {
    id: row.id,
    name: getReferralName(row),
    email: asString(row.email) || "—",
    status: getReferralStatus(
      row,
      type === "Booking" ? "Booking Completed" : "Signed Up",
    ),
    date: formatDate(getReferralDate(row)),
    type,
    detail,
    tracking: getTrackingLabel(row),
  };
}

async function getReferralData(
  ambassadorId: string,
): Promise<ReferralData> {
  const { data, error } = await supabaseAdmin
    .from("ambassador_referrals")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error(
      "Unable to load canonical Ambassador referrals:",
      error.message,
    );

    return {
      petParents: [],
      gurus: [],
      businesses: [],
      bookings: [],
      stats: {
        petParentSignups: 0,
        guruSignups: 0,
        businessReferrals: 0,
        completedBookings: 0,
        totalReferrals: 0,
      },
      warning:
        "Referral activity could not be loaded from SitGuru right now. Your referral code and tracked links are still available.",
    };
  }

  const rows = (data || []) as AmbassadorReferralRow[];
  const petParentRows = rows.filter(
    (row) => normalizeReferralType(row.referral_type) === "pet_parent",
  );
  const guruRows = rows.filter(
    (row) => normalizeReferralType(row.referral_type) === "guru",
  );
  const businessRows = rows.filter(
    (row) => normalizeReferralType(row.referral_type) === "business",
  );
  const completedRows = rows.filter(isCompletedBooking);

  return {
    petParents: petParentRows.map((row) =>
      mapReferral(row, "Pet Parent"),
    ),
    gurus: guruRows.map((row) => mapReferral(row, "Guru")),
    businesses: businessRows.map((row) =>
      mapReferral(row, "Business"),
    ),
    bookings: completedRows.map((row) =>
      mapReferral(row, "Booking"),
    ),
    stats: {
      petParentSignups: petParentRows.length,
      guruSignups: guruRows.length,
      businessReferrals: businessRows.length,
      completedBookings: completedRows.length,
      totalReferrals: rows.length,
    },
    warning: "",
  };
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReferralList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ReferralSummary[];
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black !text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700 ring-1 ring-emerald-100">
          {items.length} records
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.slice(0, 20).map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black !text-slate-950">
                    {item.name}
                  </p>
                  <p className="mt-1 truncate text-xs font-bold !text-slate-500">
                    {item.email}
                  </p>
                  <p className="mt-2 text-xs font-bold leading-5 !text-slate-600">
                    {item.detail}
                  </p>
                  <p className="mt-2 text-[11px] font-bold leading-5 !text-emerald-700">
                    {item.tracking}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs font-black !text-emerald-700">
                    {item.status}
                  </p>
                  <p className="mt-1 text-xs font-bold !text-slate-500">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-lg font-black !text-slate-950">No records yet</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 !text-slate-700">
            Share your tracked Ambassador link. Canonical referral activity
            will appear here after SitGuru records the signup or qualifying
            booking.
          </p>
        </div>
      )}
    </section>
  );
}

function ReferralLinkCard({
  title,
  detail,
  href,
  referralCode,
}: {
  title: string;
  detail: string;
  href: string;
  referralCode: string;
}) {
  const qrCodeUrl = getQrCodeUrl(href);

  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-start">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black !text-emerald-950">{title}</p>
              <p className="mt-1 text-xs font-bold leading-5 !text-slate-700">
                {detail}
              </p>
            </div>
            <Link2 className="h-5 w-5 shrink-0 text-emerald-700" />
          </div>

          <div className="mt-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-emerald-700">
              Referral Code
            </p>
            <p className="mt-1 break-all text-base font-black !text-slate-950">
              {referralCode}
            </p>
          </div>

          <div className="mt-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-emerald-700">
              Tracked Signup Link
            </p>
            <p className="mt-1 break-all text-xs font-black !text-slate-800">
              {href}
            </p>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black !text-white transition hover:bg-emerald-800"
          >
            Open Tracked Signup
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-3 text-center shadow-sm">
          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            <QrCode className="h-4 w-4" />
            Scan to Join
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`QR code for ${title}`}
            width={180}
            height={180}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="mx-auto aspect-square w-full max-w-[180px] rounded-xl bg-white object-contain"
          />
          <p className="mt-2 text-[11px] font-bold leading-5 text-slate-600">
            The QR code opens the same tracked signup link.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AmbassadorDashboardReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/login/route?preferred=ambassador",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const referralCode = asString(ambassador.referral_code);

  if (!referralCode) {
    redirect("/ambassador/dashboard?warning=referral_code_missing");
  }

  const petParentUrl = getReferralUrl({
    storedUrl:
      ambassador.pet_parent_referral_url || ambassador.referral_link,
    referralCode,
    type: "pet_parent",
  });
  const guruUrl = getReferralUrl({
    storedUrl: ambassador.guru_referral_url,
    referralCode,
    type: "guru",
  });
  const referralData = await getReferralData(ambassador.id);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center xl:px-10">
            <div>
              <Link
                href="/ambassador/dashboard"
                className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-white"
              >
                ← Back to Dashboard
              </Link>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Referrals
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Track every referral path.
              </h1>
              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                View the canonical Pet Parent, future Guru, business, and
                completed-booking activity connected to your SitGuru Ambassador
                account.
              </p>

              <div className="mt-6 inline-flex rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                Referral Code:
                <span className="ml-2 !text-emerald-700">{referralCode}</span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    One canonical referral record.
                  </h2>
                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    This page reads only SitGuru’s canonical
                    ambassador_referrals records. It does not create referral
                    events when the dashboard loads, so viewing or refreshing
                    this page cannot duplicate attribution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {referralData.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
            {referralData.warning}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Pet Parents"
            value={String(referralData.stats.petParentSignups)}
            description="Canonical Pet Parent referrals"
            icon={<PawPrint className="h-6 w-6" />}
          />
          <StatCard
            title="Future Gurus"
            value={String(referralData.stats.guruSignups)}
            description="Canonical Guru referrals"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Businesses"
            value={String(referralData.stats.businessReferrals)}
            description="Business and community referrals"
            icon={<BriefcaseBusiness className="h-6 w-6" />}
          />
          <StatCard
            title="Completed Bookings"
            value={String(referralData.stats.completedBookings)}
            description="Qualified booking outcomes"
            icon={<ClipboardCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Total Referrals"
            value={String(referralData.stats.totalReferrals)}
            description="Unique canonical referral rows"
            icon={<BadgeCheck className="h-6 w-6" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ReferralLinkCard
            title="Pet Parent Referral Card"
            detail="Share this tracked link or QR code with Pet Parents who may need trusted local pet care."
            href={petParentUrl}
            referralCode={referralCode}
          />
          <ReferralLinkCard
            title="Guru Referral Card"
            detail="Share this tracked link or QR code with future Gurus, walkers, trainers, groomers, and pet professionals."
            href={guruUrl}
            referralCode={referralCode}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ReferralList
            title="Pet Parent Referrals"
            description="Canonical Pet Parent referrals connected to your Ambassador record."
            items={referralData.petParents}
          />
          <ReferralList
            title="Guru Referrals"
            description="Canonical future Guru referrals connected to your Ambassador record."
            items={referralData.gurus}
          />
          <ReferralList
            title="Business & Community Referrals"
            description="Businesses, organizations, and community partners connected to your Ambassador record."
            items={referralData.businesses}
          />
          <ReferralList
            title="Completed Booking Activity"
            description="Completed booking outcomes stored on canonical Ambassador referral records."
            items={referralData.bookings}
          />
        </section>

        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-black !text-emerald-900">
                  Keep growing verified activity.
                </p>
                <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 !text-emerald-900">
                  Share the correct tracked link, encourage complete profiles,
                  and remind referrals to keep the Ambassador code attached.
                  Rewards remain separate until SitGuru verifies qualifying
                  activity.
                </p>
              </div>
            </div>

            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              View Earnings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}