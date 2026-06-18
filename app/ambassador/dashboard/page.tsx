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
  FileText,
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

type AmbassadorOnboardingPacketDisplay = {
  label: string;
  status: "complete" | "pending" | "needs_action";
  href: string;
  helper: string;
  submittedAt: string | null;
  reviewedAt: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "Not saved";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getAmbassadorOnboardingPacketDisplay(
  ambassadorId: string,
  userId?: string | null,
): Promise<AmbassadorOnboardingPacketDisplay> {
  const href = "/ambassador/dashboard/onboarding-packet";

  try {
    let query = supabaseAdmin
      .from("ambassador_onboarding_packets")
      .select("status, submitted_at, reviewed_at, admin_notes")
      .eq("ambassador_id", ambassadorId);

    if (!ambassadorId && userId) {
      query = supabaseAdmin
        .from("ambassador_onboarding_packets")
        .select("status, submitted_at, reviewed_at, admin_notes")
        .eq("user_id", userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn("Unable to load Ambassador onboarding packet status:", error);
      return {
        label: "Needs Action",
        status: "needs_action",
        href,
        helper:
          "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
        submittedAt: null,
        reviewedAt: null,
      };
    }

    const status = asString(data?.status).toLowerCase();

    if (["approved", "complete", "completed"].includes(status)) {
      return {
        label: "Complete",
        status: "complete",
        href,
        helper:
          "Your Ambassador onboarding packet has been reviewed and marked complete.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    if (["submitted", "pending_review", "in_review"].includes(status)) {
      return {
        label: "Submitted",
        status: "pending",
        href,
        helper:
          "Your Ambassador onboarding packet is submitted and waiting for SitGuru review.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    if (["needs_fix", "needs_action"].includes(status)) {
      return {
        label: "Needs Fix",
        status: "needs_action",
        href,
        helper:
          asString(data?.admin_notes) ||
          "SitGuru needs one or more updates before Ambassador onboarding can be completed.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    return {
      label: "Needs Action",
      status: "needs_action",
      href,
      helper:
        "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
      submittedAt: asString(data?.submitted_at) || null,
      reviewedAt: asString(data?.reviewed_at) || null,
    };
  } catch (error) {
    console.warn("Unable to load Ambassador onboarding packet status:", error);
    return {
      label: "Needs Action",
      status: "needs_action",
      href,
      helper:
        "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
      submittedAt: null,
      reviewedAt: null,
    };
  }
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
  const encodedCode = encodeURIComponent(referralCode);
  const fallbackPath =
    type === "pet-parent"
      ? `/signup?role=pet_parent&ambassador_code=${encodedCode}&ref=${encodedCode}&next=/customer/dashboard`
      : `/signup?role=guru&ambassador_code=${encodedCode}&ref=${encodedCode}&next=/guru/dashboard`;

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

async function safeReferralCount({
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
  const matchingIds = new Set<string>();

  for (const column of referralColumns) {
    try {
      let query = supabaseAdmin.from(table).select("id").eq(column, referralCode);

      Object.entries(extraFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.limit(1000);

      if (error || !Array.isArray(data)) continue;

      data.forEach((row: AnyRow) => {
        const id = asString(row.id);
        if (id) matchingIds.add(id);
      });
    } catch {
      // Some live tables may not have every referral column yet. Skip safely.
    }
  }

  return matchingIds.size;
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
    safeReferralCount({
      table: "profiles",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeReferralCount({
      table: "guru_applications",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeReferralCount({
      table: "bookings",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
      extraFilters: { status: "completed" },
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
  const [stats, onboardingPacket] = await Promise.all([
    getReferralStats(referralCode),
    getAmbassadorOnboardingPacketDisplay(
      asString(ambassadorRecord.id),
      ambassadorRecord.user_id || user.id,
    ),
  ]);

  const onboardingCtaLabel =
    onboardingPacket.status === "complete"
      ? "Review Onboarding"
      : onboardingPacket.status === "pending"
        ? "View Submitted Packet"
        : "Complete Onboarding";

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm sm:rounded-[34px]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="bg-[radial-gradient(circle_at_95%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 sm:p-7">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-100 text-xl font-black text-green-900 ring-1 ring-green-200 sm:h-20 sm:w-20">
                  {getInitials(fullName)}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700 sm:text-xs">
                    SitGuru Ambassador Dashboard
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    Hi, {firstName}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                    Your command center for referral links, Ambassador onboarding,
                    training, rewards, and SitGuru support.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>{asString(ambassadorRecord.status) || "active"}</Pill>
                    <Pill>{asString(ambassadorRecord.referral_status) || "Referral Code Active"}</Pill>
                    <Pill>{onboardingPacket.label}</Pill>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-green-100 bg-white p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <Link
                  href={onboardingPacket.href}
                  className="flex min-h-14 items-center justify-between rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                >
                  {onboardingCtaLabel}
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href={`/ambassador/messages?ref=${encodeURIComponent(referralCode)}`}
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-green-200 bg-white px-5 py-4 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Message SitGuru
                  <ArrowRight size={17} />
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <AmbassadorProgressPanel
          onboardingPacket={onboardingPacket}
          trainingStatus={asString(ambassadorRecord.training_status) || "Not Started"}
          referralCode={referralCode}
          stats={stats}
        />

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
            detail="Completed referrals"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Pending"
            value={money(stats.pendingRewards)}
            detail="Awaiting approval"
          />
          <StatCard
            icon={<BadgeCheck size={20} />}
            label="Approved"
            value={money(stats.approvedRewards)}
            detail="Approved unpaid"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Paid"
            value={money(stats.paidRewards)}
            detail="Already paid"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <DashboardCard>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                  <KeyRound size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Ambassador Code
                  </p>
                  <h2 className="mt-1 break-all text-4xl font-black text-green-950">
                    {referralCode}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Use this code with every Pet Parent, future Guru, partner,
                    or local referral conversation so activity can be tracked.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<Sparkles size={22} />}
              title="Today’s Focus"
              detail="Simple next actions to keep the Ambassador workflow moving."
            />

            <div className="mt-4 grid gap-3">
              <Link
                href={onboardingPacket.href}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  onboardingPacket.status === "complete"
                    ? "bg-green-50 text-green-900 ring-1 ring-green-100"
                    : onboardingPacket.status === "pending"
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                      : "bg-rose-50 text-rose-900 ring-1 ring-rose-100"
                }`}
              >
                {onboardingPacket.label}: {onboardingPacket.helper}
              </Link>

              <ReminderItem>Share your Pet Parent link with one local pet family.</ReminderItem>
              <ReminderItem>Share your Guru link with one potential sitter, walker, or pet professional.</ReminderItem>
              <ReminderItem>Message SitGuru if a referral is missing from tracking.</ReminderItem>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="Referral Health"
              detail="Quick view of how your code is performing."
            />
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                {stats.petParentSignups + stats.guruSignups} total referred signups
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                {stats.completedBookings} completed referral bookings
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<DollarSign size={22} />}
              title="Reward Summary"
              detail="Referral rewards are reviewed and approved by SitGuru."
            />
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Pending: {money(stats.pendingRewards)}
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Approved: {money(stats.approvedRewards)}
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Paid: {money(stats.paidRewards)}
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<ShieldCheck size={22} />}
              title="Program Rules"
              detail="Referral-first. Commission-based. Hourly only by exception."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>Do not promise guaranteed bookings or earnings.</ReminderItem>
              <ReminderItem>Use approved SitGuru messaging when sharing.</ReminderItem>
              <ReminderItem>Hourly work must be separately approved in writing.</ReminderItem>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<GraduationCap size={22} />}
              title="Training"
              detail="Complete Ambassador training before moving into full active status."
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ambassador/training"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                View Training
                <ArrowRight size={17} />
              </Link>
              <span className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-900">
                {asString(ambassadorRecord.training_status) || "Not Started"}
              </span>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<MessageCircle size={22} />}
              title="Support"
              detail="Need help with referrals, payout questions, or missing activity?"
            />
            <Link
              href={`/ambassador/messages?ref=${encodeURIComponent(referralCode)}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              Message SitGuru
              <ArrowRight size={17} />
            </Link>
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}


function AmbassadorProgressPanel({
  onboardingPacket,
  trainingStatus,
  referralCode,
  stats,
}: {
  onboardingPacket: AmbassadorOnboardingPacketDisplay;
  trainingStatus: string;
  referralCode: string;
  stats: ReferralStats;
}) {
  const normalizedTraining = trainingStatus.trim().toLowerCase();
  const hasReferralActivity =
    stats.petParentSignups + stats.guruSignups + stats.completedBookings > 0;

  const steps = [
    {
      label: "Referral Code",
      value: referralCode ? "Ready" : "Needed",
      complete: Boolean(referralCode),
      helper: "Share this with every referral.",
    },
    {
      label: "Onboarding",
      value: onboardingPacket.label,
      complete: onboardingPacket.status === "complete",
      pending: onboardingPacket.status === "pending",
      helper: onboardingPacket.status === "complete" ? "Reviewed by SitGuru." : onboardingPacket.helper,
    },
    {
      label: "Training",
      value: trainingStatus,
      complete:
        normalizedTraining.includes("complete") ||
        normalizedTraining.includes("approved") ||
        normalizedTraining.includes("done"),
      helper: "Complete training before full active status.",
    },
    {
      label: "Referral Activity",
      value: hasReferralActivity ? "Started" : "No activity yet",
      complete: hasReferralActivity,
      helper: "Activity appears after tracked signups or bookings.",
    },
  ];

  const completeCount = steps.filter((step) => step.complete).length;

  return (
    <section className="rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Where You Are
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950">
            Ambassador Progress
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Quick status view so Ambassadors know what is done, what is pending,
            and what to do next.
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 px-4 py-3 text-center ring-1 ring-green-100">
          <p className="text-2xl font-black text-green-950">
            {completeCount}/{steps.length}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
            areas ready
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`rounded-2xl border p-4 ${
              step.complete
                ? "border-green-200 bg-green-50"
                : step.pending
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {step.label}
              </p>
              <span
                className={`h-3 w-3 rounded-full ${
                  step.complete
                    ? "bg-green-600"
                    : step.pending
                      ? "bg-amber-500"
                      : "bg-slate-300"
                }`}
              />
            </div>
            <p className="mt-2 text-lg font-black text-slate-950">{step.value}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              {step.helper}
            </p>
          </div>
        ))}
      </div>
    </section>
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