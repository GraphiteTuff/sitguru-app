import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  ExternalLink,
  Link2,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  pet_parent_referral_url?: string | null;
  guru_referral_url?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type ReferralSummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  date: string;
  type: "Pet Parent" | "Guru" | "Booking";
  detail: string;
};

type ReferralStats = {
  petParentSignups: number;
  guruSignups: number;
  completedBookings: number;
};

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
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

function normalizeUrl(value: string, fallbackPath: string) {
  const siteUrl = getSiteUrl();
  const cleanValue = value.trim();

  if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
    return cleanValue;
  }

  if (cleanValue.startsWith("/")) return `${siteUrl}${cleanValue}`;

  return `${siteUrl}${fallbackPath}`;
}

function getReferralUrl({
  storedUrl,
  referralCode,
  type,
}: {
  storedUrl?: string | null;
  referralCode: string;
  type: "pet-parent" | "guru";
}) {
  const encodedCode = encodeURIComponent(referralCode);
  const fallbackPath =
    type === "pet-parent"
      ? `/signup?role=pet_parent&ambassador_code=${encodedCode}&ref=${encodedCode}&next=/customer/dashboard`
      : `/signup?role=guru&ambassador_code=${encodedCode}&ref=${encodedCode}&next=/guru/dashboard`;

  return normalizeUrl(asString(storedUrl), fallbackPath);
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return "";
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const cleanEmail = asString(email).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${userId},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail},email.eq.${cleanEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) return null;

  return data as AmbassadorRecord;
}

async function safeRowsByReferralColumns({
  table,
  referralCode,
  referralColumns,
  extraFilters = {},
}: {
  table: string;
  referralCode: string;
  referralColumns: string[];
  extraFilters?: Record<string, string>;
}) {
  const rowsById = new Map<string, AnyRow>();

  for (const column of referralColumns) {
    try {
      let query = supabaseAdmin
        .from(table)
        .select("*")
        .eq(column, referralCode);

      Object.entries(extraFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.limit(1000);

      if (error || !Array.isArray(data)) continue;

      data.forEach((row: AnyRow, index) => {
        const id = asString(row.id) || `${table}-${column}-${index}`;
        rowsById.set(id, row);
      });
    } catch {
      // Some live tables may not have every referral column yet. Skip safely.
    }
  }

  return Array.from(rowsById.values());
}

function getPersonName(row: AnyRow, fallback: string) {
  const fullName = firstText(
    row.full_name,
    row.display_name,
    row.name,
    row.customer_name,
    row.pet_parent_name,
    row.owner_name,
  );

  if (fullName) return fullName;

  const firstLast =
    `${asString(row.first_name)} ${asString(row.last_name)}`.trim();
  if (firstLast) return firstLast;

  return firstText(row.email, row.contact_email, row.login_email) || fallback;
}

function getRowStatus(row: AnyRow, fallback: string) {
  return titleCase(
    firstText(
      row.status,
      row.referral_status,
      row.application_status,
      row.booking_status,
      row.payment_status,
      row.signup_status,
    ) || fallback,
  );
}

function getRowDate(row: AnyRow) {
  return firstText(
    row.completed_at,
    row.submitted_at,
    row.approved_at,
    row.created_at,
    row.updated_at,
  );
}

function profileQualityLabel(row: AnyRow) {
  const hasEmail = Boolean(
    firstText(row.email, row.contact_email, row.login_email),
  );
  const hasPhone = Boolean(
    firstText(row.phone, row.phone_number, row.mobile_phone),
  );
  const hasPhoto = Boolean(
    firstText(
      row.avatar_url,
      row.profile_photo_url,
      row.photo_url,
      row.image_url,
    ),
  );
  const hasName = Boolean(getPersonName(row, ""));
  const completeCount = [hasEmail, hasPhone, hasPhoto, hasName].filter(
    Boolean,
  ).length;

  if (completeCount >= 4) return "Profile looks complete";
  if (completeCount >= 2) return "Profile partially complete";
  return "Needs profile details";
}

function mapPetParentRows(rows: AnyRow[]): ReferralSummary[] {
  return rows.map((row, index) => ({
    id: asString(row.id) || `pet-parent-${index}`,
    name: getPersonName(row, "Pet Parent"),
    email: firstText(row.email, row.contact_email, row.login_email) || "—",
    status: getRowStatus(row, "Signed Up"),
    date: formatDate(getRowDate(row)),
    type: "Pet Parent",
    detail: profileQualityLabel(row),
  }));
}

function mapGuruRows(rows: AnyRow[]): ReferralSummary[] {
  return rows.map((row, index) => ({
    id: asString(row.id) || `guru-${index}`,
    name: getPersonName(row, "Future Guru"),
    email: firstText(row.email, row.contact_email, row.login_email) || "—",
    status: getRowStatus(row, "Application Started"),
    date: formatDate(getRowDate(row)),
    type: "Guru",
    detail:
      firstText(row.city, row.service_area, row.zip_code) || "Guru referral",
  }));
}

function mapBookingRows(rows: AnyRow[]): ReferralSummary[] {
  return rows.map((row, index) => ({
    id: asString(row.id) || `booking-${index}`,
    name: getPersonName(row, "Booking"),
    email: firstText(row.customer_email, row.email) || "—",
    status: getRowStatus(row, "Completed"),
    date: formatDate(getRowDate(row)),
    type: "Booking",
    detail: money(
      asNumber(row.total_amount) ||
        asNumber(row.amount) ||
        asNumber(row.booking_total_amount) ||
        asNumber(row.price),
    ),
  }));
}

async function getReferralData(referralCode: string) {
  const [petParentRows, guruRows, bookingRows] = await Promise.all([
    safeRowsByReferralColumns({
      table: "profiles",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeRowsByReferralColumns({
      table: "guru_applications",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeRowsByReferralColumns({
      table: "bookings",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
      extraFilters: { status: "completed" },
    }),
  ]);

  const petParents = mapPetParentRows(petParentRows);
  const gurus = mapGuruRows(guruRows);
  const bookings = mapBookingRows(bookingRows);

  return {
    petParents,
    gurus,
    bookings,
    stats: {
      petParentSignups: petParents.length,
      guruSignups: gurus.length,
      completedBookings: bookings.length,
    } satisfies ReferralStats,
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
          {items.slice(0, 12).map((item) => (
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
            Share your Ambassador links. Tracked referrals will appear here
            after SitGuru records matching signup, application, or booking
            activity.
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
}: {
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
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
        <p className="break-all text-xs font-black !text-slate-800">{href}</p>
      </div>
      <Link
        href={href}
        target="_blank"
        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black !text-white transition hover:bg-emerald-800"
      >
        Open Link
        <ExternalLink className="h-4 w-4" />
      </Link>
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
    redirect("/login?mode=phone");
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const referralCode = asString(ambassador.referral_code);

  if (!referralCode) {
    redirect("/ambassador/dashboard");
  }

  const petParentUrl = getReferralUrl({
    storedUrl: ambassador.pet_parent_referral_url,
    referralCode,
    type: "pet-parent",
  });
  const guruUrl = getReferralUrl({
    storedUrl: ambassador.guru_referral_url,
    referralCode,
    type: "guru",
  });
  const referralData = await getReferralData(referralCode);
  const totalTracked =
    referralData.stats.petParentSignups +
    referralData.stats.guruSignups +
    referralData.stats.completedBookings;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Referrals
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Track every referral path.
              </h1>
              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                View Pet Parent signups, future Guru applicants, completed
                booking activity, and the links connected to your Ambassador
                referral code.
              </p>

              <div className="mt-6 inline-flex rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                Referral Code:{" "}
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
                    Quality referrals matter.
                  </h2>
                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    The best Pet Parent referrals complete profile details, add
                    photos, verify contact information, and complete qualifying
                    bookings. SitGuru reviews activity before rewards are paid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pet Parents"
            value={String(referralData.stats.petParentSignups)}
            description="Tracked Pet Parent signups"
            icon={<PawPrint className="h-6 w-6" />}
          />
          <StatCard
            title="Future Gurus"
            value={String(referralData.stats.guruSignups)}
            description="Tracked Guru applicants"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Completed Bookings"
            value={String(referralData.stats.completedBookings)}
            description="Referral-connected completed bookings"
            icon={<ClipboardCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Total Tracked"
            value={String(totalTracked)}
            description="All referral activity records"
            icon={<BadgeCheck className="h-6 w-6" />}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ReferralLinkCard
            title="Pet Parent Referral Link"
            detail="Share this with Pet Parents who may need trusted pet care."
            href={petParentUrl}
          />
          <ReferralLinkCard
            title="Guru Referral Link"
            detail="Share this with future Gurus, sitters, walkers, trainers, groomers, and pet professionals."
            href={guruUrl}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <ReferralList
            title="Pet Parent Referrals"
            description="People who signed up with your Ambassador code or link."
            items={referralData.petParents}
          />
          <ReferralList
            title="Guru Referrals"
            description="Future Gurus or Guru applicants connected to your Ambassador code."
            items={referralData.gurus}
          />
          <ReferralList
            title="Completed Booking Activity"
            description="Bookings tied to your Ambassador referral code."
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
                  Share the right link, encourage complete profiles, and remind
                  referrals to use your code. Earnings are shown separately
                  after SitGuru verifies qualifying reward activity.
                </p>
              </div>
            </div>

            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              View Earnings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
