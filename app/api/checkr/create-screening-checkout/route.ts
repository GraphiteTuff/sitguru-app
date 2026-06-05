import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

type ExistingTrustSafetyPurchase = {
  id: string;
  payment_status: string | null;
  repayment_status: string | null;
  stripe_checkout_session_id: string | null;
};

const WAIVER_STATUS = "waived_2026";
const WAIVER_PLAN_KEY = "launch_year_2026_waiver";
const WAIVER_PLAN_NAME = "2026 Launch Year Waiver";
const WAIVER_NOTE =
  "Trust & Safety Screening fee waived through December 31, 2026 during SitGuru launch year.";

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

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
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
    .in("payment_status", ["pending", "paid", "partially_paid", WAIVER_STATUS])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not check existing Trust & Safety plan: ${error.message}`);
  }

  return data as ExistingTrustSafetyPurchase | null;
}

async function createLaunchWaiverPurchase(params: {
  guru: GuruForScreeningCheckout;
  userId: string;
  email: string;
}) {
  const now = new Date().toISOString();

  const purchasePayload = {
    guru_id: params.guru.id,
    user_id: params.userId,
    profile_id: params.userId,
    email: params.email,

    plan_key: WAIVER_PLAN_KEY,
    plan_name: WAIVER_PLAN_NAME,
    payment_model: WAIVER_STATUS,

    gross_plan_value_cents: 0,
    due_today_cents: 0,
    down_payment_cents: 0,
    amount_paid_cents: 0,
    remaining_balance_cents: 0,

    installment_count: 0,
    installment_amount_cents: 0,
    installments_paid_count: 0,
    next_installment_due_at: null,

    booking_deduction_required: false,
    booking_deduction_agreement_accepted: false,
    booking_deduction_collected_cents: 0,
    booking_deduction_remaining_cents: 0,

    management_approval_required: false,
    management_approval_status: "not_required",

    payment_status: WAIVER_STATUS,
    repayment_status: WAIVER_STATUS,

    checkr_invite_allowed: true,
    checkr_invite_blocked_reason: null,

    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,

    notes: WAIVER_NOTE,
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
      `Trust & Safety waiver could not be saved: ${purchaseError.message}`,
    );
  }

  const purchaseId = String(purchase.id);

  const { error: eventError } = await supabaseAdmin
    .from("trust_safety_financial_events")
    .insert({
      purchase_id: purchaseId,
      guru_id: params.guru.id,
      user_id: params.userId,
      event_type: "fee_waived",
      category: "trust_safety",
      source: "sitguru",
      status: WAIVER_STATUS,
      plan_key: WAIVER_PLAN_KEY,
      plan_name: WAIVER_PLAN_NAME,
      gross_amount_cents: 0,
      fee_amount_cents: 0,
      net_amount_cents: 0,
      currency: "usd",
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
      description: WAIVER_NOTE,
      metadata: {
        waiver_status: WAIVER_STATUS,
        waived_until: "2026-12-31",
        reason: "launch_year_2026",
      },
      occurred_at: now,
      created_at: now,
      updated_at: now,
    });

  if (eventError) {
    throw new Error(
      `Trust & Safety waiver financial event could not be saved: ${eventError.message}`,
    );
  }

  return purchaseId;
}

export async function POST(req: NextRequest) {
  try {
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

    if (!guruId) {
      return NextResponse.json(
        { error: "Missing Guru profile ID." },
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
        { error: "You can only apply the Trust & Safety waiver to your own profile." },
        { status: 403 },
      );
    }

    const baseUrl = getBaseUrl(req);
    const customerEmail = guru.email || user.email || "";
    const now = new Date().toISOString();

    const updatePayload = {
      background_check_fee_amount: 0,
      background_check_fee_status: WAIVER_STATUS,
      background_check_fee_payment_option: WAIVER_STATUS,
      background_check_fee_checkout_session_id: null,
      background_check_payment_plan_status: WAIVER_STATUS,
      background_check_reimbursement_balance: 0,
      background_check_reimbursement_status: WAIVER_STATUS,
      updated_at: now,
    };

    const { error: updateError } = await supabaseAdmin
      .from("gurus")
      .update(updatePayload)
      .eq("id", guru.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: `Guru Trust & Safety waiver status could not be saved: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    let trustSafetyPurchaseId: string | null = null;

    const openPurchase = await getOpenTrustSafetyPurchase(guru.id);

    if (openPurchase) {
      trustSafetyPurchaseId = openPurchase.id;
    } else {
      trustSafetyPurchaseId = await createLaunchWaiverPurchase({
        guru,
        userId: user.id,
        email: customerEmail,
      });
    }

    const redirectUrl = `${baseUrl}/guru/dashboard/background-check?screening_payment=waived_2026`;

    return NextResponse.json({
      ok: true,
      waived: true,
      fee_status: WAIVER_STATUS,
      payment_required: false,
      checkout_url: null,
      url: redirectUrl,
      redirect_url: redirectUrl,
      trust_safety_purchase_id: trustSafetyPurchaseId,
      plan_key: WAIVER_PLAN_KEY,
      plan_name: WAIVER_PLAN_NAME,
      message:
        "Trust & Safety Screening fee is waived through December 31, 2026. No payment is required.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Could not apply Trust & Safety Screening waiver: ${stringifyError(
          error,
        )}`,
      },
      { status: 500 },
    );
  }
}