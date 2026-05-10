import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  plan?: string;
  approval?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type GuruBackgroundCheckRow = {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  background_check_status: string | null;
  background_check_completed_at: string | null;
  checkr_candidate_id: string | null;
  checkr_report_id: string | null;
  checkr_invitation_id: string | null;
  checkr_invitation_url: string | null;
  checkr_package_slug: string | null;
  checkr_last_webhook_at: string | null;
  created_at: string | null;
};

type GuruBackgroundCheckDetail = {
  guru_id: string;
  status: string | null;
  checkr_candidate_id: string | null;
  checkr_invitation_id: string | null;
  checkr_report_id: string | null;
  package_slug: string | null;
  invitation_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_webhook_at: string | null;
};

type TrustSafetyPurchaseRow = {
  id: string;
  guru_id: string | null;
  user_id: string | null;
  email: string | null;
  plan_key: string;
  plan_name: string;
  payment_model: string;
  gross_plan_value_cents: number | null;
  due_today_cents: number | null;
  down_payment_cents: number | null;
  amount_paid_cents: number | null;
  remaining_balance_cents: number | null;
  installment_count: number | null;
  installment_amount_cents: number | null;
  installments_paid_count: number | null;
  booking_deduction_required: boolean | null;
  booking_deduction_agreement_accepted: boolean | null;
  booking_deduction_collected_cents: number | null;
  booking_deduction_remaining_cents: number | null;
  management_approval_required: boolean | null;
  management_approval_status: string | null;
  management_approved_by_email: string | null;
  management_approved_at: string | null;
  management_denied_reason: string | null;
  payment_status: string | null;
  repayment_status: string | null;
  checkr_invite_allowed: boolean | null;
  checkr_invite_blocked_reason: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  paid_at: string | null;
  created_at: string | null;
};

type BackgroundCheckDisplayRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  statusLabel: string;
  candidateId: string;
  invitationId: string;
  reportId: string;
  packageSlug: string;
  invitationUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  lastWebhookAt: string | null;
  createdAt: string | null;
  reviewHref: string;

  purchaseId: string;
  planKey: string;
  planName: string;
  paymentModel: string;
  grossPlanValueCents: number;
  dueTodayCents: number;
  amountPaidCents: number;
  remainingBalanceCents: number;
  installmentCount: number;
  installmentAmountCents: number;
  installmentsPaidCount: number;
  bookingDeductionRequired: boolean;
  bookingDeductionAgreementAccepted: boolean;
  bookingDeductionCollectedCents: number;
  bookingDeductionRemainingCents: number;
  managementApprovalRequired: boolean;
  managementApprovalStatus: string;
  managementApprovedByEmail: string;
  managementApprovedAt: string | null;
  managementDeniedReason: string;
  paymentStatus: string;
  repaymentStatus: string;
  checkrInviteAllowed: boolean;
  checkrInviteBlockedReason: string;
  paidAt: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  stripeSubscriptionId: string;
};

type QueueConfig = {
  key: string;
  label: string;
  title: string;
  description: string;
};

const STATUS_OPTIONS = [
  "not_started",
  "invited",
  "pending",
  "clear",
  "consider",
  "suspended",
  "canceled",
  "failed",
];

const planLabels: Record<string, string> = {
  paw_in_full: "Paw in Full",
  pawstep_plan: "Pawstep Plan",
  book_and_bark_plan: "Book & Bark Plan",
};

const queueConfigs: Record<string, QueueConfig> = {
  not_started: {
    key: "not_started",
    label: "Not Started",
    title: "Not Started Background Checks",
    description:
      "Gurus who still need a Checkr invitation started. Use this queue to begin Trust & Safety screening before a Guru becomes bookable.",
  },
  pending: {
    key: "pending",
    label: "Invited / Pending",
    title: "Invited / Pending Background Checks",
    description:
      "Gurus with a Checkr invitation sent or a report still processing. Use this queue to monitor progress and follow up when needed.",
  },
  clear: {
    key: "clear",
    label: "Clear",
    title: "Clear Background Checks",
    description:
      "Gurus who have cleared background check review. Use this queue to continue approval readiness and bookable review.",
  },
  review: {
    key: "review",
    label: "Needs Review",
    title: "Background Checks Needing Review",
    description:
      "Gurus with Checkr or Admin review signals such as consider, failed, suspended, or canceled. Use this queue for trust and safety follow-up.",
  },
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl;
  }

  return `https://${siteUrl}`;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cents(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeStatus(value?: string | null) {
  const normalized = asTrimmedString(value).toLowerCase();

  if (!normalized) return "not_started";

  if (STATUS_OPTIONS.includes(normalized)) {
    return normalized;
  }

  return "not_started";
}

function getStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "not_started":
      return "Not Started";
    case "invited":
      return "Invited";
    case "pending":
      return "Pending";
    case "clear":
      return "Clear";
    case "consider":
      return "Needs Review";
    case "suspended":
      return "Suspended";
    case "canceled":
      return "Canceled";
    case "failed":
      return "Failed";
    default:
      return "Not Started";
  }
}

function getDisplayName(guru: GuruBackgroundCheckRow) {
  return guru.name || guru.full_name || guru.email || "Unnamed Guru";
}

function getLocation(guru: GuruBackgroundCheckRow) {
  return [guru.city, guru.state].filter(Boolean).join(", ") || "No location";
}

function getStatusClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "clear":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "consider":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "pending":
    case "invited":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "suspended":
    case "failed":
    case "canceled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPaymentClass(status: string) {
  switch (status) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "partially_paid":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "failed":
    case "refunded":
    case "canceled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getApprovalClass(status: string) {
  switch (status) {
    case "approved":
    case "not_required":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "denied":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getReadyClass(allowed: boolean) {
  return allowed
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function getPaymentLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partially_paid":
      return "Partially Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    case "canceled":
      return "Canceled";
    default:
      return "Pending";
  }
}

function getApprovalLabel(status: string) {
  switch (status) {
    case "not_required":
      return "Not Required";
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    default:
      return "Pending";
  }
}

function getPaymentModelLabel(value: string) {
  switch (value) {
    case "paid_in_full":
      return "Paid in full";
    case "monthly_installments":
      return "Monthly installments";
    case "booking_deductions":
      return "Booking deductions";
    default:
      return "Not selected";
  }
}

function isPendingOrInvited(status: string) {
  return status === "invited" || status === "pending";
}

function isNeedsReview(status: string) {
  return (
    status === "consider" ||
    status === "suspended" ||
    status === "canceled" ||
    status === "failed"
  );
}

function getActiveQueue(status?: string) {
  const normalized = asTrimmedString(status).toLowerCase();

  if (normalized === "not_started") return queueConfigs.not_started;
  if (normalized === "pending" || normalized === "invited") {
    return queueConfigs.pending;
  }
  if (normalized === "clear") return queueConfigs.clear;
  if (normalized === "review") return queueConfigs.review;

  return null;
}

function filterRows(rows: BackgroundCheckDisplayRow[], params: SearchParams) {
  const status = asTrimmedString(params.status).toLowerCase();
  const plan = asTrimmedString(params.plan).toLowerCase();
  const approval = asTrimmedString(params.approval).toLowerCase();

  return rows.filter((row) => {
    if (status && status !== "all") {
      if (status === "not_started" && row.status !== "not_started") {
        return false;
      }

      if (
        (status === "pending" || status === "invited") &&
        !isPendingOrInvited(row.status)
      ) {
        return false;
      }

      if (status === "clear" && row.status !== "clear") {
        return false;
      }

      if (status === "review" && !isNeedsReview(row.status)) {
        return false;
      }
    }

    if (plan && plan !== "all" && row.planKey !== plan) {
      return false;
    }

    if (approval && approval !== "all") {
      if (approval === "pending" && row.managementApprovalStatus !== "pending") {
        return false;
      }

      if (
        approval === "approved" &&
        row.managementApprovalStatus !== "approved"
      ) {
        return false;
      }

      if (approval === "denied" && row.managementApprovalStatus !== "denied") {
        return false;
      }

      if (
        approval === "ready" &&
        row.checkrInviteAllowed !== true
      ) {
        return false;
      }

      if (
        approval === "blocked" &&
        row.checkrInviteAllowed === true
      ) {
        return false;
      }
    }

    return true;
  });
}

function backgroundStatusHref(status: string) {
  return `/admin/background-checks?status=${encodeURIComponent(status)}`;
}

function planHref(plan: string) {
  return `/admin/background-checks?plan=${encodeURIComponent(plan)}`;
}

function approvalHref(approval: string) {
  return `/admin/background-checks?approval=${encodeURIComponent(approval)}`;
}

async function updateGuruBackgroundStatus(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");
  const status = String(formData.get("status") || "");

  if (!guruId || !STATUS_OPTIONS.includes(status)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const completedAt =
    status === "clear" ||
    status === "consider" ||
    status === "failed" ||
    status === "canceled"
      ? now
      : null;

  await supabase
    .from("gurus")
    .update({
      background_check_status: status,
      background_check_completed_at: completedAt,
      checkr_last_webhook_at: now,
    })
    .eq("id", guruId);

  await supabase.from("guru_background_checks").upsert(
    {
      guru_id: guruId,
      status,
      completed_at: completedAt,
      last_webhook_at: now,
    },
    {
      onConflict: "guru_id",
    },
  );

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

async function approveTrustSafetyPlan(formData: FormData) {
  "use server";

  const purchaseId = String(formData.get("purchaseId") || "");
  const guruId = String(formData.get("guruId") || "");

  if (!purchaseId || !guruId) return;

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: purchase } = await supabase
    .from("guru_trust_safety_plan_purchases")
    .select("id,guru_id,user_id,plan_key,plan_name,payment_model")
    .eq("id", purchaseId)
    .maybeSingle();

  await supabase
    .from("guru_trust_safety_plan_purchases")
    .update({
      management_approval_status: "approved",
      management_approved_by_email: "SitGuru Admin",
      management_approved_at: now,
      management_denied_reason: null,
      notes: "Management approved this financed Trust & Safety plan.",
    })
    .eq("id", purchaseId);

  if (purchase) {
    await supabase.from("trust_safety_financial_events").insert({
      purchase_id: purchaseId,
      guru_id: guruId,
      user_id: purchase.user_id,
      event_type: "ledger_adjustment",
      category: "trust_safety",
      source: "manual",
      status: "posted",
      plan_key: purchase.plan_key,
      plan_name: purchase.plan_name,
      gross_amount_cents: 0,
      fee_amount_cents: 0,
      net_amount_cents: 0,
      currency: "usd",
      description:
        "Management approved financed Trust & Safety plan before Checkr invite.",
      metadata: {
        action: "management_approved",
        approved_by_email: "SitGuru Admin",
      },
      occurred_at: now,
      created_at: now,
      updated_at: now,
    });
  }

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

async function denyTrustSafetyPlan(formData: FormData) {
  "use server";

  const purchaseId = String(formData.get("purchaseId") || "");
  const guruId = String(formData.get("guruId") || "");
  const reason =
    String(formData.get("reason") || "").trim() ||
    "Management denied this financed Trust & Safety plan.";

  if (!purchaseId || !guruId) return;

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: purchase } = await supabase
    .from("guru_trust_safety_plan_purchases")
    .select("id,guru_id,user_id,plan_key,plan_name,payment_model")
    .eq("id", purchaseId)
    .maybeSingle();

  await supabase
    .from("guru_trust_safety_plan_purchases")
    .update({
      management_approval_status: "denied",
      management_denied_reason: reason,
      checkr_invite_allowed: false,
      checkr_invite_blocked_reason: reason,
      notes: reason,
    })
    .eq("id", purchaseId);

  if (purchase) {
    await supabase.from("trust_safety_financial_events").insert({
      purchase_id: purchaseId,
      guru_id: guruId,
      user_id: purchase.user_id,
      event_type: "ledger_adjustment",
      category: "trust_safety",
      source: "manual",
      status: "posted",
      plan_key: purchase.plan_key,
      plan_name: purchase.plan_name,
      gross_amount_cents: 0,
      fee_amount_cents: 0,
      net_amount_cents: 0,
      currency: "usd",
      description: "Management denied financed Trust & Safety plan.",
      metadata: {
        action: "management_denied",
        reason,
      },
      occurred_at: now,
      created_at: now,
      updated_at: now,
    });
  }

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

async function startCheckrInvite(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");

  if (!guruId) {
    return;
  }

  try {
    await fetch(`${getSiteUrl()}/api/checkr/create-invitation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ guruId }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Failed to start Checkr invite from background checks:", error);
  }

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

function StatCard({
  label,
  value,
  detail,
  href,
  active = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 ${
        active
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
      <p className="mt-4 text-sm font-black text-emerald-700">
        Open queue →
      </p>
    </Link>
  );
}

function QueueBanner({
  queue,
  shown,
}: {
  queue: QueueConfig;
  shown: number;
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Checkr Work Queue
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
            {queue.title}
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 text-emerald-800">
            {queue.description}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white px-6 py-5 text-center">
          <p className="text-3xl font-black text-emerald-950">
            {shown.toLocaleString()}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            Gurus in queue
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/guru-approvals"
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        >
          ← Back to Approvals Hub
        </Link>

        <Link
          href="/admin/background-checks"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        >
          Clear Checkr filter
        </Link>
      </div>
    </section>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {children}
    </span>
  );
}

function FinancialBlock({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function AdminControls({ row }: { row: BackgroundCheckDisplayRow }) {
  return (
    <div className="grid gap-3">
      {row.managementApprovalRequired &&
      row.managementApprovalStatus === "pending" ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">
            Management approval required
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
            SitGuru is fronting part of this plan and must approve before Checkr
            can start.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <form action={approveTrustSafetyPlan}>
              <input type="hidden" name="purchaseId" value={row.purchaseId} />
              <input type="hidden" name="guruId" value={row.id} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                Approve Plan
              </button>
            </form>

            <form action={denyTrustSafetyPlan} className="grid gap-2">
              <input type="hidden" name="purchaseId" value={row.purchaseId} />
              <input type="hidden" name="guruId" value={row.id} />
              <input
                name="reason"
                placeholder="Optional reason"
                className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-50"
              >
                Deny
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <form action={startCheckrInvite}>
        <input type="hidden" name="guruId" value={row.id} />
        <button
          type="submit"
          disabled={!row.checkrInviteAllowed}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition ${
            row.checkrInviteAllowed
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          {row.checkrInviteAllowed
            ? "Start Checkr Invite"
            : "Checkr Blocked"}
        </button>
      </form>

      {row.checkrInviteBlockedReason && !row.checkrInviteAllowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
          {row.checkrInviteBlockedReason}
        </div>
      ) : null}

      {row.invitationUrl ? (
        <Link
          href={row.invitationUrl}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-100"
        >
          Open Checkr Invite
        </Link>
      ) : null}

      <form action={updateGuruBackgroundStatus} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="guruId" value={row.id} />
        <select
          name="status"
          defaultValue={row.status}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {getStatusLabel(option)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Save
        </button>
      </form>

      <Link
        href={row.reviewHref}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      >
        Review Guru
      </Link>
    </div>
  );
}

function BackgroundCheckCard({ row }: { row: BackgroundCheckDisplayRow }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              {row.name}
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-600">{row.email}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {row.location}
            </p>
            <p className="mt-2 break-all text-xs font-semibold text-slate-400">
              Guru ID: {row.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Pill className={getStatusClass(row.status)}>
              Checkr: {row.statusLabel}
            </Pill>
            <Pill className={getPaymentClass(row.paymentStatus)}>
              Payment: {getPaymentLabel(row.paymentStatus)}
            </Pill>
            <Pill className={getApprovalClass(row.managementApprovalStatus)}>
              Approval: {getApprovalLabel(row.managementApprovalStatus)}
            </Pill>
            <Pill className={getReadyClass(row.checkrInviteAllowed)}>
              {row.checkrInviteAllowed ? "Checkr Ready" : "Checkr Blocked"}
            </Pill>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FinancialBlock
              label="Plan"
              value={row.planName}
              helper={getPaymentModelLabel(row.paymentModel)}
            />
            <FinancialBlock
              label="Paid"
              value={dollars(row.amountPaidCents)}
              helper={`Due today: ${dollars(row.dueTodayCents)}`}
            />
            <FinancialBlock
              label="Remaining"
              value={dollars(row.remainingBalanceCents)}
              helper={
                row.bookingDeductionRequired
                  ? `${dollars(row.bookingDeductionRemainingCents)} from bookings`
                  : row.installmentCount
                    ? `${row.installmentsPaidCount}/${row.installmentCount} installments paid`
                    : "No remaining balance"
              }
            />
            <FinancialBlock
              label="Plan Value"
              value={dollars(row.grossPlanValueCents)}
              helper={
                row.paidAt ? `Paid: ${formatDate(row.paidAt)}` : "Awaiting payment"
              }
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Checkr Details
              </p>
              <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
                <p>
                  <span className="font-black text-slate-900">Candidate:</span>{" "}
                  {row.candidateId}
                </p>
                <p>
                  <span className="font-black text-slate-900">Invitation:</span>{" "}
                  {row.invitationId}
                </p>
                <p>
                  <span className="font-black text-slate-900">Report:</span>{" "}
                  {row.reportId}
                </p>
                <p>
                  <span className="font-black text-slate-900">Package:</span>{" "}
                  {row.packageSlug}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Timeline
              </p>
              <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
                <p>
                  <span className="font-black text-slate-900">Started:</span>{" "}
                  {formatDate(row.startedAt)}
                </p>
                <p>
                  <span className="font-black text-slate-900">Completed:</span>{" "}
                  {formatDate(row.completedAt)}
                </p>
                <p>
                  <span className="font-black text-slate-900">Webhook:</span>{" "}
                  {formatDate(row.lastWebhookAt)}
                </p>
                <p>
                  <span className="font-black text-slate-900">Approval:</span>{" "}
                  {formatDate(row.managementApprovedAt)}
                </p>
              </div>
            </div>
          </div>

          {row.managementDeniedReason ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
              Denial reason: {row.managementDeniedReason}
            </div>
          ) : null}
        </div>

        <div className="xl:col-span-4">
          <AdminControls row={row} />
        </div>
      </div>
    </article>
  );
}

export default async function AdminBackgroundChecksPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeQueue = getActiveQueue(resolvedSearchParams.status);

  const supabase = getSupabaseAdminClient();

  const { data: gurus, error: gurusError } = await supabase
    .from("gurus")
    .select(
      [
        "id",
        "name",
        "full_name",
        "email",
        "phone",
        "city",
        "state",
        "background_check_status",
        "background_check_completed_at",
        "checkr_candidate_id",
        "checkr_report_id",
        "checkr_invitation_id",
        "checkr_invitation_url",
        "checkr_package_slug",
        "checkr_last_webhook_at",
        "created_at",
      ].join(","),
    )
    .order("created_at", { ascending: false });

  const { data: backgroundChecks } = await supabase
    .from("guru_background_checks")
    .select(
      [
        "guru_id",
        "status",
        "checkr_candidate_id",
        "checkr_invitation_id",
        "checkr_report_id",
        "package_slug",
        "invitation_url",
        "started_at",
        "completed_at",
        "last_webhook_at",
      ].join(","),
    );

  const { data: trustSafetyPurchases } = await supabase
    .from("guru_trust_safety_plan_purchases")
    .select(
      [
        "id",
        "guru_id",
        "user_id",
        "email",
        "plan_key",
        "plan_name",
        "payment_model",
        "gross_plan_value_cents",
        "due_today_cents",
        "down_payment_cents",
        "amount_paid_cents",
        "remaining_balance_cents",
        "installment_count",
        "installment_amount_cents",
        "installments_paid_count",
        "booking_deduction_required",
        "booking_deduction_agreement_accepted",
        "booking_deduction_collected_cents",
        "booking_deduction_remaining_cents",
        "management_approval_required",
        "management_approval_status",
        "management_approved_by_email",
        "management_approved_at",
        "management_denied_reason",
        "payment_status",
        "repayment_status",
        "checkr_invite_allowed",
        "checkr_invite_blocked_reason",
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
        "stripe_subscription_id",
        "paid_at",
        "created_at",
      ].join(","),
    )
    .order("created_at", { ascending: false });

  const backgroundCheckByGuruId = new Map<string, GuruBackgroundCheckDetail>();

  const safeBackgroundChecks = Array.isArray(backgroundChecks)
    ? (backgroundChecks as unknown as GuruBackgroundCheckDetail[])
    : [];

  safeBackgroundChecks.forEach((check) => {
    if (check?.guru_id) {
      backgroundCheckByGuruId.set(check.guru_id, check);
    }
  });

  const purchaseByGuruId = new Map<string, TrustSafetyPurchaseRow>();

  const safePurchases = Array.isArray(trustSafetyPurchases)
    ? (trustSafetyPurchases as unknown as TrustSafetyPurchaseRow[])
    : [];

  safePurchases.forEach((purchase) => {
    if (purchase?.guru_id && !purchaseByGuruId.has(purchase.guru_id)) {
      purchaseByGuruId.set(purchase.guru_id, purchase);
    }
  });

  const guruRows = Array.isArray(gurus)
    ? (gurus as unknown as GuruBackgroundCheckRow[])
    : [];

  const rows: BackgroundCheckDisplayRow[] = guruRows.map((guru) => {
    const check = backgroundCheckByGuruId.get(guru.id);
    const purchase = purchaseByGuruId.get(guru.id);
    const status = normalizeStatus(
      check?.status || guru.background_check_status,
    );

    return {
      id: guru.id,
      name: getDisplayName(guru),
      email: guru.email || "No email",
      phone: guru.phone || "No phone",
      location: getLocation(guru),
      status,
      statusLabel: getStatusLabel(status),
      candidateId:
        check?.checkr_candidate_id || guru.checkr_candidate_id || "—",
      invitationId:
        check?.checkr_invitation_id || guru.checkr_invitation_id || "—",
      reportId: check?.checkr_report_id || guru.checkr_report_id || "—",
      packageSlug: check?.package_slug || guru.checkr_package_slug || "—",
      invitationUrl: check?.invitation_url || guru.checkr_invitation_url || "",
      startedAt: check?.started_at || null,
      completedAt:
        check?.completed_at || guru.background_check_completed_at || null,
      lastWebhookAt:
        check?.last_webhook_at || guru.checkr_last_webhook_at || null,
      createdAt: guru.created_at,
      reviewHref: `/admin/gurus/${encodeURIComponent(guru.id)}`,

      purchaseId: purchase?.id || "",
      planKey: purchase?.plan_key || "not_selected",
      planName:
        purchase?.plan_name ||
        planLabels[purchase?.plan_key || ""] ||
        "No plan selected",
      paymentModel: purchase?.payment_model || "not_selected",
      grossPlanValueCents: cents(purchase?.gross_plan_value_cents),
      dueTodayCents: cents(purchase?.due_today_cents),
      amountPaidCents: cents(purchase?.amount_paid_cents),
      remainingBalanceCents: cents(purchase?.remaining_balance_cents),
      installmentCount: cents(purchase?.installment_count),
      installmentAmountCents: cents(purchase?.installment_amount_cents),
      installmentsPaidCount: cents(purchase?.installments_paid_count),
      bookingDeductionRequired: Boolean(purchase?.booking_deduction_required),
      bookingDeductionAgreementAccepted: Boolean(
        purchase?.booking_deduction_agreement_accepted,
      ),
      bookingDeductionCollectedCents: cents(
        purchase?.booking_deduction_collected_cents,
      ),
      bookingDeductionRemainingCents: cents(
        purchase?.booking_deduction_remaining_cents,
      ),
      managementApprovalRequired: Boolean(
        purchase?.management_approval_required,
      ),
      managementApprovalStatus:
        purchase?.management_approval_status ||
        (purchase?.management_approval_required ? "pending" : "not_required"),
      managementApprovedByEmail: purchase?.management_approved_by_email || "—",
      managementApprovedAt: purchase?.management_approved_at || null,
      managementDeniedReason: purchase?.management_denied_reason || "",
      paymentStatus: purchase?.payment_status || "pending",
      repaymentStatus: purchase?.repayment_status || "not_started",
      checkrInviteAllowed: Boolean(purchase?.checkr_invite_allowed),
      checkrInviteBlockedReason:
        purchase?.checkr_invite_blocked_reason ||
        (!purchase
          ? "No Trust & Safety plan has been selected yet."
          : ""),
      paidAt: purchase?.paid_at || null,
      stripeCheckoutSessionId: purchase?.stripe_checkout_session_id || "—",
      stripePaymentIntentId: purchase?.stripe_payment_intent_id || "—",
      stripeSubscriptionId: purchase?.stripe_subscription_id || "—",
    };
  });

  const filteredRows = filterRows(rows, resolvedSearchParams);

  const total = rows.length;
  const clearCount = rows.filter((row) => row.status === "clear").length;
  const pendingCount = rows.filter((row) => isPendingOrInvited(row.status)).length;
  const needsReviewCount = rows.filter((row) => isNeedsReview(row.status)).length;
  const notStartedCount = rows.filter((row) => row.status === "not_started").length;

  const trustRevenueCents = rows.reduce(
    (sum, row) => sum + row.amountPaidCents,
    0,
  );
  const trustOutstandingCents = rows.reduce(
    (sum, row) => sum + row.remainingBalanceCents,
    0,
  );
  const bookingDeductionBalanceCents = rows.reduce(
    (sum, row) => sum + row.bookingDeductionRemainingCents,
    0,
  );
  const approvalNeededCount = rows.filter(
    (row) =>
      row.managementApprovalRequired &&
      row.managementApprovalStatus === "pending",
  ).length;
  const checkrReadyCount = rows.filter((row) => row.checkrInviteAllowed).length;
  const planSelectedCount = rows.filter((row) => row.planKey !== "not_selected")
    .length;
  const paidOrPartialCount = rows.filter(
    (row) => row.paymentStatus === "paid" || row.paymentStatus === "partially_paid",
  ).length;

  const pawInFullCount = rows.filter((row) => row.planKey === "paw_in_full").length;
  const pawstepCount = rows.filter((row) => row.planKey === "pawstep_plan").length;
  const bookAndBarkCount = rows.filter(
    (row) => row.planKey === "book_and_bark_plan",
  ).length;

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_28%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_52%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Admin Portal
              </span>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Trust & Safety Command Center
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Track Trust & Safety plan payments, financed-plan management
                approvals, remaining balances, booking deduction exposure,
                Checkr invitation readiness, and background check status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/guru-approvals"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Back to Approvals
              </Link>

              <Link
                href="/admin/gurus"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Review Gurus
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                Open Admin
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Trust & Safety Revenue"
              value={dollars(trustRevenueCents)}
              detail="Collected plan payments recorded from Stripe"
              href="/admin/background-checks"
            />

            <StatCard
              label="Outstanding Balance"
              value={dollars(trustOutstandingCents)}
              detail="Remaining Pawstep and Book & Bark balances"
              href={approvalHref("blocked")}
            />

            <StatCard
              label="Management Approval Needed"
              value={approvalNeededCount}
              detail="Financed plans awaiting management approval"
              href={approvalHref("pending")}
              active={resolvedSearchParams.approval === "pending"}
            />

            <StatCard
              label="Checkr Ready"
              value={checkrReadyCount}
              detail="Financially cleared plans ready for Checkr invite"
              href={approvalHref("ready")}
              active={resolvedSearchParams.approval === "ready"}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Plans Selected"
            value={planSelectedCount}
            detail={`${paidOrPartialCount.toLocaleString()} have paid or partially paid`}
            href="/admin/background-checks"
          />

          <StatCard
            label="Paw in Full"
            value={pawInFullCount}
            detail="Full upfront Trust & Safety payment"
            href={planHref("paw_in_full")}
            active={resolvedSearchParams.plan === "paw_in_full"}
          />

          <StatCard
            label="Pawstep Plan"
            value={pawstepCount}
            detail="Management-approved monthly repayment plan"
            href={planHref("pawstep_plan")}
            active={resolvedSearchParams.plan === "pawstep_plan"}
          />

          <StatCard
            label="Book & Bark Plan"
            value={bookAndBarkCount}
            detail={`${dollars(bookingDeductionBalanceCents)} remaining from bookings`}
            href={planHref("book_and_bark_plan")}
            active={resolvedSearchParams.plan === "book_and_bark_plan"}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Checkr Control
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Background check command center
              </h2>

              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                Start Checkr invitations only after the Guru&apos;s Trust & Safety
                plan is financially cleared. Pawstep and Book & Bark require
                management approval before Checkr can start.
              </p>
            </div>

            <Link
              href="/admin/guru-approvals"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
              Back to Guru Approvals
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Not Started"
              value={notStartedCount}
              detail="Gurus who still need a Checkr invite"
              href={backgroundStatusHref("not_started")}
              active={activeQueue?.key === "not_started"}
            />

            <StatCard
              label="Invited / Pending"
              value={pendingCount}
              detail="Checkr invite sent or report processing"
              href={backgroundStatusHref("pending")}
              active={activeQueue?.key === "pending"}
            />

            <StatCard
              label="Clear"
              value={clearCount}
              detail="Gurus cleared by Checkr"
              href={backgroundStatusHref("clear")}
              active={activeQueue?.key === "clear"}
            />

            <StatCard
              label="Needs Review"
              value={needsReviewCount}
              detail="Checkr status requires Admin attention"
              href={backgroundStatusHref("review")}
              active={activeQueue?.key === "review"}
            />
          </div>
        </section>

        {activeQueue ? (
          <QueueBanner queue={activeQueue} shown={filteredRows.length} />
        ) : null}

        {gurusError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-black text-rose-700">
            Unable to load Guru background check data: {gurusError.message}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Trust & Safety Records
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {activeQueue ? activeQueue.title : "All Trust & Safety records"}
              </h2>

              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                {activeQueue
                  ? activeQueue.description
                  : "Review each Guru&apos;s plan, payment status, remaining balance, approval status, Checkr readiness, and background check progress."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              {filteredRows.length.toLocaleString()} shown /{" "}
              {total.toLocaleString()} total
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <BackgroundCheckCard key={row.id} row={row} />
              ))
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <p className="text-lg font-black text-slate-950">
                  No Gurus found for this Trust & Safety queue.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Clear filters or return to all background checks.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `gurus`, `guru_background_checks`, and
          `guru_trust_safety_plan_purchases`. It displays Trust & Safety plan
          revenue, remaining balances, management approvals, booking deduction
          exposure, Checkr readiness, invitation data, report IDs, webhook
          timestamps, and Guru review links from live rows.
        </div>
      </div>
    </main>
  );
}