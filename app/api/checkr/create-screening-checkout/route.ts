import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

type PaymentOption =
  | "pay_full_today"
  | "pay_15_three_monthly"
  | "pay_15_booking_deductions";

type PlanKey = "paw_in_full" | "pawstep_plan" | "book_and_bark_plan";

type PaymentModel =
  | "paid_in_full"
  | "monthly_installments"
  | "booking_deductions";

type GuruForScreeningCheckout = {
  id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  name: string | null;
  background_check_fee_status: string | null;
  background_check_fee_payment_option: string | null;
  background_check_fee_paid_at: string | null;
};

type PaymentOptionConfig = {
  planKey: PlanKey;
  planName: string;
  label: string;
  checkoutMode: "payment" | "subscription";
  paymentModel: PaymentModel;
  totalCents: number;
  payTodayCents: number;
  remainingAfterTodayCents: number;
  monthlyCents?: number;
  installmentCount: number;
  managementApprovalRequired: boolean;
  bookingDeductionRequired: boolean;
  feeStatus: "checkout_started";
  paymentPlanStatus: string;
  reimbursementBalance: number;
  reimbursementStatus: string;
  badge: "launch_pro_guru" | "pawstep_starter" | "book_bark_starter";
};

type ExistingTrustSafetyPurchase = {
  id: string;
  payment_status: string | null;
  repayment_status: string | null;
  stripe_checkout_session_id: string | null;
};

const PAW_IN_FULL_TOTAL_CENTS = 3799;
const FLEXIBLE_PLAN_TOTAL_CENTS = 3999;
const LAUNCH_TODAY_CENTS = 1500;
const FLEXIBLE_REMAINING_CENTS =
  FLEXIBLE_PLAN_TOTAL_CENTS - LAUNCH_TODAY_CENTS;
const PAWSTEP_MONTHLY_CENTS = 833;
const PAWSTEP_TRIAL_DAYS = 30;

const PAYMENT_OPTIONS: Record<PaymentOption, PaymentOptionConfig> = {
  pay_full_today: {
    planKey: "paw_in_full",
    planName: "Paw in Full",
    label: "Paw in Full - SitGuru Trust & Safety Screening",
    checkoutMode: "payment",
    paymentModel: "paid_in_full",
    totalCents: PAW_IN_FULL_TOTAL_CENTS,
    payTodayCents: PAW_IN_FULL_TOTAL_CENTS,
    remainingAfterTodayCents: 0,
    installmentCount: 0,
    managementApprovalRequired: false,
    bookingDeductionRequired: false,
    feeStatus: "checkout_started",
    paymentPlanStatus: "not_started",
    reimbursementBalance: 0,
    reimbursementStatus: "not_started",
    badge: "launch_pro_guru",
  },
  pay_15_three_monthly: {
    planKey: "pawstep_plan",
    planName: "Pawstep Plan",
    label: "Pawstep Plan - SitGuru Trust & Safety Screening",
    checkoutMode: "subscription",
    paymentModel: "monthly_installments",
    totalCents: FLEXIBLE_PLAN_TOTAL_CENTS,
    payTodayCents: LAUNCH_TODAY_CENTS,
    remainingAfterTodayCents: FLEXIBLE_REMAINING_CENTS,
    monthlyCents: PAWSTEP_MONTHLY_CENTS,
    installmentCount: 3,
    managementApprovalRequired: true,
    bookingDeductionRequired: false,
    feeStatus: "checkout_started",
    paymentPlanStatus: "pending_monthly_setup",
    reimbursementBalance: 0,
    reimbursementStatus: "not_started",
    badge: "pawstep_starter",
  },
  pay_15_booking_deductions: {
    planKey: "book_and_bark_plan",
    planName: "Book & Bark Plan",
    label: "Book & Bark Plan - SitGuru Trust & Safety Screening",
    checkoutMode: "payment",
    paymentModel: "booking_deductions",
    totalCents: FLEXIBLE_PLAN_TOTAL_CENTS,
    payTodayCents: LAUNCH_TODAY_CENTS,
    remainingAfterTodayCents: FLEXIBLE_REMAINING_CENTS,
    installmentCount: 0,
    managementApprovalRequired: true,
    bookingDeductionRequired: true,
    feeStatus: "checkout_started",
    paymentPlanStatus: "booking_deductions_pending",
    reimbursementBalance: FLEXIBLE_REMAINING_CENTS / 100,
    reimbursementStatus: "covered_by_sitguru",
    badge: "book_bark_starter",
  },
};

function getBaseUrl(req: NextRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl.replace(/\/$/, "")
      : `https://${configuredUrl.replace(/\/$/, "")}`;
  }

  return req.nextUrl.origin;
}

function isPaymentOption(value: unknown): value is PaymentOption {
  return (
    value === "pay_full_today" ||
    value === "pay_15_three_monthly" ||
    value === "pay_15_booking_deductions"
  );
}

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function centsToDollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function getPlanDisplayName(paymentOption: PaymentOption) {
  return PAYMENT_OPTIONS[paymentOption].planName;
}

function getCheckoutMetadata(params: {
  guruId: string;
  userId: string;
  email: string;
  paymentOption: PaymentOption;
  option: PaymentOptionConfig;
}) {
  return {
    purpose: "trust_safety_screening",
    guru_id: params.guruId,
    user_id: params.userId,
    email: params.email,
    payment_option: params.paymentOption,
    plan_key: params.option.planKey,
    plan_label: params.option.planName,
    payment_model: params.option.paymentModel,
    screening_total_cents: String(params.option.totalCents),
    paid_today_cents: String(params.option.payTodayCents),
    remaining_cents: String(params.option.remainingAfterTodayCents),
    monthly_cents: String(params.option.monthlyCents || 0),
    monthly_payments_total: String(params.option.installmentCount),
    management_approval_required: String(
      params.option.managementApprovalRequired,
    ),
    booking_deduction_required: String(params.option.bookingDeductionRequired),
    launch_badge: params.option.badge,
  };
}

async function getOpenTrustSafetyPurchase(guruId: string) {
  const { data, error } = await supabaseAdmin
    .from("guru_trust_safety_plan_purchases")
    .select(
      [
        "id",
        "payment_status",
        "repayment_status",
        "stripe_checkout_session_id",
      ].join(","),
    )
    .eq("guru_id", guruId)
    .in("payment_status", ["pending", "paid", "partially_paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not check existing Trust & Safety plan: ${error.message}`);
  }

  return data as ExistingTrustSafetyPurchase | null;
}

async function createTrustSafetyPurchase(params: {
  guru: GuruForScreeningCheckout;
  userId: string;
  email: string;
  paymentOption: PaymentOption;
  option: PaymentOptionConfig;
  session: Stripe.Checkout.Session;
}) {
  const now = new Date().toISOString();

  const bookingDeductionAgreementAccepted =
    params.option.planKey === "book_and_bark_plan";

  const purchasePayload = {
    guru_id: params.guru.id,
    user_id: params.userId,
    profile_id: params.userId,
    email: params.email,

    plan_key: params.option.planKey,
    plan_name: params.option.planName,
    payment_model: params.option.paymentModel,

    gross_plan_value_cents: params.option.totalCents,
    due_today_cents: params.option.payTodayCents,
    down_payment_cents: params.option.payTodayCents,
    amount_paid_cents: 0,
    remaining_balance_cents: params.option.totalCents,

    installment_count: params.option.installmentCount,
    installment_amount_cents: params.option.monthlyCents || 0,
    installments_paid_count: 0,
    next_installment_due_at: null,

    booking_deduction_required: params.option.bookingDeductionRequired,
    booking_deduction_agreement_accepted: bookingDeductionAgreementAccepted,
    booking_deduction_collected_cents: 0,
    booking_deduction_remaining_cents: params.option.bookingDeductionRequired
      ? params.option.remainingAfterTodayCents
      : 0,

    management_approval_required: params.option.managementApprovalRequired,
    management_approval_status: params.option.managementApprovalRequired
      ? "pending"
      : "not_required",

    payment_status: "pending",
    repayment_status:
      params.option.paymentModel === "paid_in_full" ? "not_started" : "active",

    checkr_invite_allowed: false,
    checkr_invite_blocked_reason:
      params.option.paymentModel === "paid_in_full"
        ? "Full Paw in Full payment must clear before Checkr can start."
        : params.option.paymentModel === "monthly_installments"
          ? "Management approval and the $15 down payment are required before Checkr can start for the Pawstep Plan."
          : "Management approval, the $15 down payment, and booking deduction agreement are required before Checkr can start for the Book & Bark Plan.",

    stripe_checkout_session_id: params.session.id,
    stripe_payment_intent_id:
      typeof params.session.payment_intent === "string"
        ? params.session.payment_intent
        : null,
    stripe_customer_id:
      typeof params.session.customer === "string" ? params.session.customer : null,
    stripe_subscription_id:
      typeof params.session.subscription === "string"
        ? params.session.subscription
        : null,

    notes: `Checkout started for ${params.option.planName}.`,
    created_at: now,
    updated_at: now,
  };

  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from("guru_trust_safety_plan_purchases")
    .insert(purchasePayload)
    .select("id")
    .single();

  if (purchaseError) {
    throw new Error(
      `Checkout created, but Trust & Safety purchase could not be saved: ${purchaseError.message}`,
    );
  }

  const purchaseId = String(purchase.id);

  const { error: eventError } = await supabaseAdmin
    .from("trust_safety_financial_events")
    .insert({
      purchase_id: purchaseId,
      guru_id: params.guru.id,
      user_id: params.userId,
      event_type: "plan_selected",
      category: "trust_safety",
      source: "sitguru",
      status: "pending",
      plan_key: params.option.planKey,
      plan_name: params.option.planName,
      gross_amount_cents: params.option.totalCents,
      fee_amount_cents: 0,
      net_amount_cents: 0,
      currency: "usd",
      stripe_checkout_session_id: params.session.id,
      stripe_payment_intent_id:
        typeof params.session.payment_intent === "string"
          ? params.session.payment_intent
          : null,
      description: `${params.option.planName} selected. Checkout started.`,
      metadata: {
        payment_option: params.paymentOption,
        payment_model: params.option.paymentModel,
        due_today_cents: params.option.payTodayCents,
        remaining_after_today_cents: params.option.remainingAfterTodayCents,
        management_approval_required: params.option.managementApprovalRequired,
        booking_deduction_required: params.option.bookingDeductionRequired,
      },
      occurred_at: now,
      created_at: now,
      updated_at: now,
    });

  if (eventError) {
    throw new Error(
      `Checkout created, but Trust & Safety financial event could not be saved: ${eventError.message}`,
    );
  }

  return purchaseId;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const guruId = String(body.guruId || "").trim();
    const paymentOption = body.paymentOption;

    if (!guruId) {
      return NextResponse.json(
        { error: "Missing Guru profile ID." },
        { status: 400 },
      );
    }

    if (!isPaymentOption(paymentOption)) {
      return NextResponse.json(
        { error: "Invalid Trust & Safety Screening payment option." },
        { status: 400 },
      );
    }

    const { data: guruData, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select(
        [
          "id",
          "user_id",
          "email",
          "display_name",
          "full_name",
          "name",
          "background_check_fee_status",
          "background_check_fee_payment_option",
          "background_check_fee_paid_at",
        ].join(","),
      )
      .eq("id", guruId)
      .maybeSingle();

    if (guruError) {
      return NextResponse.json(
        { error: `Could not load Guru profile: ${guruError.message}` },
        { status: 500 },
      );
    }

    const guru = guruData as GuruForScreeningCheckout | null;

    if (!guru) {
      return NextResponse.json(
        { error: "Guru profile not found." },
        { status: 404 },
      );
    }

    if (guru.user_id && guru.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only start screening payment for your own profile." },
        { status: 403 },
      );
    }

    const alreadyPaid =
      guru.background_check_fee_status === "paid" ||
      guru.background_check_fee_status === "partially_paid" ||
      guru.background_check_fee_status === "waived" ||
      Boolean(guru.background_check_fee_paid_at);

    if (alreadyPaid) {
      return NextResponse.json(
        {
          error:
            "Your Trust & Safety Screening payment plan has already been started.",
        },
        { status: 409 },
      );
    }

    const openPurchase = await getOpenTrustSafetyPurchase(guru.id);

    if (openPurchase) {
      return NextResponse.json(
        {
          error:
            "A Trust & Safety Screening plan is already open for this Guru. Please continue from your existing checkout or contact SitGuru support.",
          purchase_id: openPurchase.id,
          checkout_session_id: openPurchase.stripe_checkout_session_id,
        },
        { status: 409 },
      );
    }

    const option = PAYMENT_OPTIONS[paymentOption];
    const baseUrl = getBaseUrl(req);
    const customerEmail = guru.email || user.email || "";

    const metadata = getCheckoutMetadata({
      guruId: String(guru.id),
      userId: user.id,
      email: customerEmail,
      paymentOption,
      option,
    });

    const successUrl = `${baseUrl}/guru/dashboard/background-check?screening_payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/guru/dashboard/background-check?screening_payment=cancelled`;

    const session =
      option.checkoutMode === "subscription"
        ? await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer_email: customerEmail || undefined,
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: option.payTodayCents,
                  product_data: {
                    name: `${getPlanDisplayName(paymentOption)} - Today’s Payment`,
                    description:
                      "Today’s payment for your SitGuru Trust & Safety Screening plan.",
                    metadata,
                  },
                },
              },
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: option.monthlyCents || PAWSTEP_MONTHLY_CENTS,
                  recurring: {
                    interval: "month",
                  },
                  product_data: {
                    name: `${getPlanDisplayName(paymentOption)} - Monthly Screening Balance`,
                    description:
                      "Automatic monthly payment for your remaining SitGuru Trust & Safety Screening balance.",
                    metadata,
                  },
                },
              },
            ],
            metadata,
            subscription_data: {
              trial_period_days: PAWSTEP_TRIAL_DAYS,
              metadata,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
          })
        : await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: customerEmail || undefined,
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: option.payTodayCents,
                  product_data: {
                    name: option.label,
                    description:
                      paymentOption === "pay_full_today"
                        ? "Best-value SitGuru Trust & Safety Screening payment with no remaining balance."
                        : "Today’s payment for your SitGuru Trust & Safety Screening plan.",
                    metadata,
                  },
                },
              },
            ],
            metadata,
            success_url: successUrl,
            cancel_url: cancelUrl,
          });

    const purchaseId = await createTrustSafetyPurchase({
      guru,
      userId: user.id,
      email: customerEmail,
      paymentOption,
      option,
      session,
    });

    const updatePayload = {
      background_check_fee_amount: centsToDollars(option.totalCents),
      background_check_fee_status: option.feeStatus,
      background_check_fee_payment_option: paymentOption,
      background_check_fee_checkout_session_id: session.id,
      background_check_payment_plan_status: option.paymentPlanStatus,
      background_check_reimbursement_balance: option.reimbursementBalance,
      background_check_reimbursement_status: option.reimbursementStatus,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("gurus")
      .update(updatePayload)
      .eq("id", guru.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: `Checkout created, but Guru payment status could not be saved: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: session.url,
      checkout_url: session.url,
      session_id: session.id,
      trust_safety_purchase_id: purchaseId,
      plan_key: option.planKey,
      plan_name: option.planName,
      management_approval_required: option.managementApprovalRequired,
      booking_deduction_required: option.bookingDeductionRequired,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Could not create Trust & Safety Screening checkout: ${stringifyError(
          error,
        )}`,
      },
      { status: 500 },
    );
  }
}