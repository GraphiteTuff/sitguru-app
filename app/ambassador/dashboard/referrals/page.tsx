import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  ExternalLink,
  Link2,
  PawPrint,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import AmbassadorReferralCardClient from "@/components/ambassador/AmbassadorReferralCardClient";
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
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
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

type ReferralCodeRow = {
  id?: string | null;
  ambassador_id?: string | null;
  code?: string | null;
  status?: string | null;
};

type ReferralClickRow = {
  id?: string | null;
  referral_code_id?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
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

type VisitStats = {
  linkVisits: number;
  qrScans: number;
  petParentVisits: number;
  guruVisits: number;
  warning: string;
};

type ReferralData = {
  recent: ReferralSummary[];
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

function getShortReferralPath({
  referralCode,
  type,
}: {
  referralCode: string;
  type: "pet-parent" | "guru";
}) {
  return `/r/${encodeURIComponent(referralCode)}/${type}`;
}

function getAbsoluteReferralUrl(path: string) {
  return `${getSiteUrl()}${path}`;
}

function getCompactDisplayUrl(path: string) {
  return `sitguru.com${path}`;
}

function getQrCodeUrl(value: string, size = 240) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: value,
    margin: "12",
    format: "svg",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function getAmbassadorAvatarUrl(ambassador: AmbassadorRecord) {
  return firstText(
    ambassador.profile_photo_url,
    ambassador.photo_url,
    ambassador.image_url,
    ambassador.avatar_url,
  );
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

  const status = asString(ambassador.status)
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  const workspaceAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    !["archived", "inactive", "not a fit"].includes(status);

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

function getSummaryType(
  row: AmbassadorReferralRow,
): ReferralSummary["type"] {
  if (isCompletedBooking(row)) return "Booking";

  const type = normalizeReferralType(row.referral_type);

  if (type === "guru") return "Guru";
  if (type === "business") return "Business";
  return "Pet Parent";
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
    .limit(5000);

  if (error) {
    console.error(
      "Unable to load canonical Ambassador referrals:",
      error.message,
    );

    return {
      recent: [],
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
    recent: rows.slice(0, 20).map((row) =>
      mapReferral(row, getSummaryType(row)),
    ),
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

async function getReferralCodeRow({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}) {
  const { data: byAmbassador, error: ambassadorError } = await supabaseAdmin
    .from("referral_codes")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (ambassadorError) {
    console.warn(
      "Referral Center code lookup by Ambassador failed:",
      ambassadorError.message,
    );
  }

  if (byAmbassador) return byAmbassador as ReferralCodeRow;

  const { data: byCode, error: codeError } = await supabaseAdmin
    .from("referral_codes")
    .select("*")
    .ilike("code", referralCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (codeError) {
    console.warn(
      "Referral Center code lookup by code failed:",
      codeError.message,
    );
  }

  return (byCode || null) as ReferralCodeRow | null;
}

async function getVisitStats({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}): Promise<VisitStats> {
  const referralCodeRow = await getReferralCodeRow({
    ambassadorId,
    referralCode,
  });
  const referralCodeId = asString(referralCodeRow?.id);

  if (!referralCodeId) {
    return {
      linkVisits: 0,
      qrScans: 0,
      petParentVisits: 0,
      guruVisits: 0,
      warning: "",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("referral_clicks")
    .select("*")
    .eq("referral_code_id", referralCodeId)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error(
      "Unable to load Ambassador referral visits:",
      error.message,
    );

    return {
      linkVisits: 0,
      qrScans: 0,
      petParentVisits: 0,
      guruVisits: 0,
      warning: "Link-visit and QR-scan totals could not be loaded.",
    };
  }

  const rows = (data || []) as ReferralClickRow[];

  let linkVisits = 0;
  let qrScans = 0;
  let petParentVisits = 0;
  let guruVisits = 0;

  rows.forEach((row) => {
    const landingPage = asString(row.landing_page).toLowerCase();
    const medium = asString(row.utm_medium).toLowerCase();
    const isQr = medium === "qr" || landingPage.includes("via=qr");

    if (isQr) qrScans += 1;
    else linkVisits += 1;

    if (landingPage.includes("/pet-parent")) {
      petParentVisits += 1;
    }

    if (landingPage.includes("/guru")) {
      guruVisits += 1;
    }
  });

  return {
    linkVisits,
    qrScans,
    petParentVisits,
    guruVisits,
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
    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {description}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReferralActivityFeed({
  items,
}: {
  items: ReferralSummary[];
}) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            Referral Feed
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Recent verified activity
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
          {items.length} recent
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {items.slice(0, 12).map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.name}
                    </p>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-100">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-600">
                    {item.detail}
                  </p>
                  <p className="mt-1 text-[11px] font-bold leading-5 text-emerald-700">
                    {item.tracking}
                  </p>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-xs font-black text-emerald-700">
                    {item.status}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-black text-slate-950">
            No referral activity yet
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Share a tracked short link or display a QR code at an event.
          </p>
        </div>
      )}
    </section>
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
    <details className="group rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
            {items.length}
          </span>
          <ArrowRight className="h-5 w-5 text-emerald-700 transition group-open:rotate-90" />
        </div>
      </summary>

      <div className="border-t border-slate-100 p-5">
        {items.length > 0 ? (
          <div className="grid gap-3">
            {items.slice(0, 20).map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.name}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {item.email}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                      {item.detail}
                    </p>
                    <p className="mt-2 text-[11px] font-bold leading-5 text-emerald-700">
                      {item.tracking}
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="text-xs font-black text-emerald-700">
                      {item.status}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {item.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="font-black text-slate-950">No records yet</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Canonical activity will appear here after SitGuru records it.
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

function ShortTrackedLinkCard({
  title,
  detail,
  shortPath,
  icon,
  visits,
}: {
  title: string;
  detail: string;
  shortPath: string;
  icon: ReactNode;
  visits: number;
}) {
  const linkUrl = getAbsoluteReferralUrl(shortPath);
  const qrUrl = `${linkUrl}?via=qr`;
  const qrCodeUrl = getQrCodeUrl(qrUrl);

  return (
    <article className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-black text-emerald-950">{title}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
        <a
          href={qrCodeUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white p-2 ring-1 ring-emerald-100"
          aria-label={`Open full QR code for ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`${title} tracked QR code`}
            className="aspect-square w-full object-contain"
          />
        </a>

        <div className="min-w-0">
          <p className="break-words rounded-xl bg-white px-3 py-2 text-xs font-black leading-5 text-emerald-950 ring-1 ring-emerald-100">
            {getCompactDisplayUrl(shortPath)}
          </p>
          <p className="mt-2 text-xs font-black text-emerald-700">
            {visits} tracked visits
          </p>
          <a
            href={shortPath}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
          >
            Open Link
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
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
      next: "/ambassador/dashboard/referrals",
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

  const petParentPath = getShortReferralPath({
    referralCode,
    type: "pet-parent",
  });
  const guruPath = getShortReferralPath({
    referralCode,
    type: "guru",
  });
  const petParentUrl = getAbsoluteReferralUrl(petParentPath);

  const [referralData, visitStats] = await Promise.all([
    getReferralData(ambassador.id),
    getVisitStats({
      ambassadorId: ambassador.id,
      referralCode,
    }),
  ]);

  const fullName =
    asString(ambassador.full_name) || "SitGuru Ambassador";
  const avatarUrl = getAmbassadorAvatarUrl(ambassador);
  const warning = [referralData.warning, visitStats.warning]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-3 py-4 text-slate-950 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="overflow-hidden rounded-[1.8rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Link
                href="/ambassador/dashboard"
                className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-white"
              >
                ← Dashboard
              </Link>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
                Ambassador Referral Center
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Share, scan, track, and follow up.
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-800 sm:text-base">
                Use the mobile referral card at events, open full-screen Vendor
                Mode, share short links, and monitor canonical referral
                activity without creating duplicate records.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  Code: <span className="text-emerald-700">{referralCode}</span>
                </span>
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  {referralData.stats.totalReferrals} canonical referrals
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl">
              <ShieldCheck className="h-8 w-8 text-emerald-700" />
              <h2 className="mt-3 text-xl font-black text-slate-950">
                Tracking stays canonical.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Link and QR visits come from referral-click records. Signups and
                bookings come from `ambassador_referrals`. Viewing this page
                does not create activity.
              </p>
            </div>
          </div>
        </section>

        {warning ? (
          <section className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
            {warning}
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Link Visits"
            value={String(visitStats.linkVisits)}
            description="Normal tracked visits"
            icon={<Link2 className="h-5 w-5" />}
          />
          <StatCard
            title="QR Scans"
            value={String(visitStats.qrScans)}
            description="Vendor and flyer scans"
            icon={<ScanLine className="h-5 w-5" />}
          />
          <StatCard
            title="Pet Parents"
            value={String(referralData.stats.petParentSignups)}
            description="Verified referrals"
            icon={<PawPrint className="h-5 w-5" />}
          />
          <StatCard
            title="Future Gurus"
            value={String(referralData.stats.guruSignups)}
            description="Verified applicants"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Businesses"
            value={String(referralData.stats.businessReferrals)}
            description="Partner opportunities"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
          />
          <StatCard
            title="Bookings"
            value={String(referralData.stats.completedBookings)}
            description="Completed outcomes"
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                Mobile Referral Card
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Event-ready Pet Parent card
              </h2>
            </div>

            <AmbassadorReferralCardClient
              ambassadorName={fullName}
              referralCode={referralCode}
              referralUrl={petParentUrl}
              avatarUrl={avatarUrl || null}
            />
          </div>

          <div className="space-y-4">
            <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Short Links & QR Codes
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Pet Parent and Guru event tools
                  </h2>
                </div>
                <QrCode className="h-7 w-7 text-emerald-700" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ShortTrackedLinkCard
                  title="Pet Parent Referral"
                  detail="Trusted local pet-care signup."
                  shortPath={petParentPath}
                  icon={<PawPrint className="h-5 w-5" />}
                  visits={visitStats.petParentVisits}
                />
                <ShortTrackedLinkCard
                  title="Future Guru Referral"
                  detail="Application path for sitters and pet professionals."
                  shortPath={guruPath}
                  icon={<Users className="h-5 w-5" />}
                  visits={visitStats.guruVisits}
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/ambassador/dashboard/referrals/analytics"
                className="group rounded-[1.3rem] border border-emerald-200 bg-emerald-700 p-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    View Analytics
                  </span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-emerald-50">
                  Trends, conversion, top channels, link visits, and QR scans.
                </p>
              </Link>

              <Link
                href="/ambassador/dashboard/social"
                className="group rounded-[1.3rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <span>Social Media Hub</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-emerald-800">
                  Platform QR codes, visits, signups, and social milestones.
                </p>
              </Link>

              <Link
                href="/ambassador/dashboard/commissions"
                className="group rounded-[1.3rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <span>Commissions & Rewards</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-emerald-800">
                  Pending, approved, ready-for-payout, and paid records.
                </p>
              </Link>

              <Link
                href="/ambassador/dashboard/payouts"
                className="group rounded-[1.3rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <span>Payout Readiness</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-emerald-800">
                  Stripe setup, blockers, payout method, and payment history.
                </p>
              </Link>
            </section>
          </div>
        </section>

        <ReferralActivityFeed items={referralData.recent} />

        <section className="grid gap-3 lg:grid-cols-2">
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
            description="Businesses, organizations, and community partners."
            items={referralData.businesses}
          />
          <ReferralList
            title="Completed Booking Activity"
            description="Completed outcomes stored on Ambassador referral records."
            items={referralData.bookings}
          />
        </section>

        <section className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-emerald-950">
                  Keep growing verified activity.
                </p>
                <p className="mt-1 max-w-5xl text-sm font-semibold leading-6 text-emerald-900">
                  Share the correct short link, use Vendor Mode at events, and
                  remind referrals to keep your Ambassador code attached.
                  Rewards remain separate until SitGuru verifies eligibility.
                </p>
              </div>
            </div>

            <Link
              href="/ambassador/dashboard/commissions"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              View Commissions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}