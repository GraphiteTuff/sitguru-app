import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  ExternalLink,
  HelpCircle,
  Landmark,
  Link2,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  GURU_EARNINGS_METHODS,
  GURU_PAYPAL_ONBOARDING_STEPS,
  GURU_STRIPE_ONBOARDING_STEPS,
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

type GuruPayoutProviderOption = {
  provider: GuruPayoutProvider;
  label: string;
  description: string;
};

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
  blockers?: {
    acceptFirstPaidBooking?: boolean;
    receiveBookingPayout?: boolean;
  };
  providerOptions?: GuruPayoutProviderOption[];
  messaging?: {
    headline?: string;
    description?: string;
    readyMessage?: string;
    blockedMessage?: string;
  };
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

function payoutProviderLabel(provider?: GuruPayoutProvider | null) {
  if (provider === "stripe") return "Stripe";
  if (provider === "paypal") return "PayPal";
  return "Set up later";
}

function humanizeStatus(value?: string | null) {
  if (!value) return "Not started";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  const candidate = value.startsWith("http://") || value.startsWith("https://")
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
  const configuredOrigin =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL);

  if (configuredOrigin) return configuredOrigin;

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();
  const allowedHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
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
  const protocol =
    forwardedProto ||
    (hostname === "localhost" || hostname === "127.0.0.1"
      ? "http"
      : "https");

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

  /*
    The PayPal onboarding endpoint saves PayPal as the Guru payout preference
    when it creates or renews the Partner Referrals onboarding record.
    Do not call /api/payouts/setup first; that duplicate write can fail before
    PayPal has a chance to open.
  */
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
        paypalMessage:
          result.message || "PayPal is connected and ready for payouts.",
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
          "PayPal did not return a valid onboarding link. Please try again.",
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
        ? "PayPal is connected and ready for eligible SitGuru payouts."
        : result.refreshWarning ||
          "PayPal setup is still pending. Complete any remaining steps in PayPal.",
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

  if (parsed <= 0) return 0;

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

function CustomerAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string;
}) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-black !text-emerald-700 ring-2 ring-emerald-100">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initialsFromName(name)
      )}
    </div>
  );
}

type OnboardingStep = {
  step: number;
  title: string;
  description: string;
};

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
    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-7 w-auto max-w-full object-contain"
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

  if (methodId === "link") {
    return <Link2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (methodId === "pay_later" && processor === "stripe") {
    return <Clock3 className="h-4 w-4" aria-hidden="true" />;
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
        className="max-h-4 w-auto max-w-[54px] object-contain"
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
    );

  if (!methods.length) return null;

  return (
    <div className="mt-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] !text-slate-600">
        Your Pet Parents may see
      </p>

      <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {methods.map((method) => (
          <span
            key={`${processor}-${method.id}`}
            className="inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black !text-slate-800 shadow-sm"
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

      <p className="mt-2 text-[11px] font-semibold leading-5 !text-slate-600">
        The exact options shown depend on your connection, your customer&apos;s
        device and account, and the booking.
      </p>
    </div>
  );
}

function SimpleOnboardingSteps({
  heading,
  steps,
}: {
  heading: string;
  steps: readonly OnboardingStep[];
}) {
  return (
    <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black !text-slate-950">{heading}</p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.step} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black !text-white">
              {step.step}
            </span>
            <div>
              <p className="text-sm font-black !text-slate-950">
                {step.title}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ProviderStatusBadge({
  ready,
  started,
  selected,
  status,
}: {
  ready: boolean;
  started: boolean;
  selected: boolean;
  status?: string | null;
}) {
  const label = ready
    ? "Ready"
    : started
      ? humanizeStatus(status || "setup started")
      : selected
        ? "Selected"
        : "Not connected";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
        ready
          ? "border-emerald-200 bg-emerald-50 !text-emerald-700"
          : started || selected
            ? "border-amber-200 bg-amber-50 !text-amber-800"
            : "border-slate-200 bg-slate-100 !text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function PayoutSetupCard({
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
  const setupComplete = Boolean(setup?.setupComplete);
  const selectedProvider = setup?.selectedProvider || "set_up_later";
  const paypalAccount = paypalOnboarding?.account || null;
  const stripeAccount =
    setup?.accounts?.find((account) => account.provider === "stripe") || null;

  const paypalReady =
    paypalAccount?.payoutsEnabled === true ||
    paypalAccount?.paymentsReceivable === true ||
    paypalAccount?.onboardingStatus === "ready";

  const stripeReady =
    stripeAccount?.payoutsEnabled === true ||
    stripeAccount?.accountStatus === "ready" ||
    (setupComplete && selectedProvider === "stripe");

  const paypalStarted = Boolean(paypalAccount);
  const stripeStarted = Boolean(stripeAccount) || selectedProvider === "stripe";
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
    saveStatus === "stripe"
      ? "Stripe is now your selected way to get paid."
      : saveStatus === "set_up_later"
        ? "No problem. You can finish setting up how you get paid later."
        : null;

  const errorMessage =
    saveStatus === "error"
      ? "SitGuru could not save that choice. Please try again."
      : saveStatus === "invalid"
        ? "Choose PayPal, Stripe, or set this up later."
        : loadError || null;

  const paypalBannerClass =
    paypalStatus === "connected"
      ? "border-emerald-200 bg-emerald-50 !text-emerald-800"
      : paypalStatus === "pending"
        ? "border-amber-200 bg-amber-50 !text-amber-800"
        : "border-rose-200 bg-rose-50 !text-rose-700";

  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
            Getting paid
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950 sm:text-4xl">
            Choose how you get paid
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 !text-slate-700">
            Start with PayPal or Stripe. Use the account you already have when
            eligible, follow the secure steps shown by that provider, and
            return to SitGuru. You only need one connected option to begin.
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-black ${
            setupComplete
              ? "border-emerald-200 bg-emerald-50 !text-emerald-700"
              : "border-amber-200 bg-amber-50 !text-amber-700"
          }`}
        >
          {setupComplete ? "You’re ready" : "Choose an option"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-emerald-100 bg-emerald-50/70 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 !text-emerald-700" />
        <p className="text-sm font-semibold leading-6 !text-slate-700">
          Your identity, bank, and PayPal information stays with PayPal or
          Stripe. SitGuru never receives your banking password or
          payment-provider password. Connect the second provider later to give
          your Pet Parents more ways to pay.
        </p>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold !text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700"
        >
          {errorMessage}
        </div>
      ) : null}

      {paypalStatus && paypalMessage ? (
        <div
          role={paypalStatus === "error" ? "alert" : "status"}
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${paypalBannerClass}`}
        >
          {paypalMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <article
          className={`rounded-[1.75rem] border p-4 sm:p-5 ${
            selectedProvider === "paypal" || paypalReady
              ? "border-[#8ab9f3] bg-[#f6f9ff] ring-2 ring-[#dceaff]"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <ProviderLogo provider="paypal" />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black !text-slate-950">
                    Get paid with PayPal
                  </h3>
                  {selectedProvider === "paypal" ? (
                    <span className="rounded-full bg-[#003087] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-white">
                      Your choice
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                  {paypalMethod?.setupSummary ||
                    "Sign in with the PayPal account you already use or create one securely."}
                </p>

                {paypalAccount?.providerEmail ? (
                  <p className="mt-2 text-sm font-black !text-[#003087]">
                    {paypalAccount.providerEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <ProviderStatusBadge
              ready={paypalReady}
              started={paypalStarted}
              selected={selectedProvider === "paypal"}
              status={
                paypalAccount?.onboardingStatus ||
                paypalAccount?.accountStatus
              }
            />
          </div>

          <SupportedCustomerMethods
            methodIds={paypalMethod?.customerMethods || []}
            processor="paypal"
          />

          <SimpleOnboardingSteps
            heading="Your simple PayPal setup"
            steps={GURU_PAYPAL_ONBOARDING_STEPS}
          />

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <form action={startGuruPayPalOnboarding}>
              <input
                type="hidden"
                name="forceNew"
                value={paypalStarted ? "false" : "true"}
              />
              <button
                type="submit"
                disabled={!paypalConfigured}
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#0070e0] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#003087] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paypalReady
                  ? "Manage PayPal"
                  : paypalStarted
                    ? "Continue PayPal setup"
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
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black !text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Check my status
              </button>
            </form>
          </div>
        </article>

        <article
          className={`rounded-[1.75rem] border p-4 sm:p-5 ${
            selectedProvider === "stripe" || stripeReady
              ? "border-violet-300 bg-violet-50/60 ring-2 ring-violet-100"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <ProviderLogo provider="stripe" />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black !text-slate-950">
                    Get paid with Stripe
                  </h3>
                  {selectedProvider === "stripe" ? (
                    <span className="rounded-full bg-[#635bff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-white">
                      Your choice
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                  {stripeMethod?.setupSummary ||
                    "Follow Stripe's secure steps to connect an eligible payout account."}
                </p>

                {stripeAccount?.providerEmail ? (
                  <p className="mt-2 text-sm font-black !text-violet-700">
                    {stripeAccount.providerEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <ProviderStatusBadge
              ready={stripeReady}
              started={stripeStarted}
              selected={selectedProvider === "stripe"}
              status={
                stripeAccount?.onboardingStatus ||
                stripeAccount?.accountStatus
              }
            />
          </div>

          <SupportedCustomerMethods
            methodIds={stripeMethod?.customerMethods || []}
            processor="stripe"
          />

          <SimpleOnboardingSteps
            heading="Your simple Stripe setup"
            steps={GURU_STRIPE_ONBOARDING_STEPS}
          />

          <form action={saveGuruPayoutProvider} className="mt-5">
            <input type="hidden" name="provider" value="stripe" />
            <button
              type="submit"
              className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-full px-5 py-3 text-sm font-black transition ${
                stripeReady
                  ? "border border-emerald-300 bg-emerald-50 !text-emerald-800"
                  : selectedProvider === "stripe"
                    ? "border border-violet-300 bg-white !text-violet-800"
                    : "bg-[#635bff] !text-white shadow-sm hover:bg-[#5148e5]"
              }`}
            >
              {stripeReady
                ? "Stripe is ready"
                : selectedProvider === "stripe"
                  ? "Stripe selected"
                  : "Choose Stripe"}
            </button>
          </form>
        </article>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-dashed border-violet-200 bg-violet-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6d1ed4] text-base font-black text-white">
              Z
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black !text-slate-950">Zelle</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-violet-700 ring-1 ring-violet-200">
                  Future option
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                SitGuru may add Zelle later for eligible manual or bank-supported
                payouts. Your Pet Parents will continue paying securely through
                SitGuru checkout.
              </p>
            </div>
          </div>

          <span className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white px-5 py-2 text-sm font-black !text-violet-700">
            Not available yet
          </span>
        </div>
      </div>

      {!setupComplete ? (
        <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black !text-slate-950">
                Need more time?
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                You can finish your Guru profile and receive booking requests
                now. Connect one payout option before accepting your first paid
                booking.
              </p>
            </div>

            <form action={saveGuruPayoutProvider}>
              <input type="hidden" name="provider" value="set_up_later" />
              <button
                type="submit"
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-black transition ${
                  selectedProvider === "set_up_later"
                    ? "border-slate-300 bg-white !text-slate-700"
                    : "border-slate-300 bg-white !text-slate-900 hover:bg-slate-100"
                }`}
              >
                {selectedProvider === "set_up_later"
                  ? "Saved for later"
                  : "Set this up later"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {!paypalConfigured ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700">
          PayPal setup is temporarily unavailable. Please contact SitGuru
          support.
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

  const recentEarnings =
    normalizedRows.length > 0
      ? normalizedRows.slice(0, 10)
      : [
          {
            id: "BK-0000",
            rawDate: "",
            date: "—",
            time: "",
            service: "No completed bookings yet",
            petParent: "Customer",
            petName: "Pet care",
            customerPhotoUrl: "",
            gross: 0,
            fee: 0,
            net: 0,
            status: "Pending",
          },
        ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Guru Earnings
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Your earnings, simplified 💰
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                SitGuru is built to support Gurus with clear earnings and
                transparent payouts. Earnings shown here reflect completed
                bookings, payout status, and what you take home after any
                applicable Marketplace Support amount. Marketplace Support is
                currently free during SitGuru&apos;s launch period.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 !text-emerald-600" />
                  Trusted Guru
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <Sparkles className="h-4 w-4 !text-amber-500" />
                  Transparent payouts
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <CalendarClock className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    Payouts become eligible 48 hours after completed care.
                  </h2>

                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    SitGuru releases Guru payouts after completed care, as long
                    as there are no open support cases, refund requests,
                    chargebacks, or trust and safety reviews. If a case is
                    opened, the related payout may be placed on hold while
                    SitGuru reviews it fairly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Earnings"
            value={currency(totalEarnings)}
            description="All time from completed bookings"
            icon={<Wallet className="h-6 w-6" />}
          />

          <StatCard
            title="Pending Payouts"
            value={currency(pendingPayouts)}
            description="Eligible after the 48-hour window"
            icon={<Clock3 className="h-6 w-6" />}
          />

          <StatCard
            title="Paid Out"
            value={currency(paidOut)}
            description="Successfully paid to you"
            icon={<PiggyBank className="h-6 w-6" />}
          />

          <StatCard
            title="This Month"
            value={currency(thisMonth)}
            description="Net earnings this month"
            icon={<CalendarDays className="h-6 w-6" />}
          />

          <StatCard
            title="Completed Bookings"
            value={String(completedBookings)}
            description="Qualified completed services"
            icon={<CheckCircle2 className="h-6 w-6" />}
          />

          <StatCard
            title="Marketplace Support"
            value={currency(marketplaceSupportTotal)}
            description="Free during the current launch period"
            icon={<BadgeDollarSign className="h-6 w-6" />}
          />
        </section>

        <PayoutSetupCard
          setup={payoutSetup}
          loadError={payoutSetupError}
          saveStatus={payoutSaveStatus}
          paypalStatus={paypalStatus}
          paypalMessage={paypalMessage}
          paypalOnboarding={paypalOnboardingResponse}
        />

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                  Booking-by-booking breakdown
                </p>
                <p className="mt-1 text-sm font-semibold !text-slate-700">
                  Booking amount and your resulting net earnings
                </p>
              </div>

              <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700 ring-1 ring-emerald-100">
                Marketplace Support: Free during launch
              </p>
            </div>

            <div className="hidden overflow-hidden rounded-[1.5rem] border border-slate-200 lg:block">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] !text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-black">Customer</th>
                    <th className="px-5 py-4 font-black">Service</th>
                    <th className="px-5 py-4 font-black">Date</th>
                    <th className="px-5 py-4 font-black">Gross</th>
                    <th className="px-5 py-4 font-black">Marketplace Support</th>
                    <th className="px-5 py-4 font-black">Net</th>
                    <th className="px-5 py-4 font-black">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentEarnings.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar
                            name={item.petParent}
                            photoUrl={item.customerPhotoUrl}
                          />

                          <div>
                            <p className="font-black !text-slate-950">
                              {item.petParent}
                            </p>
                            <p className="mt-1 text-sm font-semibold !text-slate-700">
                              {item.petName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <p className="font-bold !text-slate-900">
                          {item.service}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <p className="font-bold !text-slate-900">
                          {item.date}
                        </p>
                        <p className="mt-1 text-xs font-semibold !text-slate-600">
                          {item.time || item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-middle font-bold !text-slate-900">
                        {currency(item.gross)}
                      </td>

                      <td className="px-5 py-4 align-middle font-bold !text-rose-500">
                        -{currency(item.fee)}
                      </td>

                      <td className="px-5 py-4 align-middle font-black !text-emerald-700">
                        {currency(item.net)}
                      </td>

                      <td className="px-5 py-4 align-middle">
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

            <div className="grid gap-4 lg:hidden">
              {recentEarnings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <CustomerAvatar
                      name={item.petParent}
                      photoUrl={item.customerPhotoUrl}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black !text-slate-950">
                            {item.petParent}
                          </p>
                          <p className="mt-1 text-sm font-semibold !text-slate-700">
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

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="font-black !text-slate-600">Gross</p>
                          <p className="mt-1 font-black !text-slate-950">
                            {currency(item.gross)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="font-black !text-slate-600">Marketplace Support</p>
                          <p className="mt-1 font-black !text-rose-500">
                            -{currency(item.fee)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="font-black !text-slate-600">Net</p>
                          <p className="mt-1 font-black !text-emerald-700">
                            {currency(item.net)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-semibold !text-slate-600">
                        {item.date} {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/guru/dashboard/bookings"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-black !text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                View all earnings activity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                How earnings work
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                Simple and transparent
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black !text-slate-950">
                      Gross booking total
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                      The service subtotal tied to the completed booking
                      before adjustments, refunds, or any future Marketplace
                      Support amount.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 !text-rose-600">
                    <BadgeDollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black !text-slate-950">
                      Marketplace Support (currently free)
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                      SitGuru is not deducting any Marketplace Support amount
                      during the current launch period. Any future Marketplace
                      Support amount will be disclosed before it applies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black !text-slate-950">Net earnings</p>
                    <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                      What you take home after any applicable Marketplace
                      Support amount. Customer tips pass through 100% to you.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                Referrals & Growth
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                More ways to grow
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/guru/dashboard/referrals"
                  className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black !text-slate-950">
                        Refer a Guru
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        Invite another great Guru to SitGuru.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 !text-slate-500 transition group-hover:!text-emerald-700" />
                </Link>

                <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black !text-slate-950">
                      Referral Tracking
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                      Track referrals, rewards, and growth opportunities.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-dashed border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black !text-emerald-800">
                    Coming Soon
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                    SitGuru plans to support referral and affiliate
                    opportunities as the platform grows.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                <HelpCircle className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  Marketplace Support is free during launch
                </p>
                <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 !text-slate-700">
                  SitGuru’s current launch model keeps Marketplace Support
                  free for Gurus while preserving secure payments, customer
                  support, safety tools, and transparent booking records.
                  Customer tips pass through 100% to the Guru.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-black !text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/help"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                View Help Center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}