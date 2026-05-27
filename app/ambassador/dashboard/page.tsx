import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ClipboardCheck,
  DollarSign,
  GraduationCap,
  KeyRound,
  LogOut,
  MessageCircle,
  PawPrint,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
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
  login_username?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  dashboard_slug?: string | null;
  status?: string | null;
  referral_status?: string | null;
  onboarding_status?: string | null;
  training_status?: string | null;
  pet_parent_referral_url?: string | null;
  guru_referral_url?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type ReferralStats = {
  petParentSignups: number;
  guruSignups: number;
  completedBookings: number;
  pendingRewards: number;
  approvedRewards: number;
  paidRewards: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || "Ambassador";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
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
  const fallbackPath =
    type === "pet-parent"
      ? `/signup?ref=${encodeURIComponent(referralCode)}`
      : `/become-a-guru?ref=${encodeURIComponent(referralCode)}`;

  return normalizeUrl(asString(storedUrl), fallbackPath);
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/ambassador/login");
}

async function safeCount(table: string, filters: Record<string, string>) {
  try {
    let query = supabaseAdmin.from(table).select("id", {
      count: "exact",
      head: true,
    });

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;

    if (error) return 0;

    return count || 0;
  } catch {
    return 0;
  }
}

async function safeRewardSum(referralCode: string, status: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ambassador_rewards")
      .select("amount, reward_amount, payout_amount, status")
      .eq("referral_code", referralCode)
      .eq("status", status)
      .limit(1000);

    if (error || !Array.isArray(data)) return 0;

    return data.reduce((sum, row: AnyRow) => {
      return (
        sum +
        (asNumber(row.amount) ||
          asNumber(row.reward_amount) ||
          asNumber(row.payout_amount))
      );
    }, 0);
  } catch {
    return 0;
  }
}

async function getReferralStats(referralCode: string): Promise<ReferralStats> {
  const [
    petParentSignups,
    guruSignups,
    completedBookings,
    pendingRewards,
    approvedRewards,
    paidRewards,
  ] = await Promise.all([
    safeCount("profiles", { referral_code: referralCode }),
    safeCount("guru_applications", { referral_code: referralCode }),
    safeCount("bookings", {
      referral_code: referralCode,
      status: "completed",
    }),
    safeRewardSum(referralCode, "pending"),
    safeRewardSum(referralCode, "approved"),
    safeRewardSum(referralCode, "paid"),
  ]);

  return {
    petParentSignups,
    guruSignups,
    completedBookings,
    pendingRewards,
    approvedRewards,
    paidRewards,
  };
}

export default async function AmbassadorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/ambassador/login");
  }

  const userEmail = asString(user.email).toLowerCase();

  const { data: ambassador, error: ambassadorError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${user.id},login_email.eq.${userEmail},contact_email.eq.${userEmail},email.eq.${userEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (ambassadorError || !ambassador) {
    await supabase.auth.signOut();
    redirect("/ambassador/login?error=restricted");
  }

  const ambassadorRecord = ambassador as AmbassadorRecord;
  const fullName = asString(ambassadorRecord.full_name) || "SitGuru Ambassador";
  const firstName = getFirstName(fullName);
  const referralCode = asString(ambassadorRecord.referral_code);

  if (!referralCode) {
    redirect("/ambassador/login?error=not_found");
  }

  const petParentUrl = getReferralUrl({
    storedUrl: ambassadorRecord.pet_parent_referral_url,
    referralCode,
    type: "pet-parent",
  });
  const guruUrl = getReferralUrl({
    storedUrl: ambassadorRecord.guru_referral_url,
    referralCode,
    type: "guru",
  });
  const stats = await getReferralStats(referralCode);

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-xl font-black text-green-800 ring-1 ring-green-100 sm:h-20 sm:w-20">
                {getInitials(fullName)}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  SitGuru Student Ambassador
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                  Hi, {firstName}
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Welcome to your private Ambassador dashboard. Track your
                  referral code, share your signup links, follow training, and
                  monitor referral activity as SitGuru verifies it.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>{asString(ambassadorRecord.status) || "interested"}</Pill>
                  <Pill>{asString(ambassadorRecord.referral_status) || "Early Referral Approved"}</Pill>
                  <Pill>{asString(ambassadorRecord.training_status) || "Not Started"}</Pill>
                </div>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50 lg:w-auto"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <DashboardCard>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <KeyRound size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Ambassador Code
                </p>
                <h2 className="mt-1 break-all text-3xl font-black text-green-950">
                  {referralCode}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Ask people to use your code when they sign up so SitGuru can
                  connect referral activity to your Ambassador dashboard.
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Portal Access
                </p>
                <h2 className="mt-1 text-2xl font-black text-green-950">
                  Ambassador Only
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  This login is separate from Pet Parent, Guru, and Admin portal
                  access.
                </p>
              </div>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ReferralLinkCard
            icon={<PawPrint size={22} />}
            title="Pet Parent Referral Link"
            detail="Share this with Pet Parents who may need trusted pet care."
            url={petParentUrl}
          />
          <ReferralLinkCard
            icon={<Users size={22} />}
            title="Guru Referral Link"
            detail="Share this with people who may want to apply as a Guru."
            url={guruUrl}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<PawPrint size={20} />}
            label="Pet Parents"
            value={String(stats.petParentSignups)}
            detail="Referred signups"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Gurus"
            value={String(stats.guruSignups)}
            detail="Referred applicants"
          />
          <StatCard
            icon={<ClipboardCheck size={20} />}
            label="Bookings"
            value={String(stats.completedBookings)}
            detail="Completed referral bookings"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Pending"
            value={money(stats.pendingRewards)}
            detail="Not approved yet"
          />
          <StatCard
            icon={<BadgeCheck size={20} />}
            label="Approved"
            value={money(stats.approvedRewards)}
            detail="Approved unpaid rewards"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Paid"
            value={money(stats.paidRewards)}
            detail="Rewards already paid"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <DashboardCard>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Training Status
                </p>
                <h2 className="mt-1 text-2xl font-black text-green-950">
                  {asString(ambassadorRecord.training_status) || "Not Started"}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Complete the SitGuru Student Ambassador training videos before
                  moving into full active status.
                </p>

                <Link
                  href="/ambassador/training"
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
                >
                  View Training
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <MessageCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  SitGuru Messenger
                </p>
                <h2 className="mt-1 text-2xl font-black text-green-950">
                  Need help?
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Message SitGuru about onboarding, your referral code, signup
                  credit, Guru referrals, Pet Parent referrals, or payout
                  questions.
                </p>

                <Link
                  href={`/ambassador/messages?ref=${encodeURIComponent(referralCode)}`}
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                >
                  Message SitGuru
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<QrCode size={22} />}
              title="QR Codes"
              detail="QR code downloads can be added here for flyers, cards, and social posts."
            />
            <div className="mt-4 rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-5 text-sm font-bold leading-6 text-green-900">
              QR code tools are coming next. For now, share your referral links
              directly by text, email, social media, or word of mouth.
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<BookOpenCheck size={22} />}
              title="Quick Reminders"
              detail="Keep outreach simple, professional, and accurate."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>Do not promise guaranteed bookings or earnings.</ReminderItem>
              <ReminderItem>Use your referral code with every signup conversation.</ReminderItem>
              <ReminderItem>Refer both Pet Parents and future Gurus.</ReminderItem>
              <ReminderItem>Contact SitGuru if a signup is missing from tracking.</ReminderItem>
            </div>
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function ReferralLinkCard({
  icon,
  title,
  detail,
  url,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  url: string;
}) {
  return (
    <DashboardCard>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
          <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfcf9] px-4 py-3">
            <p className="break-all text-sm font-black text-green-950">{url}</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-black text-green-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function ReminderItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-950">
      <Sparkles size={17} className="mt-1 shrink-0 text-green-800" />
      <span>{children}</span>
    </div>
  );
}