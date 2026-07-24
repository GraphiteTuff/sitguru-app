import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  ExternalLink,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  MessageCircle,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  GURU_EARNINGS_METHODS,
  getCustomerPaymentMethod,
  type CustomerPaymentMethodId,
  type PaymentProcessor,
} from "@/lib/payments/payment-methods";

export const dynamic = "force-dynamic";

const DEFAULT_SITGURU_FEE_PERCENT = 0;
const MIN_SITGURU_FEE_PERCENT = 0;
const MAX_SITGURU_FEE_PERCENT = 0;

type GuruProfile = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type BookingRow = Record<string, unknown>;

type EarningsRow = {
  id: string;
  rawDate: string;
  date: string;
  time: string;
  service: string;
  petParent: string;
  petName: string;
  customerPhotoUrl: string;
  gross: number;
  fee: number;
  net: number;
  status: string;
};

type GuruPayoutProvider = "stripe" | "paypal" | "set_up_later";

type GuruPayoutAccount = {
  provider?: "stripe" | "paypal" | null;
  providerEmail?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  connectedAt?: string | null;
};

type GuruPayoutSetup = {
  selectedProvider?: GuruPayoutProvider;
  setupComplete?: boolean;
  nextAction?: string | null;
  accounts?: GuruPayoutAccount[];
  readyAccount?: GuruPayoutAccount | null;
};

type GuruPayoutSetupResponse = {
  success: boolean;
  message?: string;
  error?: string;
  setup?: GuruPayoutSetup;
};

type PayPalOnboardingAccount = {
  id?: string | null;
  provider?: "paypal";
  providerMerchantId?: string | null;
  providerEmail?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  isDefault?: boolean;
  isLive?: boolean;
  connectedAt?: string | null;
  onboardingCompletedAt?: string | null;
  lastSyncedAt?: string | null;
  primaryEmailConfirmed?: boolean;
  paymentsReceivable?: boolean;
  permissionsGranted?: boolean;
};

type PayPalOnboardingResponse = {
  success: boolean;
  environment?: "sandbox" | "live" | string;
  configured?: boolean;
  statusRefreshAvailable?: boolean;
  account?: PayPalOnboardingAccount | null;
  refreshWarning?: string | null;
  onboardingUrl?: string;
  alreadyConnected?: boolean;
  message?: string;
  error?: string;
};

type EarningsPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

type EarningsPageProps = {
  searchParams?:
    | EarningsPageSearchParams
    | Promise<EarningsPageSearchParams>;
};

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  const candidate =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

async function getSharedApiOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();
  const isLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1";

  // Local Next.js development runs over plain HTTP. Always prefer the
  // incoming localhost origin before production environment variables so a
  // value such as NEXT_PUBLIC_SITE_URL=localhost:3000 cannot be converted to
  // https://localhost:3000 and trigger ERR_SSL_PACKET_LENGTH_TOO_LONG.
  if (host && isLocalHost) {
    return `http://${host}`;
  }

  const configuredOrigin =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL);

  if (configuredOrigin) return configuredOrigin;

  const allowedHost =
    hostname === "sitguru.com" ||
    hostname === "www.sitguru.com" ||
    hostname.endsWith(".sitguru.com");

  if (!host || !allowedHost) {
    return "https://www.sitguru.com";
  }

  const forwardedProto = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProto || "https";

  return `${protocol}://${host}`;
}

async function callGuruPayoutSetupApi({
  accessToken,
  method = "GET",
  provider,
}: {
  accessToken: string;
  method?: "GET" | "PATCH";
  provider?: GuruPayoutProvider;
}): Promise<GuruPayoutSetupResponse> {
  try {
    const origin = await getSharedApiOrigin();
    const response = await fetch(`${origin}/api/payouts/setup?role=guru`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(method === "PATCH"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        method === "PATCH"
          ? JSON.stringify({
              role: "guru",
              preferredProvider: provider,
            })
          : undefined,
    });

    const payload = (await response.json().catch(() => null)) as
      | GuruPayoutSetupResponse
      | null;

    if (!payload) {
      return {
        success: false,
        error: "SitGuru could not read the payout setup response.",
      };
    }

    if (!response.ok || !payload.success) {
      return {
        ...payload,
        success: false,
        error: payload.error || "SitGuru could not update payout setup.",
      };
    }

    return payload;
  } catch (error) {
    console.error("Guru payout setup request failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "SitGuru could not connect to payout setup.",
    };
  }
}

async function callGuruPayPalOnboardingApi({
  accessToken,
  method = "GET",
  refresh = false,
  forceNew = false,
}: {
  accessToken: string;
  method?: "GET" | "POST";
  refresh?: boolean;
  forceNew?: boolean;
}): Promise<PayPalOnboardingResponse> {
  try {
    const origin = await getSharedApiOrigin();
    const url = new URL("/api/paypal/onboarding", origin);

    if (refresh) {
      url.searchParams.set("refresh", "true");
    }

    const response = await fetch(url.toString(), {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(method === "POST"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        method === "POST"
          ? JSON.stringify({
              forceNew,
            })
          : undefined,
    });

    const responseText = await response.text();
    let payload: PayPalOnboardingResponse | null = null;

    try {
      payload = responseText
        ? (JSON.parse(responseText) as PayPalOnboardingResponse)
        : null;
    } catch {
      console.error("PayPal onboarding returned non-JSON data:", {
        status: response.status,
        responseText: responseText.slice(0, 1200),
      });
    }

    if (!payload) {
      return {
        success: false,
        error:
          response.status >= 500
            ? "PayPal setup is temporarily unavailable. Please try again."
            : "SitGuru could not read the PayPal onboarding response.",
      };
    }

    if (!response.ok || !payload.success) {
      return {
        ...payload,
        success: false,
        error:
          payload.error ||
          payload.message ||
          "SitGuru could not load or start PayPal onboarding.",
      };
    }

    return payload;
  } catch (error) {
    console.error("PayPal onboarding request failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "SitGuru could not connect to PayPal onboarding.",
    };
  }
}

function getSafePayPalOnboardingUrl(value?: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const isPayPalHost =
      hostname === "paypal.com" || hostname.endsWith(".paypal.com");

    if (parsed.protocol !== "https:" || !isPayPalHost) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function buildEarningsStatusUrl({
  payoutSaved,
  payoutStatus,
  paypal,
  paypalMessage,
}: {
  payoutSaved?: string;
  payoutStatus?: string;
  paypal?: string;
  paypalMessage?: string;
}) {
  const params = new URLSearchParams();

  if (payoutSaved) params.set("payoutSaved", payoutSaved);
  if (payoutStatus) params.set("payoutStatus", payoutStatus);
  if (paypal) params.set("paypal", paypal);
  if (paypalMessage) {
    params.set("paypal_message", paypalMessage.slice(0, 240));
  }

  const query = params.toString();

  return query
    ? `/guru/dashboard/earnings?${query}`
    : "/guru/dashboard/earnings";
}

async function saveGuruPayoutProvider(formData: FormData) {
  "use server";

  const requestedProvider = String(formData.get("provider") || "");
  const provider: GuruPayoutProvider | null =
    requestedProvider === "stripe" ||
    requestedProvider === "paypal" ||
    requestedProvider === "set_up_later"
      ? requestedProvider
      : null;

  if (!provider) {
    redirect("/guru/dashboard/earnings?payoutStatus=invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/guru/login");
  }

  const result = await callGuruPayoutSetupApi({
    accessToken: session.access_token,
    method: "PATCH",
    provider,
  });

  revalidatePath("/guru/dashboard/earnings");

  if (!result.success) {
    redirect("/guru/dashboard/earnings?payoutStatus=error");
  }

  redirect(`/guru/dashboard/earnings?payoutSaved=${provider}`);
}

async function startGuruStripeOnboarding() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/guru/login");
  }

  const result = await callGuruPayoutSetupApi({
    accessToken: session.access_token,
    method: "PATCH",
    provider: "stripe",
  });

  if (!result.success) {
    redirect("/guru/dashboard/earnings?payoutStatus=error");
  }

  revalidatePath("/guru/dashboard/earnings");
  redirect("/api/stripe/connect/onboard?role=guru");
}

async function startGuruPayPalOnboarding(formData: FormData) {
  "use server";

  const forceNew = String(formData.get("forceNew") || "") === "true";
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/guru/login");
  }

  const result = await callGuruPayPalOnboardingApi({
    accessToken: session.access_token,
    method: "POST",
    forceNew,
  });

  if (!result.success) {
    redirect(
      buildEarningsStatusUrl({
        paypal: "error",
        paypalMessage:
          result.error || "SitGuru could not start PayPal onboarding.",
      }),
    );
  }

  revalidatePath("/guru/dashboard/earnings");

  if (result.alreadyConnected || result.account?.payoutsEnabled) {
    redirect(
      buildEarningsStatusUrl({
        payoutSaved: "paypal",
        paypal: "connected",
        paypalMessage: result.message || "PayPal is ready to go.",
      }),
    );
  }

  const onboardingUrl = getSafePayPalOnboardingUrl(result.onboardingUrl);

  if (!onboardingUrl) {
    redirect(
      buildEarningsStatusUrl({
        payoutSaved: "paypal",
        paypal: "error",
        paypalMessage:
          "PayPal did not return a valid setup link. Please try again.",
      }),
    );
  }

  redirect(onboardingUrl);
}

async function refreshGuruPayPalOnboarding() {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/guru/login");
  }

  const result = await callGuruPayPalOnboardingApi({
    accessToken: session.access_token,
    method: "GET",
    refresh: true,
  });

  revalidatePath("/guru/dashboard/earnings");

  if (!result.success) {
    redirect(
      buildEarningsStatusUrl({
        paypal: "error",
        paypalMessage:
          result.error || "SitGuru could not refresh PayPal status.",
      }),
    );
  }

  const isReady =
    result.account?.payoutsEnabled === true ||
    result.account?.onboardingStatus === "ready";

  redirect(
    buildEarningsStatusUrl({
      paypal: isReady ? "connected" : "pending",
      paypalMessage: isReady
        ? "PayPal is ready to receive eligible SitGuru payouts."
        : result.refreshWarning ||
          "PayPal setup is still in progress. Finish any remaining steps in PayPal.",
    }),
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function asTrimmedString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function normalizeFeePercent(value: unknown) {
  const parsed = toNumber(value);

  if (parsed <= 0) return DEFAULT_SITGURU_FEE_PERCENT;

  const percent = parsed > 1 ? parsed : parsed * 100;
  const clamped = Math.min(
    MAX_SITGURU_FEE_PERCENT,
    Math.max(MIN_SITGURU_FEE_PERCENT, percent),
  );

  return clamped / 100;
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

function formatTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (normalized.includes("processing")) {
    return "border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (normalized.includes("adjust") || normalized.includes("refund")) {
    return "border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border-amber-200 bg-amber-50 !text-amber-700";
}

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getBookingStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payout_status) ||
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status) ||
    asTrimmedString(booking.booking_status) ||
    asTrimmedString(booking.state) ||
    "pending"
  );
}

function getServiceName(booking: BookingRow) {
  return (
    asTrimmedString(booking.service) ||
    asTrimmedString(booking.service_name) ||
    asTrimmedString(booking.service_type) ||
    asTrimmedString(booking.booking_type) ||
    "Pet Care"
  );
}

function getPetParentName(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_name) ||
    asTrimmedString(booking.pet_parent_name) ||
    asTrimmedString(booking.owner_name) ||
    asTrimmedString(booking.parent_name) ||
    asTrimmedString(booking.user_name) ||
    asTrimmedString(booking.customer_email) ||
    "Customer"
  );
}

function getCustomerPhotoUrl(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_photo_url) ||
    asTrimmedString(booking.customer_avatar_url) ||
    asTrimmedString(booking.pet_parent_photo_url) ||
    asTrimmedString(booking.owner_photo_url) ||
    asTrimmedString(booking.avatar_url) ||
    asTrimmedString(booking.profile_photo_url) ||
    asTrimmedString(booking.customer_profile_photo_url) ||
    ""
  );
}

function getPetName(booking: BookingRow) {
  return (
    asTrimmedString(booking.pet_name) ||
    asTrimmedString(booking.petName) ||
    asTrimmedString(booking.pet) ||
    asTrimmedString(booking.animal_name) ||
    "Pet care"
  );
}

function getBookingDateValue(booking: BookingRow) {
  return (
    asTrimmedString(booking.booking_date) ||
    asTrimmedString(booking.requested_date) ||
    asTrimmedString(booking.start_date) ||
    asTrimmedString(booking.start_time) ||
    asTrimmedString(booking.created_at) ||
    ""
  );
}

function getGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return roundMoney(subtotal);

  const fallback =
    toNumber(booking.booking_subtotal_amount) ||
    toNumber(booking.service_price) ||
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate);

  return roundMoney(fallback);
}

function getFeePercent(booking: BookingRow) {
  return normalizeFeePercent(
    booking.marketplace_fee_percent ||
      booking.sitguru_fee_percent ||
      booking.platform_fee_percent,
  );
}

function getFeeAmount(booking: BookingRow, gross: number) {
  const storedFee =
    toNumber(booking.marketplace_fee_amount) ||
    toNumber(booking.sitguru_fee_amount) ||
    toNumber(booking.platform_fee);

  if (storedFee > 0) return roundMoney(storedFee);

  return roundMoney(gross * getFeePercent(booking));
}

function getNetAmount(booking: BookingRow, gross: number, fee: number) {
  const storedNet =
    toNumber(booking.guru_net_amount) ||
    toNumber(booking.guru_estimated_base_payout);

  if (storedNet > 0) return roundMoney(storedNet);

  return roundMoney(gross - fee);
}

function isCompletedForEarnings(booking: BookingRow) {
  const status = getBookingStatus(booking).toLowerCase();

  return (
    status.includes("complete") ||
    status.includes("paid") ||
    status.includes("processing") ||
    status.includes("pending")
  );
}

async function getGuruProfile(userId: string, email?: string | null) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruProfile;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruProfile;
    }
  }

  return null;
}

async function getGuruBookings(guruId: string | number) {
  const byCreatedAt = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!byCreatedAt.error && byCreatedAt.data) {
    return byCreatedAt.data as BookingRow[];
  }

  const byBookingDate = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("booking_date", { ascending: false })
    .limit(100);

  if (!byBookingDate.error && byBookingDate.data) {
    return byBookingDate.data as BookingRow[];
  }

  return [];
}

function getFirstName(profile: GuruProfile, fallbackEmail?: string | null) {
  const name =
    profile.full_name ||
    profile.display_name ||
    profile.name ||
    fallbackEmail?.split("@")[0] ||
    "Guru";

  return String(name).trim().split(/\s+/)[0] || "Guru";
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
    <div className="rounded-3xl border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 !text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-black !text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 !text-slate-500">
        {description}
      </p>
    </div>
  );
}

function CustomerAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-sm font-black !text-green-800 ring-2 ring-green-100">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initialsFromName(name)
      )}
    </div>
  );
}

const PAYMENT_METHOD_LOGOS: Partial<
  Record<CustomerPaymentMethodId, string>
> = {
  apple_pay: "/images/payments/apple-pay.svg",
  google_pay: "/images/payments/google-pay.svg",
  paypal: "/images/payments/paypal.svg",
  venmo: "/images/payments/venmo.svg",
  pay_later: "/images/payments/paypal-pay-later.svg",
  cash_app_pay: "/images/payments/cash-app-pay.svg",
};

function ProviderLogo({
  provider,
}: {
  provider: "paypal" | "stripe";
}) {
  const src =
    provider === "paypal"
      ? "/images/payments/paypal.svg"
      : "/images/payments/stripe.svg";
  const alt = provider === "paypal" ? "PayPal" : "Stripe";

  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-6 w-auto max-w-full object-contain"
      />
    </div>
  );
}

function CustomerPaymentMethodIcon({
  methodId,
  processor,
}: {
  methodId: CustomerPaymentMethodId;
  processor: PaymentProcessor;
}) {
  if (methodId === "cards") {
    return <CreditCard className="h-4 w-4" aria-hidden="true" />;
  }

  if (methodId === "bank_pay") {
    return <Landmark className="h-4 w-4" aria-hidden="true" />;
  }

  const logoPath = PAYMENT_METHOD_LOGOS[methodId];

  if (!logoPath) {
    return <Wallet className="h-4 w-4" aria-hidden="true" />;
  }

  return (
    <span className="flex h-5 min-w-7 items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoPath}
        alt=""
        className="max-h-4 w-auto max-w-[48px] object-contain"
      />
    </span>
  );
}

function SupportedCustomerMethods({
  methodIds,
  processor,
}: {
  methodIds: CustomerPaymentMethodId[];
  processor: PaymentProcessor;
}) {
  const methods = methodIds
    .map((methodId) => getCustomerPaymentMethod(methodId))
    .filter(
      (
        method,
      ): method is NonNullable<ReturnType<typeof getCustomerPaymentMethod>> =>
        Boolean(method),
    )
    .slice(0, 5);

  if (!methods.length) return null;

  return (
    <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {methods.map((method) => (
        <span
          key={`${processor}-${method.id}`}
          className="inline-flex min-h-9 shrink-0 snap-start items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black !text-slate-700"
          title={method.availabilityNote}
        >
          <CustomerPaymentMethodIcon
            methodId={method.id}
            processor={processor}
          />
          {method.shortLabel}
        </span>
      ))}
    </div>
  );
}

function ProviderStatusBadge({
  ready,
  started,
  selected,
}: {
  ready: boolean;
  started: boolean;
  selected: boolean;
}) {
  const label = ready
    ? "Ready"
    : started
      ? "Finish setup"
      : selected
        ? "Selected"
        : "Not connected";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
        ready
          ? "border-green-200 bg-green-50 !text-green-800"
          : started || selected
            ? "border-amber-200 bg-amber-50 !text-amber-800"
            : "border-slate-200 bg-slate-100 !text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function PaymentSetupCard({
  setup,
  loadError,
  saveStatus,
  paypalStatus,
  paypalMessage,
  paypalOnboarding,
}: {
  setup: GuruPayoutSetup | null;
  loadError?: string | null;
  saveStatus?: string | null;
  paypalStatus?: string | null;
  paypalMessage?: string | null;
  paypalOnboarding: PayPalOnboardingResponse | null;
}) {
  const selectedProvider = setup?.selectedProvider || "set_up_later";
  const stripeAccount =
    setup?.accounts?.find((account) => account.provider === "stripe") || null;
  const paypalAccount = paypalOnboarding?.account || null;

  const paypalReady =
    paypalAccount?.payoutsEnabled === true ||
    paypalAccount?.onboardingStatus === "ready" ||
    paypalAccount?.accountStatus === "active";

  const stripeReady =
    stripeAccount?.payoutsEnabled === true ||
    stripeAccount?.accountStatus === "ready" ||
    (stripeAccount?.detailsSubmitted === true &&
      stripeAccount?.chargesEnabled === true);

  const paypalStarted = Boolean(paypalAccount);
  const stripeStarted =
    Boolean(stripeAccount) || selectedProvider === "stripe";
  const anyProviderReady = paypalReady || stripeReady;
  const connectedCount = Number(paypalReady) + Number(stripeReady);
  const paypalConfigured = paypalOnboarding?.configured !== false;
  const paypalRefreshAvailable =
    paypalOnboarding?.statusRefreshAvailable !== false;

  const paypalMethod = GURU_EARNINGS_METHODS.find(
    (method) => method.id === "paypal_merchant",
  );
  const stripeMethod = GURU_EARNINGS_METHODS.find(
    (method) => method.id === "stripe_connect",
  );

  const successMessage =
    saveStatus === "set_up_later"
      ? "Saved. You can finish payment setup anytime before your first paid booking."
      : null;

  const errorMessage =
    saveStatus === "error"
      ? "That did not save. Please try again."
      : saveStatus === "invalid"
        ? "Choose PayPal, Stripe, or set this up later."
        : loadError || null;

  const paypalBannerClass =
    paypalStatus === "connected"
      ? "border-green-200 bg-green-50 !text-green-800"
      : paypalStatus === "pending"
        ? "border-amber-200 bg-amber-50 !text-amber-800"
        : "border-rose-200 bg-rose-50 !text-rose-700";

  return (
    <section className="rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] !text-green-700">
            Get paid
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight !text-green-950">
            Get paid your way
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-slate-600">
            Pick PayPal or Stripe. One is enough to start, and you can connect
            the other anytime.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-center ${
            anyProviderReady
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="text-2xl font-black !text-green-950">
            {connectedCount}/2
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] !text-slate-600">
            {anyProviderReady ? "payment options ready" : "connect one to start"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 !text-green-700" />
        <p className="text-sm font-semibold leading-6 !text-slate-700">
          Your bank and account passwords stay with PayPal or Stripe. SitGuru
          never sees them.
        </p>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold !text-green-800"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700"
        >
          {errorMessage}
        </div>
      ) : null}

      {paypalStatus && paypalMessage ? (
        <div
          role={paypalStatus === "error" ? "alert" : "status"}
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${paypalBannerClass}`}
        >
          {paypalMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article
          className={`rounded-[24px] border p-4 ${
            paypalReady || selectedProvider === "paypal"
              ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ProviderLogo provider="paypal" />
              <div className="min-w-0">
                <h3 className="text-lg font-black !text-slate-950">PayPal</h3>
                <p className="mt-1 text-sm font-semibold leading-6 !text-slate-600">
                  Use PayPal, Venmo, and eligible Pay Later options.
                </p>
                {paypalAccount?.providerEmail ? (
                  <p className="mt-2 truncate text-xs font-black !text-blue-800">
                    {paypalAccount.providerEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <ProviderStatusBadge
              ready={paypalReady}
              started={paypalStarted}
              selected={selectedProvider === "paypal"}
            />
          </div>

          <SupportedCustomerMethods
            methodIds={paypalMethod?.customerMethods || []}
            processor="paypal"
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <form action={startGuruPayPalOnboarding}>
              <input
                type="hidden"
                name="forceNew"
                value={paypalStarted ? "false" : "true"}
              />
              <button
                type="submit"
                disabled={!paypalConfigured}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0070e0] px-4 py-2.5 text-sm font-black !text-white transition hover:bg-[#003087] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paypalReady
                  ? "Manage PayPal"
                  : paypalStarted
                    ? "Continue setup"
                    : "Connect PayPal"}
                <ExternalLink className="h-4 w-4" />
              </button>
            </form>

            <form action={refreshGuruPayPalOnboarding}>
              <button
                type="submit"
                disabled={
                  !paypalConfigured ||
                  !paypalRefreshAvailable ||
                  !paypalStarted
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black !text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Check status
              </button>
            </form>
          </div>
        </article>

        <article
          className={`rounded-[24px] border p-4 ${
            stripeReady || selectedProvider === "stripe"
              ? "border-violet-200 bg-violet-50/50 ring-1 ring-violet-100"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ProviderLogo provider="stripe" />
              <div className="min-w-0">
                <h3 className="text-lg font-black !text-slate-950">Stripe</h3>
                <p className="mt-1 text-sm font-semibold leading-6 !text-slate-600">
                  Connect a bank account and get paid securely after eligible
                  bookings.
                </p>
                {stripeAccount?.providerEmail ? (
                  <p className="mt-2 truncate text-xs font-black !text-violet-800">
                    {stripeAccount.providerEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <ProviderStatusBadge
              ready={stripeReady}
              started={stripeStarted}
              selected={selectedProvider === "stripe"}
            />
          </div>

          <SupportedCustomerMethods
            methodIds={stripeMethod?.customerMethods || []}
            processor="stripe"
          />

          <form action={startGuruStripeOnboarding} className="mt-4">
            <button
              type="submit"
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                stripeReady
                  ? "border border-green-200 bg-green-50 !text-green-800 hover:bg-green-100"
                  : "bg-[#635bff] !text-white hover:bg-[#5148e5]"
              }`}
            >
              {stripeReady
                ? "Manage Stripe"
                : stripeStarted
                  ? "Continue setup"
                  : "Connect Stripe"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </article>
      </div>

      {!anyProviderReady ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black !text-slate-950">Not ready yet?</p>
            <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
              Keep building your profile now. Connect one payment option before
              your first paid booking.
            </p>
          </div>

          <form action={saveGuruPayoutProvider}>
            <input type="hidden" name="provider" value="set_up_later" />
            <button
              type="submit"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-black !text-slate-800 hover:bg-slate-100"
            >
              Set up later
            </button>
          </form>
        </div>
      ) : null}

      {!paypalConfigured ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700">
          PayPal setup is temporarily unavailable. Please contact SitGuru
          Support.
        </div>
      ) : null}

      {paypalOnboarding?.refreshWarning ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold !text-amber-800">
          {paypalOnboarding.refreshWarning}
        </div>
      ) : null}
    </section>
  );
}

function QuickActionLink({
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
      className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border border-green-100 bg-green-50 px-3 py-2.5 text-xs font-black !text-green-950 transition hover:bg-green-100"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default async function GuruDashboardEarningsPage({
  searchParams,
}: EarningsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const payoutSavedParam = resolvedSearchParams.payoutSaved;
  const payoutStatusParam = resolvedSearchParams.payoutStatus;
  const paypalStatusParam = resolvedSearchParams.paypal;
  const paypalMessageParam = resolvedSearchParams.paypal_message;
  const payoutSaveStatus =
    typeof payoutSavedParam === "string"
      ? payoutSavedParam
      : typeof payoutStatusParam === "string"
        ? payoutStatusParam
        : null;
  const paypalStatus =
    typeof paypalStatusParam === "string" ? paypalStatusParam : null;
  const paypalMessage =
    typeof paypalMessageParam === "string" ? paypalMessageParam : null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const payoutSetupResponse: GuruPayoutSetupResponse = session?.access_token
    ? await callGuruPayoutSetupApi({
        accessToken: session.access_token,
      })
    : {
        success: false,
        error: "Your payout session could not be loaded. Please sign in again.",
      };

  const payoutSetup = payoutSetupResponse.success
    ? payoutSetupResponse.setup || null
    : null;
  const payoutSetupError = payoutSetupResponse.success
    ? null
    : payoutSetupResponse.error || "SitGuru could not load payout setup.";

  const paypalOnboardingResponse: PayPalOnboardingResponse | null =
    session?.access_token
      ? await callGuruPayPalOnboardingApi({
          accessToken: session.access_token,
        })
      : null;

  const guruProfile = await getGuruProfile(user.id, user.email);

  if (!guruProfile?.id) {
    redirect("/guru/login");
  }

  const firstName = getFirstName(guruProfile, user.email);
  const bookings = await getGuruBookings(guruProfile.id);
  const earningsBookings = bookings.filter(isCompletedForEarnings);

  const normalizedRows: EarningsRow[] = earningsBookings.map(
    (booking, index) => {
      const gross = getGrossAmount(booking);
      const fee = getFeeAmount(booking, gross);
      const net = getNetAmount(booking, gross, fee);
      const rawDate = getBookingDateValue(booking);

      return {
        id:
          asTrimmedString(booking.id) ||
          `BK-${String(index + 1).padStart(4, "0")}`,
        rawDate,
        date: formatDate(rawDate),
        time: formatTime(rawDate),
        service: getServiceName(booking),
        petParent: getPetParentName(booking),
        petName: getPetName(booking),
        customerPhotoUrl: getCustomerPhotoUrl(booking),
        gross,
        fee,
        net,
        status: getBookingStatus(booking),
      };
    },
  );

  const totalEarnings = roundMoney(
    normalizedRows.reduce((sum, row) => sum + row.net, 0),
  );

  const pendingPayouts = roundMoney(
    normalizedRows
      .filter((row) => {
        const status = row.status.toLowerCase();
        return !status.includes("paid") && !status.includes("adjust");
      })
      .reduce((sum, row) => sum + row.net, 0),
  );

  const paidOut = roundMoney(
    normalizedRows
      .filter((row) => row.status.toLowerCase().includes("paid"))
      .reduce((sum, row) => sum + row.net, 0),
  );

  const marketplaceSupportTotal = roundMoney(
    normalizedRows.reduce((sum, row) => sum + row.fee, 0),
  );

  const completedBookings = normalizedRows.length;

  const monthStart = startOfCurrentMonth();
  const thisMonth = roundMoney(
    normalizedRows
      .filter((row) => {
        const parsed = new Date(row.rawDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= monthStart;
      })
      .reduce((sum, row) => sum + row.net, 0),
  );

  const recentEarnings = normalizedRows.slice(0, 10);

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="bg-[radial-gradient(circle_at_95%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] !text-green-700 sm:text-xs">
                Guru Earnings
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight !text-green-950 sm:text-4xl">
                Hey, {firstName} 👋
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-slate-600">
                Track what you earned, what is on the way, and where your
                payouts are going.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-green-100 bg-white px-3 py-1 text-xs font-black !text-green-900">
                  Marketplace Support: free during launch
                </span>
                <span className="rounded-full border border-green-100 bg-white px-3 py-1 text-xs font-black !text-green-900">
                  Tips pass through 100%
                </span>
              </div>
            </div>

            <div className="border-t border-green-100 bg-white p-5 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] !text-green-800">
                Quick moves
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <QuickActionLink
                  href="/guru/dashboard"
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Dashboard"
                />
                <QuickActionLink
                  href="/guru/dashboard/bookings"
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Bookings"
                />
                <QuickActionLink
                  href="/guru/dashboard/messages"
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Messages"
                />
                <QuickActionLink
                  href="/guru/dashboard/pricing"
                  icon={<BadgeDollarSign className="h-4 w-4" />}
                  label="Pricing"
                />
              </div>

              <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 !text-green-800" />
                  <div>
                    <p className="text-sm font-black !text-green-950">
                      Payout timing
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
                      Eligible payouts can be released 48 hours after completed
                      care when there are no open support or safety reviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PaymentSetupCard
          setup={payoutSetup}
          loadError={payoutSetupError}
          saveStatus={payoutSaveStatus}
          paypalStatus={paypalStatus}
          paypalMessage={paypalMessage}
          paypalOnboarding={paypalOnboardingResponse}
        />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total earnings"
            value={currency(totalEarnings)}
            description="All time"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Pending"
            value={currency(pendingPayouts)}
            description="Still on the way"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            title="Paid out"
            value={currency(paidOut)}
            description="Sent to you"
            icon={<PiggyBank className="h-5 w-5" />}
          />
          <StatCard
            title="This month"
            value={currency(thisMonth)}
            description="Current month"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            title="Bookings"
            value={String(completedBookings)}
            description="Earnings activity"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Support fee"
            value={currency(marketplaceSupportTotal)}
            description="Free during launch"
            icon={<BadgeDollarSign className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[28px] border border-[#dfe9e2] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-green-700">
                Recent activity
              </p>
              <h2 className="mt-1 text-2xl font-black !text-green-950">
                Your latest earnings
              </h2>
              <p className="mt-1 text-sm font-semibold !text-slate-600">
                A clear booking-by-booking view of what came in and what you
                take home.
              </p>
            </div>

            <Link
              href="/guru/dashboard/bookings"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-black !text-green-900 hover:bg-green-100"
            >
              View all bookings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentEarnings.length ? (
            <>
              <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.14em] !text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Pet Parent</th>
                      <th className="px-4 py-3 font-black">Service</th>
                      <th className="px-4 py-3 font-black">Date</th>
                      <th className="px-4 py-3 font-black">Gross</th>
                      <th className="px-4 py-3 font-black">Support</th>
                      <th className="px-4 py-3 font-black">You earn</th>
                      <th className="px-4 py-3 font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentEarnings.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <CustomerAvatar
                              name={item.petParent}
                              photoUrl={item.customerPhotoUrl}
                            />
                            <div>
                              <p className="font-black !text-slate-950">
                                {item.petParent}
                              </p>
                              <p className="mt-1 text-xs font-semibold !text-slate-600">
                                {item.petName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold !text-slate-900">
                          {item.service}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold !text-slate-900">
                            {item.date}
                          </p>
                          <p className="mt-1 text-xs font-semibold !text-slate-500">
                            {item.time || item.id}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-bold !text-slate-900">
                          {currency(item.gross)}
                        </td>
                        <td className="px-4 py-4 font-bold !text-rose-500">
                          -{currency(item.fee)}
                        </td>
                        <td className="px-4 py-4 font-black !text-green-700">
                          {currency(item.net)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-3 lg:hidden">
                {recentEarnings.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CustomerAvatar
                        name={item.petParent}
                        photoUrl={item.customerPhotoUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-black !text-slate-950">
                              {item.petParent}
                            </p>
                            <p className="mt-1 text-xs font-semibold !text-slate-600">
                              {item.petName} • {item.service}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-500">Gross</p>
                            <p className="mt-1 font-black !text-slate-950">
                              {currency(item.gross)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-500">Support</p>
                            <p className="mt-1 font-black !text-rose-500">
                              -{currency(item.fee)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-500">You earn</p>
                            <p className="mt-1 font-black !text-green-700">
                              {currency(item.net)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs font-semibold !text-slate-500">
                          {item.date} {item.time}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black !text-slate-950">
                No earnings yet
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 !text-slate-600">
                Once you complete paid bookings, the details will show up here.
              </p>
            </div>
          )}
        </section>

        <details className="group rounded-[28px] border border-green-100 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 !text-green-800">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black !text-green-950">
                  More earnings help
                </h2>
                <p className="mt-1 text-sm font-semibold !text-slate-600">
                  Payout timing, Marketplace Support, tips, and payment setup.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 !text-green-800 transition group-open:rotate-90" />
          </summary>

          <div className="grid gap-4 border-t border-green-100 p-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white !text-green-800 ring-1 ring-green-100">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-black !text-green-950">
                What you earn
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                Your net earnings are the booking amount after any disclosed
                Marketplace Support amount. Marketplace Support is currently
                free during launch.
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white !text-green-800 ring-1 ring-green-100">
                <PiggyBank className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-black !text-green-950">
                Tips are yours
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                Customer tips pass through 100% to you, subject only to the
                payment provider&apos;s standard processing rules.
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white !text-green-800 ring-1 ring-green-100">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-black !text-green-950">Need help?</h3>
              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                Send SitGuru Support a message for payment setup, missing
                earnings, or payout questions.
              </p>
              <Link
                href="/guru/dashboard/messages?support=admin&role=guru"
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-xs font-black !text-white hover:bg-green-900"
              >
                Message Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}