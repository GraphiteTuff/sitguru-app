import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

type PaymentOption =
  | "pay_full_today"
  | "pay_15_three_monthly"
  | "pay_15_booking_deductions";

type PaymentOptionConfig = {
  label: string;
  checkoutMode: "payment" | "subscription";
  totalCents: number;
  payTodayCents: number;
  remainingCents: number;
  monthlyCents?: number;
  feeStatus: "checkout_started";
  paymentPlanStatus: string;
  reimbursementBalance: number;
  reimbursementStatus: string;
  badge: "launch_pro_guru" | "pawstep_starter" | "book_bark_starter";
};

const PAY_IN_FULL_TOTAL_CENTS = 3799;
const FLEXIBLE_PLAN_TOTAL_CENTS = 3999;
const LAUNCH_TODAY_CENTS = 1500;
const FLEXIBLE_REMAINING_CENTS =
  FLEXIBLE_PLAN_TOTAL_CENTS - LAUNCH_TODAY_CENTS;
const PAWSTEP_MONTHLY_CENTS = 833;
const PAWSTEP_TRIAL_DAYS = 30;
const PAWSTEP_CANCEL_AFTER_DAYS = 122;

const PAYMENT_OPTIONS: Record<PaymentOption, PaymentOptionConfig> = {
  pay_full_today: {
    label: "Paw in Full - SitGuru Trust & Safety Screening",
    checkoutMode: "payment",
    totalCents: PAY_IN_FULL_TOTAL_CENTS,
    payTodayCents: PAY_IN_FULL_TOTAL_CENTS,
    remainingCents: 0,
    feeStatus: "checkout_started",
    paymentPlanStatus: "not_started",
    reimbursementBalance: 0,
    reimbursementStatus: "not_started",
    badge: "launch_pro_guru",
  },
  pay_15_three_monthly: {
    label: "Pawstep Plan - SitGuru Trust & Safety Screening",
    checkoutMode: "subscription",
    totalCents: FLEXIBLE_PLAN_TOTAL_CENTS,
    payTodayCents: LAUNCH_TODAY_CENTS,
    remainingCents: FLEXIBLE_REMAINING_CENTS,
    monthlyCents: PAWSTEP_MONTHLY_CENTS,
    feeStatus: "checkout_started",
    paymentPlanStatus: "pending_monthly_setup",
    reimbursementBalance: 0,
    reimbursementStatus: "not_started",
    badge: "pawstep_starter",
  },
  pay_15_booking_deductions: {
    label: "Book & Bark Plan - SitGuru Trust & Safety Screening",
    checkoutMode: "payment",
    totalCents: FLEXIBLE_PLAN_TOTAL_CENTS,
    payTodayCents: LAUNCH_TODAY_CENTS,
    remainingCents: FLEXIBLE_REMAINING_CENTS,
    feeStatus: "checkout_started",
    paymentPlanStatus: "not_started",
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
  if (paymentOption === "pay_full_today") return "Paw in Full";
  if (paymentOption === "pay_15_three_monthly") return "Pawstep Plan";
  return "Book & Bark Plan";
}

function getCheckoutMetadata(params: {
  guruId: string;
  userId: string;
  paymentOption: PaymentOption;
  option: PaymentOptionConfig;
}) {
  return {
    purpose: "trust_safety_screening",
    guru_id: params.guruId,
    user_id: params.userId,
    payment_option: params.paymentOption,
    plan_label: getPlanDisplayName(params.paymentOption),
    screening_total_cents: String(params.option.totalCents),
    paid_today_cents: String(params.option.payTodayCents),
    remaining_cents: String(params.option.remainingCents),
    monthly_cents: String(params.option.monthlyCents || 0),
    launch_badge: params.option.badge,
  };
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

    const { data: guru, error: guruError } = await supabaseAdmin
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

    const option = PAYMENT_OPTIONS[paymentOption];
    const baseUrl = getBaseUrl(req);
    const customerEmail = guru.email || user.email || undefined;

    const metadata = getCheckoutMetadata({
      guruId: String(guru.id),
      userId: user.id,
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
            customer_email: customerEmail,
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
              cancel_at:
                Math.floor(Date.now() / 1000) +
                PAWSTEP_CANCEL_AFTER_DAYS * 24 * 60 * 60,
              metadata,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
          })
        : await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: customerEmail,
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