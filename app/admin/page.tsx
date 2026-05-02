import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileBarChart,
  Gift,
  Link2,
  MessageCircle,
  MousePointerClick,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

const adminRoutes = {
  dashboard: "/admin",
  bookings: "/admin/bookings",
  newBooking: "/admin/bookings/new",
  customers: "/admin/customers",
  newCustomer: "/admin/customers/new",
  gurus: "/admin/gurus",
  newGuru: "/admin/gurus/new",
  messages: "/admin/messages",
  settings: "/admin/settings",
  financials: "/admin/financials",
  profitLoss: "/admin/financials/profit-loss",
  commissions: "/admin/commissions",
  exports: "/admin/exports",
  reports: "/admin/exports",
  activity: "/admin/activity",
  launchSignups: "/admin/launch-signups",
  programs: "/admin/programs",
  partners: "/admin/partners",
  partnerApplications: "/admin/partners/applications",
  activePartners: "/admin/partners/active",
  partnerAmbassadors: "/admin/partners/ambassadors",
  partnerAffiliates: "/admin/partners/affiliates",
  partnerCampaigns: "/admin/partners/campaigns",
  partnerRewards: "/admin/partners/rewards",
  partnerPayouts: "/admin/partners/payouts",
  partnerMessages: "/admin/partners/messages",
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

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function percent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
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

function formatMessageTime(value?: string | null) {
  if (!value) return "now";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "now";

  const diff = Date.now() - parsed.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function sumAmounts(rows: AnyRow[], keys: string[]) {
  return rows.reduce((sum, row) => sum + getAmount(row, keys), 0);
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

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

function calcChange(current: number, previous: number) {
  if (!current && !previous) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
}

function getGrossAmount(booking: AnyRow) {
  return getAmount(booking, [
    "subtotal_amount",
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount_paid",
    "amount",
    "price",
    "hourly_rate",
  ]);
}

function getFeeAmount(booking: AnyRow, gross: number) {
  const explicitFee = getAmount(booking, [
    "sitguru_fee_amount",
    "platform_fee",
    "service_fee",
    "admin_fee",
    "commission",
    "commission_amount",
  ]);

  return explicitFee > 0 ? explicitFee : gross * 0.08;
}

function getTaxAmount(booking: AnyRow) {
  return getAmount(booking, [
    "sales_tax_amount",
    "tax_amount",
    "tax",
    "sales_tax",
    "taxes_collected",
  ]);
}

function getNetGuruAmount(booking: AnyRow, gross: number, fee: number) {
  const explicitNet = getAmount(booking, [
    "guru_net_amount",
    "guru_payout",
    "payout_amount",
    "provider_amount",
    "guru_amount",
  ]);

  return explicitNet > 0 ? explicitNet : Math.max(gross - fee, 0);
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "payment_status", "booking_status", "payout_status"],
    "pending",
  ).toLowerCase();
}

function isActiveStatus(row: AnyRow) {
  const status = getStatus(row);
  return (
    status === "active" ||
    status === "approved" ||
    status === "live" ||
    status === "enabled"
  );
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

function isConvertedStatus(row: AnyRow) {
  const status = getStatus(row);
  return (
    status === "converted" ||
    status === "approved" ||
    status === "booked" ||
    status === "paid" ||
    status === "completed" ||
    status === "active"
  );
}

function getRole(row: AnyRow) {
  return getText(
    row,
    ["role", "user_role", "account_type", "type", "segment"],
    "",
  ).toLowerCase();
}

function getParticipantType(row: AnyRow) {
  return getText(
    row,
    ["participant_type", "partner_type", "program_type", "type", "role"],
    "",
  ).toLowerCase();
}

function getDisplayName(row: AnyRow, fallback = "User") {
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
      "guru_name",
      "sitter_name",
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

function getGuruId(booking: AnyRow) {
  return getText(booking, ["guru_id", "sitter_id", "provider_id"], "unknown");
}

function getCustomerId(booking: AnyRow) {
  return getText(
    booking,
    ["customer_id", "pet_owner_id", "client_id", "user_id"],
    "unknown",
  );
}

function getGuruNameFromBooking(booking: AnyRow) {
  return getText(
    booking,
    ["guru_name", "sitter_name", "provider_name"],
    "Guru",
  );
}

function getCustomerNameFromBooking(booking: AnyRow) {
  return getText(
    booking,
    ["customer_name", "pet_parent_name", "owner_name", "customer_email"],
    "Customer",
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
    ["sender_name", "from_name", "name", "customer_name", "guru_name"],
    "SitGuru User",
  );
}

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin dashboard query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin dashboard query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function mergeRows(...groups: AnyRow[][]) {
  const merged: AnyRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const key =
        getText(row, ["id", "email", "user_id", "created_at"]) ||
        `${merged.length}`;

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(row);
    }
  }

  return merged;
}

async function getAdminDashboardData() {
  const [
    bookingsResult,
    gurusResult,
    profilesResult,
    launchSignupsResult,
    launchWaitlistResult,
    messagesResult,
    programsResult,
    partnersResult,
    networkProgramsResult,
    networkParticipantsResult,
    networkReferralsResult,
    networkRewardsResult,
    networkPartnerLeadsResult,
    networkClickEventsResult,
    partnerApplicationsResult,
    referralClickEventsResult,
    referralConversionsResult,
    referralRewardsResult,
    partnerPayoutsResult,
    partnerMessagesResult,
    ambassadorsResult,
    affiliatesResult,
    partnerCampaignsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin.from("bookings").select("*").limit(1000),
      "bookings",
    ),
    safeAdminQuery(
      supabaseAdmin.from("gurus").select("*").limit(1000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin.from("profiles").select("*").limit(1000),
      "profiles",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "messages",
    ),
    safeAdminQuery(
      supabaseAdmin.from("programs").select("*").limit(500),
      "programs",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partners").select("*").limit(500),
      "partners",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_programs").select("*").limit(500),
      "network_programs",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_program_participants").select("*").limit(1000),
      "network_program_participants",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_referrals").select("*").limit(1000),
      "network_referrals",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_rewards").select("*").limit(1000),
      "network_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_partner_leads").select("*").limit(1000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_click_events").select("*").limit(1000),
      "network_click_events",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_applications").select("*").limit(1000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_clicks").select("*").limit(1000),
      "referral_clicks",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_conversions").select("*").limit(1000),
      "referral_conversions",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_rewards").select("*").limit(1000),
      "referral_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_payouts").select("*").limit(1000),
      "partner_payouts",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_messages").select("*").limit(1000),
      "partner_messages",
    ),
    safeAdminQuery(
      supabaseAdmin.from("ambassadors").select("*").limit(1000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin.from("affiliates").select("*").limit(1000),
      "affiliates",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_campaigns").select("*").limit(1000),
      "partner_campaigns",
    ),
  ]);

  const bookings = ((bookingsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawGurus = ((gurusResult.data || []) as AnyRow[]).filter(Boolean);
  const profiles = ((profilesResult.data || []) as AnyRow[]).filter(Boolean);
  const messages = ((messagesResult.data || []) as AnyRow[]).filter(Boolean);
  const programs = ((programsResult.data || []) as AnyRow[]).filter(Boolean);
  const partners = ((partnersResult.data || []) as AnyRow[]).filter(Boolean);

  const networkPrograms = ((networkProgramsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkParticipants = ((networkParticipantsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkReferrals = ((networkReferralsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkRewards = ((networkRewardsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPartnerLeads = ((networkPartnerLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkClickEvents = ((networkClickEventsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerApplications = ((partnerApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const referralClickEvents = ((referralClickEventsResult.data || []) as AnyRow[]).filter(Boolean);
  const referralConversions = ((referralConversionsResult.data || []) as AnyRow[]).filter(Boolean);
  const referralRewards = ((referralRewardsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerPayouts = ((partnerPayoutsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerMessages = ((partnerMessagesResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).filter(Boolean);
  const affiliates = ((affiliatesResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerCampaigns = ((partnerCampaignsResult.data || []) as AnyRow[]).filter(Boolean);

  const launchSignups = mergeRows(
    ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean),
    ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean),
  );

  const profileGurus = profiles.filter((profile) => {
    const role = getRole(profile);
    return (
      role.includes("guru") ||
      role.includes("sitter") ||
      role.includes("provider")
    );
  });

  const profileCustomers = profiles.filter((profile) => {
    const role = getRole(profile);
    return (
      role.includes("customer") ||
      role.includes("parent") ||
      role.includes("client")
    );
  });

  const gurus = rawGurus.length ? rawGurus : profileGurus;

  const grossRevenue = bookings.reduce(
    (sum, booking) => sum + getGrossAmount(booking),
    0,
  );

  const netPlatformRevenue = bookings.reduce((sum, booking) => {
    const gross = getGrossAmount(booking);
    return sum + getFeeAmount(booking, gross);
  }, 0);

  const taxesCollected = bookings.reduce(
    (sum, booking) => sum + getTaxAmount(booking),
    0,
  );

  const pendingPayouts = bookings.reduce((sum, booking) => {
    const paymentStatus = asString(booking.payment_status).toLowerCase();
    const payoutStatus = asString(booking.payout_status).toLowerCase();
    const status = getStatus(booking);
    const gross = getGrossAmount(booking);
    const fee = getFeeAmount(booking, gross);

    const shouldCount =
      paymentStatus === "paid" ||
      status.includes("paid") ||
      status.includes("complete") ||
      status.includes("confirmed");

    if (shouldCount && payoutStatus !== "paid") {
      return sum + getNetGuruAmount(booking, gross, fee);
    }

    return sum;
  }, 0);

  const currentRevenue = bookings
    .filter((booking) => isWithinLastDays(getDate(booking), 30))
    .reduce((sum, booking) => sum + getGrossAmount(booking), 0);

  const previousRevenue = bookings
    .filter((booking) => {
      const dateValue = getDate(booking);
      if (!dateValue) return false;

      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) return false;

      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - 60);

      const end = new Date();
      end.setDate(now.getDate() - 30);

      return parsed >= start && parsed < end;
    })
    .reduce((sum, booking) => sum + getGrossAmount(booking), 0);

  const revenueChange = calcChange(currentRevenue, previousRevenue);
  const platformTakeRate =
    grossRevenue > 0 ? (netPlatformRevenue / grossRevenue) * 100 : 0;

  const unreadMessages = messages.filter(isUnreadMessage).length;

  const sourceCounts = launchSignups.reduce<Record<string, number>>(
    (acc, signup) => {
      const rawSource = getText(
        signup,
        ["source", "utm_source", "signup_source"],
        "direct",
      ).toLowerCase();

      const source = rawSource.includes("insta")
        ? "Instagram"
        : rawSource.includes("facebook") || rawSource.includes("meta")
          ? "Facebook"
          : rawSource.includes("tiktok")
            ? "TikTok"
            : rawSource.includes("referral") || rawSource.includes("email")
              ? "Referral / Email"
              : "Direct";

      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {},
  );

  const signupSources = [
    {
      name: "Instagram",
      value: sourceCounts["Instagram"] || 0,
      color: "bg-pink-500",
    },
    {
      name: "Direct",
      value: sourceCounts["Direct"] || 0,
      color: "bg-emerald-600",
    },
    {
      name: "Facebook",
      value: sourceCounts["Facebook"] || 0,
      color: "bg-blue-500",
    },
    {
      name: "TikTok",
      value: sourceCounts["TikTok"] || 0,
      color: "bg-slate-800",
    },
    {
      name: "Referral / Email",
      value: sourceCounts["Referral / Email"] || 0,
      color: "bg-orange-400",
    },
  ];

  const signupTotal = signupSources.reduce(
    (sum, source) => sum + source.value,
    0,
  );

  const guruIncomeMap = new Map<
    string,
    {
      name: string;
      avatar: string;
      rating: number;
      earnings: number;
      bookings: number;
      city: string;
    }
  >();

  for (const guru of gurus) {
    const id = getText(guru, ["id", "user_id", "profile_id"], "");
    if (!id) continue;

    guruIncomeMap.set(id, {
      name: getDisplayName(guru, "Guru"),
      avatar: getAvatar(guru),
      rating:
        getAmount(guru, ["rating", "average_rating", "review_rating"]) || 4.9,
      earnings: getAmount(guru, ["earnings", "total_earnings"]),
      bookings: getAmount(guru, [
        "bookings",
        "booking_count",
        "completed_bookings",
      ]),
      city: getText(guru, ["city", "service_city", "location"], "—"),
    });
  }

  for (const booking of bookings) {
    const guruId = getGuruId(booking);
    const gross = getGrossAmount(booking);
    const fee = getFeeAmount(booking, gross);
    const net = getNetGuruAmount(booking, gross, fee);

    const existing =
      guruIncomeMap.get(guruId) ||
      {
        name: getGuruNameFromBooking(booking),
        avatar: "",
        rating: 4.9,
        earnings: 0,
        bookings: 0,
        city:
          [asString(booking.city), asString(booking.state)]
            .filter(Boolean)
            .join(", ") || "—",
      };

    existing.earnings += net;
    existing.bookings += 1;

    if (!existing.city || existing.city === "—") {
      existing.city =
        [asString(booking.city), asString(booking.state)]
          .filter(Boolean)
          .join(", ") || "—";
    }

    guruIncomeMap.set(guruId, existing);
  }

  const topGurus = Array.from(guruIncomeMap.values())
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 4);

  const customerSpendMap = new Map<
    string,
    {
      name: string;
      avatar: string;
      spend: number;
      bookings: number;
      lastBooking: string | null;
    }
  >();

  for (const customer of profileCustomers) {
    const id = getText(customer, ["id", "user_id", "profile_id"], "");
    if (!id) continue;

    customerSpendMap.set(id, {
      name: getDisplayName(customer, "Customer"),
      avatar: getAvatar(customer),
      spend: getAmount(customer, ["total_spend", "lifetime_spend"]),
      bookings: getAmount(customer, ["bookings", "booking_count"]),
      lastBooking: getDate(customer),
    });
  }

  for (const booking of bookings) {
    const customerId = getCustomerId(booking);

    const existing =
      customerSpendMap.get(customerId) ||
      {
        name: getCustomerNameFromBooking(booking),
        avatar: "",
        spend: 0,
        bookings: 0,
        lastBooking: null,
      };

    existing.spend +=
      getAmount(booking, ["total_customer_paid", "total_amount", "amount"]) ||
      getGrossAmount(booking);
    existing.bookings += 1;

    const bookingDate = getDate(booking);
    if (
      bookingDate &&
      (!existing.lastBooking ||
        new Date(bookingDate).getTime() >
          new Date(existing.lastBooking).getTime())
    ) {
      existing.lastBooking = bookingDate;
    }

    customerSpendMap.set(customerId, existing);
  }

  const topCustomers = Array.from(customerSpendMap.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 4);

  const recentMessages = messages.slice(0, 5).map((message) => ({
    sender: getMessageSender(message),
    body: getMessageBody(message),
    time: getDate(message),
    avatar: getAvatar(message),
    unread: isUnreadMessage(message),
  }));

  const activeNetworkPrograms =
    networkPrograms.filter(isActiveStatus).length ||
    programs.filter((program) => {
      const text = `${getText(program, ["name", "title"])} ${getText(
        program,
        ["type", "program_type"],
      )}`.toLowerCase();

      return (
        isActiveStatus(program) &&
        (text.includes("partner") ||
          text.includes("affiliate") ||
          text.includes("ambassador") ||
          text.includes("referral"))
      );
    }).length;

  const activeNetworkParticipants = networkParticipants.filter(isActiveStatus);

  const activePartnerRows = mergeRows(
    partners.filter(isActiveStatus),
    networkParticipants.filter((row) => {
      const type = getParticipantType(row);
      return (
        isActiveStatus(row) &&
        (type.includes("partner") ||
          type.includes("business") ||
          type.includes("rescue") ||
          type.includes("shelter") ||
          type.includes("vet"))
      );
    }),
  );

  const ambassadorRows = mergeRows(
    ambassadors,
    networkParticipants.filter((row) => getParticipantType(row).includes("ambassador")),
  );

  const affiliateRows = mergeRows(
    affiliates,
    networkParticipants.filter((row) => getParticipantType(row).includes("affiliate")),
  );

  const pendingApplications = partnerApplications.filter(isPendingStatus);
  const pendingPartnerLeads = networkPartnerLeads.filter(isPendingStatus);
  const convertedReferrals = networkReferrals.filter(isConvertedStatus);

  const pendingNetworkRewards = networkRewards.filter(isPendingStatus);
  const pendingReferralRewards = referralRewards.filter(isPendingStatus);
  const pendingPartnerPayouts = partnerPayouts.filter(isPendingStatus);

  const pendingRewardsAmount =
    sumAmounts(pendingNetworkRewards, ["amount", "reward_amount", "payout_amount"]) +
    sumAmounts(pendingReferralRewards, ["amount", "reward_amount", "payout_amount"]);

  const pendingPartnerPayoutAmount = sumAmounts(pendingPartnerPayouts, [
    "amount",
    "payout_amount",
    "reward_amount",
    "total",
  ]);

  const totalNetworkClicks = networkClickEvents.length + referralClickEvents.length;

  const campaignNames = new Set<string>();

  for (const row of [...networkClickEvents, ...referralClickEvents, ...partnerCampaigns]) {
    const campaign = getText(row, ["campaign", "campaign_name", "utm_campaign", "name", "title"]);
    if (campaign) campaignNames.add(campaign);
  }

  const partnerUnreadMessages = partnerMessages.filter(isUnreadMessage).length;

  return {
    bookings,
    profiles,
    gurus,
    messages,
    programs,
    partners,
    launchSignups,
    grossRevenue,
    netPlatformRevenue,
    taxesCollected,
    pendingPayouts,
    revenueChange,
    platformTakeRate,
    unreadMessages,
    signupSources,
    signupTotal,
    topGurus,
    topCustomers,
    recentMessages,
    networkMetrics: {
      activePrograms: activeNetworkPrograms,
      activeParticipants: activeNetworkParticipants.length,
      applications: pendingApplications.length,
      activePartners: activePartnerRows.length,
      ambassadors: ambassadorRows.length,
      affiliates: affiliateRows.length,
      partnerLeads: pendingPartnerLeads.length,
      referrals: networkReferrals.length + referralConversions.length,
      conversions: convertedReferrals.length + referralConversions.length,
      clicks: totalNetworkClicks,
      campaigns: partnerCampaigns.length || campaignNames.size,
      pendingRewardsAmount,
      pendingRewardsCount: pendingNetworkRewards.length + pendingReferralRewards.length,
      pendingPayoutAmount: pendingPartnerPayoutAmount,
      pendingPayoutCount: pendingPartnerPayouts.length,
      unreadPartnerMessages: partnerUnreadMessages,
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

  const totalBookings = data.bookings.length;
  const cashPosition = Math.max(
    data.netPlatformRevenue + data.taxesCollected - data.pendingPayouts,
    0,
  );
  const expenseTotal = data.grossRevenue * 0.57;
  const netProfit = Math.max(data.netPlatformRevenue - expenseTotal * 0.08, 0);
  const revenueTarget = data.grossRevenue > 0 ? data.grossRevenue * 1.22 : 1;
  const revenueTargetPercent =
    data.grossRevenue > 0
      ? Math.round((data.grossRevenue / revenueTarget) * 100)
      : 0;
  const expensePercent =
    data.grossRevenue > 0
      ? Math.round((expenseTotal / data.grossRevenue) * 100)
      : 0;
  const netProfitPercent =
    data.grossRevenue > 0
      ? Math.round((netProfit / data.grossRevenue) * 100)
      : 0;

  const metrics = [
    {
      title: "Gross Revenue",
      value: money(data.grossRevenue),
      change: `${Math.abs(data.revenueChange).toFixed(1)}%`,
      trend: data.revenueChange >= 0 ? "up" : "down",
      icon: <CircleDollarSign size={22} />,
      href: adminRoutes.financials,
      action: "View financials",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Net Platform Revenue",
      value: money(data.netPlatformRevenue),
      change: percent(data.platformTakeRate),
      trend: "up",
      icon: <BarChart3 size={22} />,
      href: adminRoutes.profitLoss,
      action: "View financials",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Pending Payouts",
      value: money(data.pendingPayouts),
      change: data.pendingPayouts > 0 ? "Needs review" : "Clear",
      trend: data.pendingPayouts > 0 ? "down" : "up",
      icon: <WalletCards size={22} />,
      href: adminRoutes.commissions,
      action: "View payouts",
      iconBg: "bg-orange-100 text-orange-700",
    },
    {
      title: "Taxes Collected",
      value: money(data.taxesCollected),
      change:
        data.grossRevenue > 0
          ? percent((data.taxesCollected / data.grossRevenue) * 100)
          : "0.0%",
      trend: "up",
      icon: <ReceiptText size={22} />,
      href: adminRoutes.financials,
      action: "View financials",
      iconBg: "bg-sky-100 text-sky-700",
    },
    {
      title: "Total Bookings",
      value: number(totalBookings),
      change: `${
        data.bookings.filter((booking) => isWithinLastDays(getDate(booking), 30))
          .length
      } this month`,
      trend: "up",
      icon: <CalendarDays size={22} />,
      href: adminRoutes.bookings,
      action: "View bookings",
      iconBg: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl 2xl:text-[3.6rem] 2xl:leading-none">
              Welcome back, Admin
            </h1>
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-base font-semibold text-slate-600">
            Here&apos;s what&apos;s happening with SitGuru today.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={adminRoutes.exports}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <Download size={17} />
            Export Report
          </Link>

          <Link
            href={adminRoutes.newBooking}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
          >
            <Plus size={18} />
            Add New
          </Link>
        </div>
      </div>

      <section className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link
            key={metric.title}
            href={metric.href}
            className="group rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
          >
            <div className="mb-4 flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${metric.iconBg}`}
              >
                {metric.icon}
              </div>

              <h2 className="text-[15px] font-black leading-5 text-slate-800 sm:text-base">
                {metric.title}
              </h2>
            </div>

            <p className="text-3xl font-black tracking-tight text-slate-950">
              {metric.value}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-extrabold">
              <span
                className={
                  metric.trend === "up" ? "text-green-600" : "text-red-500"
                }
              >
                {metric.trend === "up" ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
              </span>
              <span
                className={
                  metric.trend === "up" ? "text-green-600" : "text-red-500"
                }
              >
                {metric.change}
              </span>
              <span className="text-slate-400">vs last 30 days</span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm font-black text-green-800">
              {metric.action}
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <DashboardCard>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Revenue Overview
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  Track your financial performance
                </p>
              </div>

              <button className="rounded-2xl border border-[#e3ece5] bg-[#fbfcf9] px-4 py-2 text-xs font-black text-slate-600">
                This Month
              </button>
            </div>

            <div className="space-y-5">
              <ProgressLine
                title="Revenue"
                value={money(data.grossRevenue)}
                percent={revenueTargetPercent}
                label={`${revenueTargetPercent}% of target`}
              />
              <ProgressLine
                title="Expenses"
                value={money(expenseTotal)}
                percent={expensePercent}
                label={`${expensePercent}% of budget`}
                tone="orange"
              />
              <ProgressLine
                title="Net Profit"
                value={money(netProfit)}
                percent={netProfitPercent}
                label={`${netProfitPercent}% margin`}
              />
              <ProgressLine
                title="Platform Take Rate"
                value={percent(data.platformTakeRate)}
                percent={Math.min(100, data.platformTakeRate * 10)}
                label="Healthy"
              />
            </div>

            <div className="mt-5">
              <Link
                href={adminRoutes.financials}
                className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
              >
                View Full Financial Overview
              </Link>
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-3">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Launch Signups
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Total signups across all sources
              </p>
            </div>

            <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
              <div className="relative mx-auto h-[180px] w-[180px]">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background:
                      "conic-gradient(#EC4899 0deg 151deg, #059669 151deg 252deg, #3B82F6 252deg 303deg, #1F2937 303deg 335deg, #FB923C 335deg 360deg)",
                  }}
                />
                <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-2xl font-black text-slate-950">
                    {number(data.signupTotal)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Total</span>
                </div>
              </div>

              <div className="space-y-3">
                {data.signupSources.map((source) => {
                  const sourcePercent = data.signupTotal
                    ? Math.round((source.value / data.signupTotal) * 100)
                    : 0;

                  return (
                    <div
                      key={source.name}
                      className="flex items-center justify-between gap-3 text-sm font-bold"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-3 w-3 rounded-full ${source.color}`}
                        />
                        <span className="text-slate-700">{source.name}</span>
                      </div>
                      <span className="text-slate-950">
                        {sourcePercent}%{" "}
                        <span className="text-slate-400">
                          ({number(source.value)})
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={adminRoutes.launchSignups}
                className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
              >
                View All Signups
              </Link>
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-5">
          <DashboardCard>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Messages</h2>
                <p className="text-sm font-semibold text-slate-500">
                  Recent conversations
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                {data.unreadMessages} unread
              </span>
            </div>

            <div className="space-y-2.5">
              {data.recentMessages.length ? (
                data.recentMessages.map((message, index) => (
                  <Link
                    href={adminRoutes.messages}
                    key={`${message.sender}-${index}`}
                    className="flex items-start gap-3 rounded-2xl p-2 transition hover:bg-green-50"
                  >
                    <Avatar
                      name={message.sender}
                      src={message.avatar}
                      className="mt-0.5 h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-black text-slate-950">
                          {message.sender}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="text-xs font-bold text-slate-500">
                            {formatMessageTime(message.time)}
                          </p>
                          {message.unread ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {message.body}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f7faf6] p-5 text-center">
                  <MessageCircle className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-slate-500">
                    No recent messages yet.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Link
                href={adminRoutes.messages}
                className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
              >
                View All Messages
              </Link>
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <DashboardCard>
            <TableHeader
              title="Top Performing Gurus"
              subtitle="By earnings this month"
              href={adminRoutes.gurus}
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black text-slate-500">
                    <th className="pb-3">Guru</th>
                    <th className="pb-3">Rating</th>
                    <th className="pb-3">Earnings</th>
                    <th className="pb-3">Bookings</th>
                    <th className="pb-3">City</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGurus.length ? (
                    data.topGurus.map((guru) => (
                      <tr
                        key={guru.name}
                        className="border-b border-[#f1f5f2] last:border-0"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={guru.name} src={guru.avatar} />
                            <span className="font-black text-slate-950">
                              {guru.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {guru.rating ? guru.rating.toFixed(2) : "—"}
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {money(guru.earnings)}
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {number(guru.bookings)}
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {guru.city}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center font-bold text-slate-500"
                      >
                        No gurus found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-4">
          <DashboardCard>
            <TableHeader
              title="Top Customers"
              subtitle="By lifetime spend"
              href={adminRoutes.customers}
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black text-slate-500">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total Spend</th>
                    <th className="pb-3">Bookings</th>
                    <th className="pb-3">Last Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.length ? (
                    data.topCustomers.map((customer) => (
                      <tr
                        key={customer.name}
                        className="border-b border-[#f1f5f2] last:border-0"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={customer.name}
                              src={customer.avatar}
                            />
                            <span className="font-black text-slate-950">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {money(customer.spend)}
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {number(customer.bookings)}
                        </td>
                        <td className="py-3 font-bold text-slate-600">
                          {formatDate(customer.lastBooking)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center font-bold text-slate-500"
                      >
                        No customers found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-4">
          <DashboardCard>
            <TableHeader
              title="SitGuru Network Programs"
              subtitle="Partner, ambassador, affiliate, referral, rewards, and campaign tracking"
              href={adminRoutes.partners}
            />

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <NetworkKpiTile
                href={adminRoutes.programs}
                icon={<ShieldCheck size={16} />}
                title="Active Programs"
                value={number(data.networkMetrics.activePrograms)}
              />
              <NetworkKpiTile
                href={adminRoutes.partnerApplications}
                icon={<FileBarChart size={16} />}
                title="Applications"
                value={number(data.networkMetrics.applications)}
              />
              <NetworkKpiTile
                href={adminRoutes.activePartners}
                icon={<BriefcaseBusiness size={16} />}
                title="Partners"
                value={number(data.networkMetrics.activePartners)}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NetworkStatusRow
                href={adminRoutes.partnerAmbassadors}
                title="Ambassadors"
                value={number(data.networkMetrics.ambassadors)}
                detail="Community growth leaders"
                icon={<Users size={18} />}
              />

              <NetworkStatusRow
                href={adminRoutes.partnerAffiliates}
                title="Affiliates"
                value={number(data.networkMetrics.affiliates)}
                detail="Creators and promoters"
                icon={<Link2 size={18} />}
              />

              <NetworkStatusRow
                href={adminRoutes.partnerCampaigns}
                title="Campaign Clicks"
                value={number(data.networkMetrics.clicks)}
                detail={`${number(data.networkMetrics.campaigns)} campaigns tracked`}
                icon={<MousePointerClick size={18} />}
              />

              <NetworkStatusRow
                href={adminRoutes.partnerRewards}
                title="Pending Rewards"
                value={money(data.networkMetrics.pendingRewardsAmount)}
                detail={`${number(data.networkMetrics.pendingRewardsCount)} rewards pending`}
                icon={<Gift size={18} />}
              />

              <NetworkStatusRow
                href={adminRoutes.partnerPayouts}
                title="Pending Payouts"
                value={money(data.networkMetrics.pendingPayoutAmount)}
                detail={`${number(data.networkMetrics.pendingPayoutCount)} payouts waiting`}
                icon={<WalletCards size={18} />}
              />

              <NetworkStatusRow
                href={adminRoutes.partnerMessages}
                title="Partner Messages"
                value={number(data.networkMetrics.unreadPartnerMessages)}
                detail="Unread network messages"
                icon={<MessageCircle size={18} />}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href={adminRoutes.partners}
                className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
              >
                Open Partner Admin
              </Link>

              <Link
                href={adminRoutes.partnerApplications}
                className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
              >
                Review Applications
              </Link>
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardCard>
            <h2 className="mb-5 text-lg font-black text-slate-950">
              Quick Actions
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              <QuickAction
                href={adminRoutes.newBooking}
                icon={<CalendarDays />}
                label="New Booking"
              />
              <QuickAction
                href={adminRoutes.newGuru}
                icon={<UserPlus />}
                label="Add Guru"
              />
              <QuickAction
                href={adminRoutes.newCustomer}
                icon={<Users />}
                label="Add Customer"
              />
              <QuickAction
                href={adminRoutes.messages}
                icon={<MessageCircle />}
                label="Send Message"
              />
              <QuickAction
                href={adminRoutes.reports}
                icon={<FileBarChart />}
                label="Run Report"
              />
              <QuickAction
                href={adminRoutes.exports}
                icon={<Download />}
                label="Export Data"
              />
              <QuickAction
                href={adminRoutes.partners}
                icon={<BriefcaseBusiness />}
                label="Partner Admin"
              />
              <QuickAction
                href={adminRoutes.settings}
                icon={<Settings />}
                label="System Settings"
              />
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-4">
          <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-green-900 via-green-700 to-emerald-800 p-6 text-white shadow-xl shadow-emerald-900/20">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Cash Position</h2>
                <p className="text-sm font-semibold text-white/75">
                  Available Balance
                </p>
              </div>
              <Bell className="text-white/80" />
            </div>

            <p className="text-4xl font-black tracking-tight text-white">
              {money(cashPosition)}
            </p>
            <p className="mt-2 text-sm font-bold text-white/75">
              Updated just now
            </p>

            <div className="mt-8 h-[70px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <svg viewBox="0 0 280 80" className="h-full w-full">
                <path
                  d="M3 60 C 35 55, 33 42, 56 48 S 83 62, 104 44 S 132 28, 153 38 S 181 55, 199 33 S 223 8, 240 27 S 260 46, 277 5"
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <DesignSystem />
    </div>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function TableHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
      <Link href={href} className="text-sm font-black text-green-800">
        View all
      </Link>
    </div>
  );
}

function ProgressLine({
  title,
  value,
  percent,
  label,
  tone = "green",
}: {
  title: string;
  value: string;
  percent: number;
  label: string;
  tone?: "green" | "orange";
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-700">{title}</p>
          <p className="text-2xl font-black text-slate-950">{value}</p>
        </div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#eef4ef]">
        <div
          className={`h-full rounded-full ${
            tone === "orange" ? "bg-orange-400" : "bg-green-700"
          }`}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function Avatar({
  name,
  src,
  className = "h-9 w-9",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
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

function NetworkKpiTile({
  href,
  icon,
  title,
  value,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-800 text-white">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-black text-green-800">
        View details <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function NetworkStatusRow({
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
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#f0f4f1] bg-white p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{title}</p>
          <p className="truncate text-xs font-bold text-slate-500">{detail}</p>
        </div>
      </div>

      <p className="shrink-0 text-sm font-black text-green-800">{value}</p>
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
      className="group flex flex-col items-center gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-center transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <span className="text-xs font-black text-slate-700">{label}</span>
    </Link>
  );
}

function ColorSwatch({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div>
      <div
        className="mb-2 h-12 rounded-xl border border-black/5"
        style={{ backgroundColor: color }}
      />
      <p className="text-[10px] font-black leading-tight text-slate-700">
        {label}
      </p>
      <p className="text-[10px] font-bold text-slate-400">{color}</p>
    </div>
  );
}

function DesignSystem() {
  return (
    <section className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-black uppercase tracking-wide text-slate-950">
        Design System
      </h2>

      <div className="grid gap-8 lg:grid-cols-4">
        <div>
          <p className="mb-4 text-sm font-black text-slate-700">
            Color Palette
          </p>
          <div className="grid grid-cols-5 gap-3">
            <ColorSwatch color="#16A34A" label="Primary Green" />
            <ColorSwatch color="#15803D" label="Dark Green" />
            <ColorSwatch color="#DCFCE7" label="Light Green" />
            <ColorSwatch color="#F9FAF5" label="Cream" />
            <ColorSwatch color="#647468" label="Warm Gray" />
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-black text-slate-700">Typography</p>
          <div className="rounded-2xl border border-[#e3ece5] bg-white p-5">
            <p className="text-4xl font-black text-slate-950">Aa</p>
            <p className="mt-2 text-sm font-black text-slate-950">Inter</p>
            <p className="text-xs font-semibold text-slate-500">
              Clean, modern, highly readable
            </p>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-black text-slate-700">UI Elements</p>
          <div className="space-y-3">
            <button className="w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-black text-white">
              Primary Button
            </button>
            <button className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-800">
              Secondary Button
            </button>
            <Link
              href={adminRoutes.dashboard}
              className="text-sm font-black text-green-800 underline"
            >
              Link Text
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-black text-slate-700">
            Other Elements
          </p>
          <div className="flex flex-wrap gap-3">
            {[CalendarDays, Users, BarChart3, MessageCircle, Download].map(
              (Icon, index) => (
                <div
                  key={index}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e3ece5] bg-white text-green-800"
                >
                  <Icon size={20} />
                </div>
              ),
            )}

            <div className="flex items-center gap-2 rounded-2xl border border-[#e3ece5] bg-white px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              <span className="text-sm font-black text-slate-950">Live</span>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-[#e3ece5] bg-white px-4 py-3 text-sm font-black text-slate-950">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-1">4.9</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}