import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  FileBarChart,
  Gift,
  GraduationCap,
  MessageCircle,
  MousePointerClick,
  Plus,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AccountLifecycleRollupCard from "@/components/admin/AccountLifecycleRollupCard";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeRowsResult = {
  label: string;
  rows: AnyRow[];
  count: number | null;
  ok: boolean;
  errorMessage: string;
};

type SafeCountResult = {
  label: string;
  count: number | null;
  ok: boolean;
  errorMessage: string;
};

const adminRoutes = {
  dashboard: "/admin",
  accounts: "/admin/accounts",
  customerAccountLifecycle: "/admin/customers/account-lifecycle",
  guruAccountLifecycle: "/admin/gurus/account-lifecycle",
  bookings: "/admin/bookings",
  newBooking: "/admin/bookings/new",
  petParents: "/admin/customers",
  newPetParent: "/admin/customers/new",
  gurus: "/admin/gurus",
  newGuru: "/admin/gurus/new",
  guruPerformance: "/admin/guru-performance",
  messages: "/admin/messages",
  settings: "/admin/settings",
  financials: "/admin/financials",
  profitLoss: "/admin/financials/profit-loss",
  stripeTransactions: "/admin/financials/stripe",
  commissions: "/admin/commissions",
  exports: "/admin/exports",
  reports: "/admin/exports",
  activity: "/admin/activity",
  launchSignups: "/admin/launch-signups",
  referrals: "/admin/referrals",
  programs: "/admin/programs",
  hr: "/admin/hr",
  universityTraining: "/admin/ambassador-training",
  universityAssignments: "/admin/university-assignments",
  ambassadorLeads: "/admin/ambassador-leads",
  partners: "/admin/partners",
  partnerApplications: "/admin/partners/applications",
  activePartners: "/admin/partners/active",
  partnerAmbassadors: "/admin/partners/ambassadors",
  partnerAffiliates: "/admin/partners/affiliates",
  partnerCampaigns: "/admin/partners/campaigns",
  partnerRewards: "/admin/partners/rewards",
  partnerPayouts: "/admin/partners/payouts",
  partnerMessages: "/admin/partners/messages",
  backgroundChecks: "/admin/background-checks",
  fraud: "/admin/partners/fraud",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value || 0) ? value || 0 : 0,
  );
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value || 0) ? value || 0 : 0);
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.booking_date) ||
    asString(row.start_time) ||
    asString(row.date) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "payment_status", "booking_status", "payout_status"],
    "pending",
  ).toLowerCase();
}

function getRole(row: AnyRow) {
  return getText(
    row,
    ["role", "user_role", "account_type", "type", "segment"],
    "",
  ).toLowerCase();
}

function getDisplayName(row: AnyRow, fallback = "SitGuru User") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "guru_name",
      "email",
    ],
    fallback,
  );
}

function getAvatar(row: AnyRow) {
  return getText(row, [
    "avatar_url",
    "profile_photo_url",
    "photo_url",
    "image_url",
    "headshot_url",
  ]);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

function isPendingStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied"
  );
}

function isActiveStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "active" ||
    status === "approved" ||
    status === "live" ||
    status === "enabled" ||
    status === "verified"
  );
}

function isUnreadMessage(message: AnyRow) {
  const readAt = asString(message.read_at);
  const status = asString(message.status).toLowerCase();

  if (message.is_read === false || message.read === false) return true;
  if (!readAt && status !== "read" && status !== "archived") return true;

  return false;
}

function getMessageBody(message: AnyRow) {
  return getText(
    message,
    ["body", "message", "content", "text"],
    "New SitGuru message",
  );
}

function getMessageSender(message: AnyRow) {
  return getText(
    message,
    ["sender_name", "from_name", "name", "customer_name", "pet_parent_name", "guru_name"],
    "SitGuru User",
  );
}

function getAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function getGrossBookingAmount(booking: AnyRow) {
  return getAmount(booking, [
    "subtotal_amount",
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount_paid",
    "amount",
    "price",
  ]);
}

function getPlatformFeeAmount(booking: AnyRow) {
  return getAmount(booking, [
    "marketplace_fee_amount",
    "trust_and_safety_fee_amount",
    "sitguru_fee_amount",
    "platform_fee_amount",
    "platform_fee",
    "service_fee",
    "admin_fee",
    "commission",
    "commission_amount",
  ]);
}

function getTipAmount(booking: AnyRow) {
  return getAmount(booking, ["tip_amount", "guru_tip_amount", "tip", "gratuity"]);
}

function getPayoutAmount(booking: AnyRow, gross: number, fee: number) {
  const explicitPayout = getAmount(booking, [
    "guru_net_amount",
    "guru_payout",
    "payout_amount",
    "provider_amount",
    "guru_amount",
  ]);

  if (explicitPayout > 0) return explicitPayout;

  if (gross > 0) {
    return Math.max(gross - fee, 0) + getTipAmount(booking);
  }

  return 0;
}

function hasAnyAmountField(rows: AnyRow[]) {
  return rows.some((row) =>
    [
      "subtotal_amount",
      "total_customer_paid",
      "total_amount",
      "booking_total",
      "amount_paid",
      "amount",
      "price",
      "platform_fee_amount",
      "service_fee",
      "commission_amount",
      "guru_payout",
      "payout_amount",
    ].some((key) => asNumber(row[key]) > 0),
  );
}

function safeCountValue(result: SafeCountResult | SafeRowsResult) {
  return typeof result.count === "number" ? result.count : 0;
}

async function safeRows(
  label: string,
  query: PromiseLike<{
    data: unknown;
    count?: number | null;
    error: { message?: string } | null;
  }>,
): Promise<SafeRowsResult> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin dashboard query skipped for ${label}:`, result.error);
      return {
        label,
        rows: [],
        count: null,
        ok: false,
        errorMessage: result.error.message || "Query failed",
      };
    }

    return {
      label,
      rows: Array.isArray(result.data) ? (result.data as AnyRow[]) : [],
      count: typeof result.count === "number" ? result.count : null,
      ok: true,
      errorMessage: "",
    };
  } catch (error) {
    console.warn(`Admin dashboard query skipped for ${label}:`, error);
    return {
      label,
      rows: [],
      count: null,
      ok: false,
      errorMessage: error instanceof Error ? error.message : "Query failed",
    };
  }
}

async function safeCount(
  label: string,
  query: PromiseLike<{
    count?: number | null;
    error: { message?: string } | null;
  }>,
): Promise<SafeCountResult> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin dashboard count skipped for ${label}:`, result.error);
      return {
        label,
        count: null,
        ok: false,
        errorMessage: result.error.message || "Count failed",
      };
    }

    return {
      label,
      count: typeof result.count === "number" ? result.count : null,
      ok: true,
      errorMessage: "",
    };
  } catch (error) {
    console.warn(`Admin dashboard count skipped for ${label}:`, error);
    return {
      label,
      count: null,
      ok: false,
      errorMessage: error instanceof Error ? error.message : "Count failed",
    };
  }
}

async function getAdminDashboardData() {
  const [
    profilesResult,
    petParentCountResult,
    gurusResult,
    ambassadorsResult,
    ambassadorLeadsResult,
    bookingsResult,
    messagesResult,
    launchSignupsResult,
    launchWaitlistResult,
    partnersResult,
    partnerApplicationsResult,
    partnerPayoutsResult,
    referralClicksResult,
    referralConversionsResult,
    referralRewardsResult,
    networkReferralsResult,
    networkRewardsResult,
    universityAssignmentsResult,
  ] = await Promise.all([
    safeRows(
      "profiles",
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeCount(
      "Pet Parent profiles",
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or(
          "role.ilike.%customer%,role.ilike.%parent%,role.ilike.%client%,role.eq.pet_parent",
        ),
    ),
    safeRows(
      "gurus",
      supabaseAdmin
        .from("gurus")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "ambassadors",
      supabaseAdmin
        .from("ambassadors")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "ambassador_leads",
      supabaseAdmin
        .from("ambassador_leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "bookings",
      supabaseAdmin
        .from("bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "messages",
      supabaseAdmin
        .from("messages")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "launch_signups",
      supabaseAdmin
        .from("launch_signups")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "launch_waitlist",
      supabaseAdmin
        .from("launch_waitlist")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "partners",
      supabaseAdmin
        .from("partners")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "partner_applications",
      supabaseAdmin
        .from("partner_applications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "partner_payouts",
      supabaseAdmin
        .from("partner_payouts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "referral_clicks",
      supabaseAdmin
        .from("referral_clicks")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "referral_conversions",
      supabaseAdmin
        .from("referral_conversions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "referral_rewards",
      supabaseAdmin
        .from("referral_rewards")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "network_referrals",
      supabaseAdmin
        .from("network_referrals")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "network_rewards",
      supabaseAdmin
        .from("network_rewards")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
    safeRows(
      "university_assignments",
      supabaseAdmin
        .from("university_assignments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000),
    ),
  ]);

  const profiles = profilesResult.rows;
  const gurus = gurusResult.rows;
  const ambassadors = ambassadorsResult.rows;
  const ambassadorLeads = ambassadorLeadsResult.rows;
  const bookings = bookingsResult.rows;
  const messages = messagesResult.rows;
  const partners = partnersResult.rows;
  const partnerApplications = partnerApplicationsResult.rows;
  const partnerPayouts = partnerPayoutsResult.rows;
  const referralClicks = referralClicksResult.rows;
  const referralConversions = referralConversionsResult.rows;
  const referralRewards = referralRewardsResult.rows;
  const networkReferrals = networkReferralsResult.rows;
  const networkRewards = networkRewardsResult.rows;
  const universityAssignments = universityAssignmentsResult.rows;

  const launchSignups = [
    ...launchSignupsResult.rows,
    ...launchWaitlistResult.rows,
  ];

  const profilePetParents = profiles.filter((profile) => {
    const role = getRole(profile);

    return (
      role.includes("customer") ||
      role.includes("parent") ||
      role.includes("client") ||
      role === "pet_parent"
    );
  });

  const petParentsLoadedCount = profilePetParents.length;
  const petParentExactCount =
    petParentCountResult.ok && petParentCountResult.count !== null
      ? petParentCountResult.count
      : petParentsLoadedCount;

  const incompletePetParents = profilePetParents.filter((profile) => {
    const hasName =
      Boolean(getText(profile, ["full_name", "display_name", "name"])) ||
      Boolean(getText(profile, ["first_name"])) ||
      Boolean(getText(profile, ["last_name"]));
    const hasEmail = Boolean(getText(profile, ["email"]));
    const hasCity = Boolean(getText(profile, ["city"]));
    const hasState = Boolean(
      getText(profile, ["state", "State", "state_code"]),
    );

    return !hasName || !hasEmail || !hasCity || !hasState;
  });

  const pendingGurus = gurus.filter((guru) => {
    const verified = guru.is_verified === true;
    const stripeComplete = guru.stripe_onboarding_complete === true;
    return !verified || !stripeComplete || isPendingStatus(guru);
  });

  const verifiedGurus = gurus.filter((guru) => guru.is_verified === true);

  const pendingAmbassadorItems = [
    ...ambassadorLeads.filter(isPendingStatus),
    ...partnerApplications.filter(isPendingStatus),
  ];

  const pendingBookings = bookings.filter(isPendingStatus);
  const activeBookings = bookings.filter(isActiveStatus);
  const unreadMessages = messages.filter(isUnreadMessage);

  const amountFieldsDetected = hasAnyAmountField(bookings);

  const bookingGross = amountFieldsDetected
    ? bookings.reduce((sum, booking) => sum + getGrossBookingAmount(booking), 0)
    : null;

  const platformFees = amountFieldsDetected
    ? bookings.reduce((sum, booking) => sum + getPlatformFeeAmount(booking), 0)
    : null;

  const tips = amountFieldsDetected
    ? bookings.reduce((sum, booking) => sum + getTipAmount(booking), 0)
    : null;

  const pendingPayouts = amountFieldsDetected
    ? bookings.reduce((sum, booking) => {
        const paymentStatus = asString(booking.payment_status).toLowerCase();
        const payoutStatus = asString(booking.payout_status).toLowerCase();
        const status = getStatus(booking);
        const gross = getGrossBookingAmount(booking);
        const fee = getPlatformFeeAmount(booking);

        const paidByPetParent =
          paymentStatus === "paid" ||
          status.includes("paid") ||
          status.includes("complete") ||
          status.includes("confirmed");

        if (paidByPetParent && payoutStatus !== "paid") {
          return sum + getPayoutAmount(booking, gross, fee);
        }

        return sum;
      }, 0)
    : null;

  const referralRewardAmount = [...referralRewards, ...networkRewards].reduce(
    (sum, reward) =>
      sum +
      getAmount(reward, [
        "amount",
        "reward_amount",
        "payout_amount",
        "total",
      ]),
    0,
  );

  const partnerPayoutAmount = partnerPayouts.reduce(
    (sum, payout) =>
      sum +
      getAmount(payout, [
        "amount",
        "payout_amount",
        "reward_amount",
        "total",
      ]),
    0,
  );

  const recentMessages = messages.slice(0, 5).map((message) => ({
    sender: getMessageSender(message),
    body: getMessageBody(message),
    time: getDate(message),
    avatar: getAvatar(message),
    unread: isUnreadMessage(message),
  }));

  const recentPeople = [
    ...profiles.slice(0, 4).map((row) => ({
      name: getDisplayName(row),
      detail: getRole(row) || "profile",
      avatar: getAvatar(row),
      href: adminRoutes.accounts,
    })),
    ...gurus.slice(0, 3).map((row) => ({
      name: getDisplayName(row, "Guru"),
      detail: "Guru",
      avatar: getAvatar(row),
      href: adminRoutes.gurus,
    })),
  ].slice(0, 6);

  const sourceStatus = [
    profilesResult,
    petParentCountResult,
    gurusResult,
    ambassadorsResult,
    ambassadorLeadsResult,
    bookingsResult,
    messagesResult,
    launchSignupsResult,
    launchWaitlistResult,
    partnersResult,
    partnerApplicationsResult,
    partnerPayoutsResult,
    referralClicksResult,
    referralConversionsResult,
    referralRewardsResult,
    networkReferralsResult,
    networkRewardsResult,
    universityAssignmentsResult,
  ];

  const connectedSources = sourceStatus.filter((source) => source.ok).length;
  const missingSources = sourceStatus.filter((source) => !source.ok);

  return {
    profiles,
    profilePetParents,
    gurus,
    ambassadors,
    ambassadorLeads,
    bookings,
    messages,
    partners,
    partnerApplications,
    partnerPayouts,
    referralClicks,
    referralConversions,
    referralRewards,
    networkReferrals,
    networkRewards,
    universityAssignments,
    launchSignups,
    counts: {
      totalProfiles: safeCountValue(profilesResult),
      petParents: petParentExactCount,
      gurus: safeCountValue(gurusResult),
      verifiedGurus: verifiedGurus.length,
      ambassadors:
        safeCountValue(ambassadorsResult) + safeCountValue(ambassadorLeadsResult),
      bookings: safeCountValue(bookingsResult),
      messages: safeCountValue(messagesResult),
      launchSignups:
        safeCountValue(launchSignupsResult) + safeCountValue(launchWaitlistResult),
      partners: safeCountValue(partnersResult),
      universityAssignments: safeCountValue(universityAssignmentsResult),
    },
    attention: {
      incompletePetParents,
      pendingGurus,
      pendingAmbassadorItems,
      pendingBookings,
      activeBookings,
      unreadMessages,
    },
    financials: {
      amountFieldsDetected,
      bookingGross,
      platformFees,
      tips,
      pendingPayouts,
      referralRewardAmount,
      partnerPayoutAmount,
    },
    recentMessages,
    recentPeople,
    sourceHealth: {
      connectedSources,
      totalSources: sourceStatus.length,
      missingSources,
      bookingsCapped:
        bookingsResult.count !== null && bookingsResult.count > bookings.length,
      profilesCapped:
        profilesResult.count !== null && profilesResult.count > profiles.length,
      messagesCapped:
        messagesResult.count !== null && messagesResult.count > messages.length,
    },
  };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getAdminDashboardData();

  const snapshotCards = [
    {
      title: "Pet Parents",
      value: number(data.counts.petParents),
      detail: `${number(data.attention.incompletePetParents.length)} missing basic profile info`,
      href: adminRoutes.petParents,
      icon: <Users size={22} />,
      tone: "green" as const,
      source: "profiles.role",
    },
    {
      title: "Gurus",
      value: number(data.counts.gurus),
      detail: `${number(data.attention.pendingGurus.length)} need review, Stripe, or verification`,
      href: adminRoutes.gurus,
      icon: <ShieldCheck size={22} />,
      tone: "emerald" as const,
      source: "gurus",
    },
    {
      title: "Ambassadors",
      value: number(data.counts.ambassadors),
      detail: `${number(data.attention.pendingAmbassadorItems.length)} pending leads/applications`,
      href: adminRoutes.ambassadorLeads,
      icon: <UserPlus size={22} />,
      tone: "orange" as const,
      source: "ambassadors + ambassador_leads",
    },
    {
      title: "Bookings",
      value: number(data.counts.bookings),
      detail: `${number(data.attention.pendingBookings.length)} pending, ${number(data.attention.activeBookings.length)} active`,
      href: adminRoutes.bookings,
      icon: <CalendarDays size={22} />,
      tone: "blue" as const,
      source: "bookings",
    },
    {
      title: "Messages",
      value: number(data.attention.unreadMessages.length),
      detail: `${number(data.counts.messages)} total loaded messages`,
      href: adminRoutes.messages,
      icon: <MessageCircle size={22} />,
      tone: "purple" as const,
      source: "messages",
    },
    {
      title: "Growth",
      value: number(data.counts.launchSignups),
      detail: `${number(data.referralClicks.length)} referral clicks, ${number(data.referralConversions.length)} conversions`,
      href: adminRoutes.referrals,
      icon: <Gift size={22} />,
      tone: "pink" as const,
      source: "launch + referral tables",
    },
  ];

  const financialCards = [
    {
      title: "Booking Gross",
      value: data.financials.amountFieldsDetected
        ? money(data.financials.bookingGross)
        : "Needs source",
      detail: data.financials.amountFieldsDetected
        ? "Calculated from loaded booking amount fields"
        : "No verified booking amount field detected",
      href: adminRoutes.financials,
      icon: <CircleDollarSign size={20} />,
    },
    {
      title: "Platform Fees",
      value: data.financials.amountFieldsDetected
        ? money(data.financials.platformFees)
        : "Needs source",
      detail: data.financials.amountFieldsDetected
        ? "Only explicit fee fields are counted"
        : "Wire a verified fee/payment source",
      href: adminRoutes.profitLoss,
      icon: <BarChart3 size={20} />,
    },
    {
      title: "Tips",
      value: data.financials.amountFieldsDetected
        ? money(data.financials.tips)
        : "Needs source",
      detail: data.financials.amountFieldsDetected
        ? "Tip fields only; no estimate used"
        : "No verified tip field detected",
      href: adminRoutes.commissions,
      icon: <Gift size={20} />,
    },
    {
      title: "Pending Payouts",
      value: data.financials.amountFieldsDetected
        ? money(data.financials.pendingPayouts)
        : "Needs source",
      detail: data.financials.amountFieldsDetected
        ? "Paid bookings not marked paid out"
        : "Wire payout/payment status fields",
      href: adminRoutes.commissions,
      icon: <WalletCards size={20} />,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-green-100 bg-gradient-to-br from-[#f7fbf4] via-white to-[#eef8ed] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-green-900 shadow-sm">
              <Database size={15} />
              Accuracy-first dashboard
            </div>

            <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl 2xl:text-[3.25rem] 2xl:leading-none">
              SitGuru Admin Snapshot
            </h1>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              A cleaner business overview for Pet Parents, Gurus, Ambassadors,
              bookings, messages, growth, University, and financial readiness.
              Metrics are either pulled from Supabase or clearly marked when a
              source still needs wiring.
            </p>
          </div>

          <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroAction href={adminRoutes.messages} icon={<MessageCircle />} label="Messages" />
            <HeroAction href={adminRoutes.gurus} icon={<ShieldCheck />} label="Review Gurus" />
            <HeroAction href={adminRoutes.petParents} icon={<Users />} label="Pet Parents" />
            <HeroAction href={adminRoutes.newBooking} icon={<Plus />} label="New Booking" primary />
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataHealthTile
          label="Connected Sources"
          value={`${number(data.sourceHealth.connectedSources)} / ${number(data.sourceHealth.totalSources)}`}
          status={data.sourceHealth.missingSources.length ? "Review needed" : "Healthy"}
          healthy={!data.sourceHealth.missingSources.length}
        />
        <DataHealthTile
          label="Profiles Loaded"
          value={number(data.profiles.length)}
          status={data.sourceHealth.profilesCapped ? "Sample capped at 1,000" : "Loaded"}
          healthy={!data.sourceHealth.profilesCapped}
        />
        <DataHealthTile
          label="Bookings Loaded"
          value={number(data.bookings.length)}
          status={data.sourceHealth.bookingsCapped ? "Sample capped at 1,000" : "Loaded"}
          healthy={!data.sourceHealth.bookingsCapped}
        />
        <DataHealthTile
          label="Financial Mode"
          value={data.financials.amountFieldsDetected ? "Detected" : "Needs wiring"}
          status={data.financials.amountFieldsDetected ? "No estimates used" : "No fake estimates"}
          healthy={data.financials.amountFieldsDetected}
        />
      </section>

      {data.sourceHealth.missingSources.length ? (
        <DashboardCard>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <AlertTriangle size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-950">
                Data sources needing review
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                These tables or views did not return cleanly. The dashboard will
                not pretend they are zero. It will keep the source honest until
                the table exists or the query is corrected.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.sourceHealth.missingSources.slice(0, 6).map((source) => (
                  <div
                    key={source.label}
                    className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3"
                  >
                    <p className="text-sm font-black text-orange-950">
                      {source.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-orange-800/80">
                      {source.errorMessage || "Query needs review"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>
      ) : null}

      <section className="grid w-full min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {snapshotCards.map((card) => (
          <SnapshotCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <DashboardCard>
            <SectionHeader
              icon={<AlertTriangle size={20} />}
              title="Needs Attention"
              subtitle="Action items pulled from current Supabase rows. No hidden estimates."
              href={adminRoutes.accounts}
              linkLabel="Open lifecycle"
            />

            <div className="mt-5 grid gap-3">
              <AttentionRow
                href={adminRoutes.petParents}
                title="Pet Parents missing basic profile info"
                value={number(data.attention.incompletePetParents.length)}
                detail="Checks name, email, city, and state from profile rows"
              />
              <AttentionRow
                href={adminRoutes.gurus}
                title="Gurus needing review"
                value={number(data.attention.pendingGurus.length)}
                detail="Verification, pending status, or Stripe setup"
              />
              <AttentionRow
                href={adminRoutes.ambassadorLeads}
                title="Ambassador / partner items pending"
                value={number(data.attention.pendingAmbassadorItems.length)}
                detail="Lead and application rows with pending-style statuses"
              />
              <AttentionRow
                href={adminRoutes.bookings}
                title="Bookings pending"
                value={number(data.attention.pendingBookings.length)}
                detail="Booking rows with new, pending, review, or submitted status"
              />
              <AttentionRow
                href={adminRoutes.messages}
                title="Unread messages"
                value={number(data.attention.unreadMessages.length)}
                detail="Unread flags, missing read_at, or non-read status"
              />
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              icon={<CircleDollarSign size={20} />}
              title="Financial Snapshot"
              subtitle="Financial cards show verified fields only. No estimated profit or expense math."
              href={adminRoutes.financials}
              linkLabel="Open financials"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {financialCards.map((card) => (
                <FinancialRow key={card.title} {...card} />
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-3">
          <DashboardCard>
            <SectionHeader
              icon={<MessageCircle size={20} />}
              title="Recent Messages"
              subtitle="Latest loaded conversations."
              href={adminRoutes.messages}
              linkLabel="View all"
            />

            <div className="mt-5 space-y-3">
              {data.recentMessages.length ? (
                data.recentMessages.map((message, index) => (
                  <Link
                    href={adminRoutes.messages}
                    key={`${message.sender}-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-3 transition hover:border-green-200 hover:bg-green-50"
                  >
                    <Avatar name={message.sender} src={message.avatar} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-slate-950">
                          {message.sender}
                        </p>
                        {message.unread ? (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                        {message.body}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  icon={<MessageCircle size={22} />}
                  title="No recent messages"
                  detail="Messages will appear here once conversations are created."
                />
              )}
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              icon={<Users size={20} />}
              title="People Snapshot"
              subtitle="Pet Parents, Gurus, Ambassadors, partners, and recent profiles."
              href={adminRoutes.accounts}
              linkLabel="Open accounts"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label="Total Profiles"
                value={number(data.counts.totalProfiles)}
                href={adminRoutes.accounts}
              />
              <MiniMetric
                label="Pet Parents"
                value={number(data.counts.petParents)}
                href={adminRoutes.petParents}
              />
              <MiniMetric
                label="Verified Gurus"
                value={number(data.counts.verifiedGurus)}
                href={adminRoutes.gurus}
              />
              <MiniMetric
                label="Partners"
                value={number(data.counts.partners)}
                href={adminRoutes.partners}
              />
            </div>

            <div className="mt-5 space-y-3">
              {data.recentPeople.length ? (
                data.recentPeople.map((person, index) => (
                  <Link
                    href={person.href}
                    key={`${person.name}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-3 transition hover:border-green-200 hover:bg-green-50"
                  >
                    <Avatar name={person.name} src={person.avatar} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {person.name}
                      </p>
                      <p className="truncate text-xs font-bold text-slate-500">
                        {person.detail || "Profile"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  icon={<Users size={22} />}
                  title="No recent profiles"
                  detail="Profile rows will appear here once available."
                />
              )}
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              icon={<Gift size={20} />}
              title="Growth & Referrals"
              subtitle="Launch, PawPerks, referral, partner, and reward activity."
              href={adminRoutes.referrals}
              linkLabel="Open growth"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label="Launch Signups"
                value={number(data.counts.launchSignups)}
                href={adminRoutes.launchSignups}
              />
              <MiniMetric
                label="Referral Clicks"
                value={number(data.referralClicks.length)}
                href={adminRoutes.referrals}
              />
              <MiniMetric
                label="Conversions"
                value={number(
                  data.referralConversions.length + data.networkReferrals.length,
                )}
                href={adminRoutes.referrals}
              />
              <MiniMetric
                label="Rewards"
                value={money(data.financials.referralRewardAmount)}
                href={adminRoutes.partnerRewards}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AdminLinkRow
                href={adminRoutes.referrals}
                icon={<Gift size={18} />}
                title="Growth & Referrals"
                detail="PawPerks, referrals, campaigns, and rewards"
              />
              <AdminLinkRow
                href={adminRoutes.partners}
                icon={<BriefcaseBusiness size={18} />}
                title="Partner Admin"
                detail="Partners, affiliates, and community growth"
              />
              <AdminLinkRow
                href={adminRoutes.partnerCampaigns}
                icon={<MousePointerClick size={18} />}
                title="Campaigns"
                detail="Track links, clicks, and campaign activity"
              />
              <AdminLinkRow
                href={adminRoutes.partnerPayouts}
                icon={<WalletCards size={18} />}
                title="Partner Payouts"
                detail={`${money(data.financials.partnerPayoutAmount)} currently loaded`}
              />
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              icon={<GraduationCap size={20} />}
              title="SitGuru University"
              subtitle="Training and academy visibility without taking over the dashboard."
              href={adminRoutes.universityTraining}
              linkLabel="Open University"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label="Assignments"
                value={number(data.counts.universityAssignments)}
                href={adminRoutes.universityAssignments}
              />
              <MiniMetric
                label="Guru Records"
                value={number(data.counts.gurus)}
                href={adminRoutes.gurus}
              />
              <MiniMetric
                label="Ambassador Leads"
                value={number(data.ambassadorLeads.length)}
                href={adminRoutes.ambassadorLeads}
              />
              <MiniMetric
                label="Pet Parents"
                value={number(data.counts.petParents)}
                href={adminRoutes.petParents}
              />
            </div>

            <div className="mt-5 grid gap-3">
              <AdminLinkRow
                href={adminRoutes.universityTraining}
                icon={<GraduationCap size={18} />}
                title="Training Manager"
                detail="Academies, lessons, videos, and materials"
              />
              <AdminLinkRow
                href={adminRoutes.universityAssignments}
                icon={<FileBarChart size={18} />}
                title="Academy Assignments"
                detail="Assign academies to Pet Parents, Gurus, and Ambassadors"
              />
              <AdminLinkRow
                href={adminRoutes.hr}
                icon={<UserPlus size={18} />}
                title="HR Onboarding"
                detail="Use HR for applicant and onboarding workflow"
              />
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="w-full min-w-0">
        <AccountLifecycleRollupCard />
      </section>

      <DashboardCard>
        <SectionHeader
          icon={<Settings size={20} />}
          title="Admin Tools"
          subtitle="Fast access to the deeper admin areas."
          href={adminRoutes.dashboard}
          linkLabel="Dashboard"
        />

        <div className="mt-5 grid w-full min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          <QuickAction href={adminRoutes.accounts} icon={<ShieldCheck />} label="Lifecycle" />
          <QuickAction href={adminRoutes.newBooking} icon={<CalendarDays />} label="New Booking" />
          <QuickAction href={adminRoutes.hr} icon={<UserPlus />} label="HR" />
          <QuickAction href={adminRoutes.universityTraining} icon={<GraduationCap />} label="University" />
          <QuickAction href={adminRoutes.newPetParent} icon={<Users />} label="Add Pet Parent" />
          <QuickAction href={adminRoutes.messages} icon={<MessageCircle />} label="Messages" />
          <QuickAction href={adminRoutes.guruPerformance} icon={<BarChart3 />} label="Guru Financials" />
          <QuickAction href={adminRoutes.stripeTransactions} icon={<WalletCards />} label="Stripe" />
          <QuickAction href={adminRoutes.reports} icon={<FileBarChart />} label="Reports" />
          <QuickAction href={adminRoutes.exports} icon={<Download />} label="Exports" />
        </div>
      </DashboardCard>
    </div>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function HeroAction({
  href,
  icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
          : "inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
      }
    >
      <span className="h-4 w-4">{icon}</span>
      {label}
    </Link>
  );
}

function DataHealthTile({
  label,
  value,
  status,
  healthy,
}: {
  label: string;
  value: string;
  status: string;
  healthy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-black text-green-950">{value}</p>
        </div>

        <span
          className={
            healthy
              ? "rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-800"
              : "rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-800"
          }
        >
          {healthy ? "OK" : "Check"}
        </span>
      </div>

      <p className="mt-2 text-xs font-bold text-slate-500">{status}</p>
    </div>
  );
}

function SnapshotCard({
  title,
  value,
  detail,
  href,
  icon,
  tone,
  source,
}: {
  title: string;
  value: string;
  detail: string;
  href: string;
  icon: ReactNode;
  tone: "green" | "emerald" | "orange" | "blue" | "purple" | "pink";
  source: string;
}) {
  const tones = {
    green: "bg-green-50 text-green-800",
    emerald: "bg-emerald-50 text-emerald-800",
    orange: "bg-orange-50 text-orange-800",
    blue: "bg-sky-50 text-sky-800",
    purple: "bg-violet-50 text-violet-800",
    pink: "bg-pink-50 text-pink-800",
  };

  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </div>

        <span className="rounded-full bg-[#f7faf6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          Live
        </span>
      </div>

      <p className="text-sm font-black text-slate-700">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-500">
        {detail}
      </p>

      <div className="mt-4 border-t border-[#edf3ee] pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Source
        </p>
        <p className="mt-1 truncate text-xs font-bold text-slate-500">{source}</p>
      </div>

      <p className="mt-4 text-sm font-black text-green-800">
        View details <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <Link href={href} className="shrink-0 text-sm font-black text-green-800">
        {linkLabel}
      </Link>
    </div>
  );
}

function AttentionRow({
  href,
  title,
  value,
  detail,
}: {
  href: string;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          {detail}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="text-2xl font-black text-green-900">{value}</p>
        <span className="text-sm font-black text-green-800 transition group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}

function FinancialRow({
  href,
  title,
  value,
  detail,
  icon,
}: {
  href: string;
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          {detail}
        </p>
      </div>
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
    </Link>
  );
}

function AdminLinkRow({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#eef4ef] bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{title}</p>
        <p className="truncate text-xs font-bold text-slate-500">{detail}</p>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-center transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <span className="text-xs font-black leading-tight text-slate-700">
        {label}
      </span>
    </Link>
  );
}

function Avatar({
  name,
  src,
  className = "h-10 w-10",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
        src={src}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800`}
    >
      {getInitials(name) || "SG"}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7faf6] p-5 text-center">
      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-black text-slate-700">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}