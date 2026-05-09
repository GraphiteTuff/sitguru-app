import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSitGuruEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

if (!stripeWebhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

type ScreeningPaymentOption =
  | "pay_full_today"
  | "pay_15_three_monthly"
  | "pay_15_booking_deductions";

type ScreeningReceiptDetails = {
  guruId: string;
  userId: string | null;
  email: string;
  firstName: string;
  paymentOption: ScreeningPaymentOption;
  planLabel: string;
  paidTodayCents: number;
  remainingCents: number;
  paymentStatus: "paid" | "partially_paid";
  stripeSessionId: string;
  badgeLabel: string | null;
};

const PAY_IN_FULL_TOTAL_CENTS = 3799;
const FLEXIBLE_PLAN_TOTAL_CENTS = 3999;
const LAUNCH_TODAY_CENTS = 1500;
const FLEXIBLE_REMAINING_CENTS =
  FLEXIBLE_PLAN_TOTAL_CENTS - LAUNCH_TODAY_CENTS;
const PAWSTEP_MONTHLY_CENTS = 833;

function centsToDollars(cents: number | null | undefined) {
  const value = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return Number((value / 100).toFixed(2));
}

function formatMoneyFromCents(cents: number | null | undefined) {
  const dollars = centsToDollars(cents);

  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCents(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return fallback;
}

function asScreeningPaymentOption(value: unknown): ScreeningPaymentOption | null {
  if (
    value === "pay_full_today" ||
    value === "pay_15_three_monthly" ||
    value === "pay_15_booking_deductions"
  ) {
    return value;
  }

  return null;
}

function isTrustSafetyScreeningSession(session: Stripe.Checkout.Session) {
  return session.metadata?.purpose === "trust_safety_screening";
}

function getPlanLabel(paymentOption: ScreeningPaymentOption) {
  if (paymentOption === "pay_full_today") return "Paw in Full";
  if (paymentOption === "pay_15_three_monthly") return "Pawstep Plan";
  return "Book & Bark Plan";
}

function getBadgeValue(paymentOption: ScreeningPaymentOption) {
  if (paymentOption === "pay_full_today") return "launch_pro_guru";
  if (paymentOption === "pay_15_three_monthly") return "pawstep_starter";
  return "book_bark_starter";
}

function getBadgeLabel(paymentOption: ScreeningPaymentOption) {
  if (paymentOption === "pay_full_today") return "Launch Pro Guru";
  if (paymentOption === "pay_15_three_monthly") return "Pawstep Starter";
  return "Book & Bark Starter";
}

function getFirstNameFromGuru(guru: {
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
}) {
  const displayName =
    guru.display_name ||
    guru.full_name ||
    guru.name ||
    guru.email?.split("@")[0] ||
    "Guru";

  return displayName.trim().split(/\s+/)[0] || "Guru";
}

async function getPaymentIntentDetails(session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : "";

  let stripeChargeId = "";
  let paymentIntentStatus = "";

  if (!paymentIntentId) {
    return {
      paymentIntentId,
      stripeChargeId,
      paymentIntentStatus,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    paymentIntentStatus = paymentIntent.status || "";

    if (
      paymentIntent.latest_charge &&
      typeof paymentIntent.latest_charge !== "string"
    ) {
      stripeChargeId = paymentIntent.latest_charge.id;
    } else if (typeof paymentIntent.latest_charge === "string") {
      stripeChargeId = paymentIntent.latest_charge;
    }
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
  }

  return {
    paymentIntentId,
    stripeChargeId,
    paymentIntentStatus,
  };
}

function buildScreeningReceiptText(details: ScreeningReceiptDetails) {
  const paidToday = formatMoneyFromCents(details.paidTodayCents);
  const remaining = formatMoneyFromCents(details.remainingCents);

  const planSpecificNote =
    details.paymentOption === "pay_full_today"
      ? `You selected the best-value plan, so there are no future screening-balance deductions. You also earned the ${details.badgeLabel} badge for completing this onboarding payment in full.`
      : details.paymentOption === "pay_15_three_monthly"
        ? "Your remaining screening balance will be handled through your selected automatic monthly Stripe payment plan."
        : "Because you selected the Book & Bark Plan, SitGuru will recover the remaining balance from future completed booking payouts until it is fully covered.";

  return `Hi ${details.firstName},

Thank you for starting your SitGuru Trust & Safety Screening.

Your payment was received, and your selected plan is now active.

Plan selected:
${details.planLabel}

Paid today:
${paidToday}

Remaining screening balance:
${remaining}

${planSpecificNote}

Next step:
Please return to your Guru Dashboard and continue your secure Trust & Safety Screening form.

You may also receive a separate email directly from Checkr with a secure link and wording such as “Start background check.” That email is expected and is part of SitGuru’s Trust & Safety Screening process.

You can continue from your Guru Dashboard or use the secure Checkr email link.

Please also check your SitGuru message inbox for updates. SitGuru may contact you by email or through SitGuru Messages if anything else is needed.

Thank you for helping keep SitGuru trusted and safe for pet parents, pets, and Gurus.

— The SitGuru Team`;
}

function buildScreeningReceiptHtml(details: ScreeningReceiptDetails) {
  const paidToday = formatMoneyFromCents(details.paidTodayCents);
  const remaining = formatMoneyFromCents(details.remainingCents);

  const planSpecificNote =
    details.paymentOption === "pay_full_today"
      ? `You selected the <strong>best-value plan</strong>, so there are no future screening-balance deductions. You also earned the <strong>${details.badgeLabel}</strong> badge for completing this onboarding payment in full.`
      : details.paymentOption === "pay_15_three_monthly"
        ? "Your remaining screening balance will be handled through your selected automatic monthly Stripe payment plan."
        : "Because you selected the Book & Bark Plan, SitGuru will recover the remaining balance from future completed booking payouts until it is fully covered.";

  const badgeHtml = details.badgeLabel
    ? `<span style="display:inline-block;margin-top:8px;padding:8px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:800;font-size:13px;">${details.badgeLabel}</span>`
    : "";

  return `
  <div style="margin:0;padding:0;background:#f3fbf8;font-family:Arial,Helvetica,sans-serif;color:#07132f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3fbf8;margin:0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d7f5e7;border-radius:24px;overflow:hidden;box-shadow:0 14px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:28px 28px 22px;background:linear-gradient(135deg,#d9fff3,#d8eefc);">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:900;color:#047857;">
                  SitGuru Trust &amp; Safety
                </div>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.15;color:#07132f;">
                  Payment received 🐾
                </h1>
                <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#334155;font-weight:600;">
                  Hi ${details.firstName}, thank you for starting your SitGuru Trust &amp; Safety Screening.
                </p>
                ${badgeHtml}
              </td>
            </tr>

            <tr>
              <td style="padding:26px 28px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#334155;">
                  Your payment was received, and your selected plan is now active.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;margin:12px 0 22px;">
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;color:#64748b;">Plan selected</div>
                      <div style="font-size:20px;font-weight:900;color:#07132f;margin-top:4px;">${details.planLabel}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;color:#64748b;">Paid today</div>
                      <div style="font-size:20px;font-weight:900;color:#047857;margin-top:4px;">${paidToday}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;color:#9a3412;">Remaining screening balance</div>
                      <div style="font-size:20px;font-weight:900;color:#9a3412;margin-top:4px;">${remaining}</div>
                    </td>
                  </tr>
                </table>

                <div style="padding:16px 18px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;margin-bottom:22px;">
                  <p style="margin:0;font-size:15px;line-height:1.65;color:#065f46;font-weight:700;">
                    ${planSpecificNote}
                  </p>
                </div>

                <h2 style="margin:0 0 10px;font-size:20px;color:#07132f;">Next step</h2>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">
                  Please return to your Guru Dashboard and continue your secure Trust &amp; Safety Screening form.
                </p>

                <div style="padding:16px 18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;margin-bottom:22px;">
                  <p style="margin:0;font-size:15px;line-height:1.65;color:#1e3a8a;">
                    You may also receive a separate email directly from <strong>Checkr</strong> with a secure link and wording such as <strong>“Start background check.”</strong> That email is expected and is part of SitGuru’s Trust &amp; Safety Screening process.
                  </p>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:#1e3a8a;">
                    You can continue from your Guru Dashboard or use the secure Checkr email link.
                  </p>
                </div>

                <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                  Please also check your SitGuru message inbox for updates. SitGuru may contact you by email or through SitGuru Messages if anything else is needed.
                </p>

                <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#334155;">
                  Thank you for helping keep SitGuru trusted and safe for pet parents, pets, and Gurus.
                </p>

                <p style="margin:22px 0 0;font-size:15px;font-weight:800;color:#07132f;">
                  — The SitGuru Team
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  This email confirms your SitGuru Trust &amp; Safety Screening payment plan. Checkr may send separate screening-related emails as part of the secure screening process.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}

async function hasReceiptAlreadyBeenSent(stripeSessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("email_events")
    .select("id,status")
    .eq("event_type", "trust_safety_screening_payment_receipt")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    console.error("Could not check existing screening receipt email:", error);
    return false;
  }

  return Boolean(data?.id);
}

async function logReceiptEmail(params: {
  userId: string | null;
  guruId: string;
  email: string;
  providerMessageId: string | null;
  stripeSessionId: string;
  status: "sent" | "failed" | "skipped";
  metadata: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("email_events").insert({
    user_id: params.userId,
    guru_id: params.guruId,
    email: params.email,
    event_type: "trust_safety_screening_payment_receipt",
    provider_message_id: params.providerMessageId,
    stripe_session_id: params.stripeSessionId,
    status: params.status,
    metadata: params.metadata,
  });

  if (error) {
    console.error("Could not log screening receipt email:", error);
  }
}

async function sendTrustSafetyScreeningReceiptEmail(
  details: ScreeningReceiptDetails,
) {
  if (!details.email) {
    console.warn("No email available for Trust & Safety Screening receipt.");
    return;
  }

  const alreadySent = await hasReceiptAlreadyBeenSent(details.stripeSessionId);

  if (alreadySent) {
    console.log(
      "Skipping duplicate Trust & Safety Screening receipt email for session:",
      details.stripeSessionId,
    );
    return;
  }

  const subject =
    "Your SitGuru Trust & Safety Screening payment was received 🐾";

  try {
    const result = await sendSitGuruEmail({
      to: details.email,
      subject,
      html: buildScreeningReceiptHtml(details),
      text: buildScreeningReceiptText(details),
    });

    await logReceiptEmail({
      userId: details.userId,
      guruId: details.guruId,
      email: details.email,
      providerMessageId: result.id,
      stripeSessionId: details.stripeSessionId,
      status: "sent",
      metadata: {
        plan_label: details.planLabel,
        payment_option: details.paymentOption,
        paid_today_cents: details.paidTodayCents,
        remaining_cents: details.remainingCents,
        payment_status: details.paymentStatus,
        badge_label: details.badgeLabel,
      },
    });

    console.log(
      "📧 Trust & Safety Screening receipt email sent:",
      details.email,
    );
  } catch (error) {
    console.error("Failed to send Trust & Safety Screening receipt:", error);

    await logReceiptEmail({
      userId: details.userId,
      guruId: details.guruId,
      email: details.email,
      providerMessageId: null,
      stripeSessionId: details.stripeSessionId,
      status: "failed",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        plan_label: details.planLabel,
        payment_option: details.paymentOption,
        paid_today_cents: details.paidTodayCents,
        remaining_cents: details.remainingCents,
        payment_status: details.paymentStatus,
        badge_label: details.badgeLabel,
      },
    });
  }
}

async function tryAwardGuruLaunchBadge(params: {
  guruId: string;
  paymentOption: ScreeningPaymentOption;
  awardedAt: string;
}) {
  const { error } = await supabaseAdmin
    .from("gurus")
    .update({
      guru_launch_badge: getBadgeValue(params.paymentOption),
      guru_launch_badge_awarded_at: params.awardedAt,
    })
    .eq("id", params.guruId);

  if (error) {
    console.warn(
      "Could not award Guru launch badge. If you have not added guru_launch_badge columns yet, run the badge SQL.",
      error,
    );
  }
}

async function tryUpdatePawstepOptionalFields(params: {
  guruId: string;
  subscriptionId: string | null;
  customerId: string | null;
  monthlyCents: number;
  nextPaymentAt: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("gurus")
    .update({
      background_check_stripe_subscription_id: params.subscriptionId,
      background_check_stripe_customer_id: params.customerId,
      background_check_monthly_payment_amount: centsToDollars(
        params.monthlyCents,
      ),
      background_check_monthly_payments_total: 3,
      background_check_monthly_payments_completed: 0,
      background_check_next_payment_at: params.nextPaymentAt,
    })
    .eq("id", params.guruId);

  if (error) {
    console.warn(
      "Could not update optional Pawstep subscription fields. If you have not added monthly payment columns yet, run the Pawstep SQL.",
      error,
    );
  }
}

async function updateTrustSafetyScreeningPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const guruId = asTrimmedString(session.metadata?.guru_id);
  const paymentOption = asScreeningPaymentOption(
    session.metadata?.payment_option,
  );

  if (!guruId) {
    console.warn(
      "No guru_id in Trust & Safety Screening checkout.session.completed metadata",
    );
    return;
  }

  if (!paymentOption) {
    console.warn(
      "No valid payment_option in Trust & Safety Screening checkout.session.completed metadata",
    );
    return;
  }

  const { data: guruBeforeUpdate, error: guruLookupError } = await supabaseAdmin
    .from("gurus")
    .select("id,user_id,email,display_name,full_name,name")
    .eq("id", guruId)
    .maybeSingle();

  if (guruLookupError) {
    console.error(
      "Could not load Guru before Trust & Safety Screening update:",
      guruLookupError,
    );
  }

  const { paymentIntentId } = await getPaymentIntentDetails(session);

  const now = new Date().toISOString();

  const paidTodayCents =
    typeof session.amount_total === "number"
      ? session.amount_total
      : parseCents(session.metadata?.paid_today_cents, LAUNCH_TODAY_CENTS);

  const totalCents =
    paymentOption === "pay_full_today"
      ? PAY_IN_FULL_TOTAL_CENTS
      : FLEXIBLE_PLAN_TOTAL_CENTS;

  const remainingCents =
    paymentOption === "pay_full_today" ? 0 : FLEXIBLE_REMAINING_CENTS;

  const paymentStatus =
    paymentOption === "pay_full_today" ? "paid" : "partially_paid";

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  const updatePayload: Record<string, unknown> = {
    background_check_fee_amount: centsToDollars(totalCents),
    background_check_fee_status: paymentStatus,
    background_check_fee_payment_option: paymentOption,
    background_check_fee_paid_at: now,
    background_check_fee_payment_intent_id: paymentIntentId || null,
    background_check_fee_checkout_session_id: session.id,
    updated_at: now,
  };

  if (paymentOption === "pay_full_today") {
    updatePayload.background_check_payment_plan_status = "paid_in_full";
    updatePayload.background_check_reimbursement_balance = 0;
    updatePayload.background_check_reimbursement_status = "not_started";
  }

  if (paymentOption === "pay_15_three_monthly") {
    updatePayload.background_check_payment_plan_status =
      "monthly_plan_active";
    updatePayload.background_check_reimbursement_balance = centsToDollars(
      FLEXIBLE_REMAINING_CENTS,
    );
    updatePayload.background_check_reimbursement_status =
      "stripe_monthly_plan";
    updatePayload.background_check_stripe_subscription_id = subscriptionId;
  }

  if (paymentOption === "pay_15_booking_deductions") {
    updatePayload.background_check_payment_plan_status = "not_started";
    updatePayload.background_check_reimbursement_balance = centsToDollars(
      FLEXIBLE_REMAINING_CENTS,
    );
    updatePayload.background_check_reimbursement_status =
      "covered_by_sitguru";
  }

  const { error } = await supabaseAdmin
    .from("gurus")
    .update(updatePayload)
    .eq("id", guruId);

  if (error) {
    console.error("Error updating Trust & Safety Screening payment:", error);
    return;
  }

  await tryAwardGuruLaunchBadge({
    guruId,
    paymentOption,
    awardedAt: now,
  });

  if (paymentOption === "pay_15_three_monthly") {
    await tryUpdatePawstepOptionalFields({
      guruId,
      subscriptionId,
      customerId,
      monthlyCents: PAWSTEP_MONTHLY_CENTS,
      nextPaymentAt: null,
    });
  }

  console.log(
    `✅ Trust & Safety Screening payment completed for Guru ${guruId}. Option: ${paymentOption}. Paid today: ${centsToDollars(
      paidTodayCents,
    )}`,
  );

  const guruEmail =
    guruBeforeUpdate?.email ||
    session.customer_details?.email ||
    session.customer_email ||
    "";

  if (!guruEmail) {
    console.warn(
      "Trust & Safety Screening payment updated, but no Guru email was available for receipt.",
    );
    return;
  }

  await sendTrustSafetyScreeningReceiptEmail({
    guruId,
    userId: guruBeforeUpdate?.user_id || null,
    email: guruEmail,
    firstName: getFirstNameFromGuru({
      display_name: guruBeforeUpdate?.display_name,
      full_name: guruBeforeUpdate?.full_name,
      name: guruBeforeUpdate?.name,
      email: guruEmail,
    }),
    paymentOption,
    planLabel: getPlanLabel(paymentOption),
    paidTodayCents,
    remainingCents,
    paymentStatus,
    stripeSessionId: session.id,
    badgeLabel: getBadgeLabel(paymentOption),
  });
}

async function updateTrustSafetyScreeningExpiredFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const guruId = asTrimmedString(session.metadata?.guru_id);

  if (!guruId) {
    console.warn(
      "No guru_id in Trust & Safety Screening checkout.session.expired metadata",
    );
    return;
  }

  const { error } = await supabaseAdmin
    .from("gurus")
    .update({
      background_check_fee_status: "unpaid",
      background_check_payment_plan_status: "not_started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", guruId)
    .eq("background_check_fee_checkout_session_id", session.id);

  if (error) {
    console.error("Error expiring Trust & Safety Screening checkout:", error);
  } else {
    console.log("❌ Trust & Safety Screening checkout expired for Guru:", guruId);
  }
}

async function updateTrustSafetyScreeningRefundedFromCharge(
  charge: Stripe.Charge,
) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : "";

  if (!paymentIntentId) {
    return false;
  }

  const { data: guru, error: lookupError } = await supabaseAdmin
    .from("gurus")
    .select("id")
    .eq("background_check_fee_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (lookupError) {
    console.error(
      "Error looking up refunded Trust & Safety Screening payment:",
      lookupError,
    );
    return false;
  }

  if (!guru?.id) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from("gurus")
    .update({
      background_check_fee_status: "refunded",
      background_check_payment_plan_status: "refunded",
      background_check_reimbursement_balance: 0,
      background_check_reimbursement_status: "not_started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", guru.id);

  if (error) {
    console.error("Error refunding Trust & Safety Screening payment:", error);
  } else {
    console.log(
      "↩️ Trust & Safety Screening payment refunded for Guru:",
      guru.id,
    );
  }

  return true;
}

async function updatePawstepInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as unknown as {
    id?: string;
    subscription?: string | Stripe.Subscription | null;
    billing_reason?: string | null;
    amount_paid?: number | null;
    customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  };

  const subscriptionId =
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id || "";

  if (!subscriptionId) {
    return;
  }

  if (invoiceAny.billing_reason === "subscription_create") {
    return;
  }

  const amountPaidCents =
    typeof invoiceAny.amount_paid === "number"
      ? invoiceAny.amount_paid
      : PAWSTEP_MONTHLY_CENTS;

  const { data: guru, error: lookupError } = await supabaseAdmin
    .from("gurus")
    .select(
      [
        "id",
        "background_check_reimbursement_balance",
        "background_check_monthly_payments_completed",
      ].join(","),
    )
    .eq("background_check_stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not look up Pawstep Guru from invoice:", lookupError);
    return;
  }

  if (!guru?.id) {
    return;
  }

  const currentBalance = Number(
    guru.background_check_reimbursement_balance ?? 0,
  );
  const currentCompleted = Number(
    guru.background_check_monthly_payments_completed ?? 0,
  );

  const nextBalance = Math.max(
    0,
    Number((currentBalance - centsToDollars(amountPaidCents)).toFixed(2)),
  );
  const nextCompleted = Number.isFinite(currentCompleted)
    ? currentCompleted + 1
    : 1;

  const updatePayload: Record<string, unknown> = {
    background_check_reimbursement_balance: nextBalance,
    background_check_monthly_payments_completed: nextCompleted,
    updated_at: new Date().toISOString(),
  };

  if (nextBalance <= 0 || nextCompleted >= 3) {
    updatePayload.background_check_fee_status = "paid";
    updatePayload.background_check_payment_plan_status = "paid_in_full";
    updatePayload.background_check_reimbursement_status = "paid_in_full";
    updatePayload.background_check_reimbursement_balance = 0;
  }

  const { error } = await supabaseAdmin
    .from("gurus")
    .update(updatePayload)
    .eq("id", guru.id);

  if (error) {
    console.error("Could not update Pawstep invoice payment:", error);
  } else {
    console.log(
      `✅ Pawstep monthly payment applied for Guru ${guru.id}. Amount: ${formatMoneyFromCents(
        amountPaidCents,
      )}`,
    );
  }
}

async function updatePawstepSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from("gurus")
    .update({
      background_check_payment_plan_status: "subscription_ended",
      updated_at: new Date().toISOString(),
    })
    .eq("background_check_stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Could not update deleted Pawstep subscription:", error);
  }
}

async function updateBookingPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const bookingId = asTrimmedString(session.metadata?.booking_id);

  if (!bookingId) {
    console.warn("No booking_id in checkout.session.completed metadata");
    return;
  }

  const subtotalCents =
    typeof session.amount_subtotal === "number" ? session.amount_subtotal : 0;

  const totalCents =
    typeof session.amount_total === "number" ? session.amount_total : subtotalCents;

  const taxDetailsAmount =
    session.total_details?.amount_tax &&
    Number.isFinite(session.total_details.amount_tax)
      ? session.total_details.amount_tax
      : 0;

  const taxCents = taxDetailsAmount || Math.max(totalCents - subtotalCents, 0);

  const sitguruFeeCentsRaw = Number(session.metadata?.sitguru_fee_cents ?? 0);
  const guruNetCentsRaw = Number(session.metadata?.guru_net_cents ?? 0);

  const sitguruFeeCents = Number.isFinite(sitguruFeeCentsRaw)
    ? sitguruFeeCentsRaw
    : 0;
  const guruNetCents = Number.isFinite(guruNetCentsRaw)
    ? guruNetCentsRaw
    : Math.max(subtotalCents - sitguruFeeCents, 0);

  const { paymentIntentId, stripeChargeId, paymentIntentStatus } =
    await getPaymentIntentDetails(session);

  const updatePayload: Record<string, unknown> = {
    status: "confirmed",
    payment_status: paymentIntentStatus || "paid",
    stripe_session_id: session.id,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId || null,
    stripe_charge_id: stripeChargeId || null,
    currency: session.currency || "usd",
    subtotal_amount: centsToDollars(subtotalCents),
    sales_tax_amount: centsToDollars(taxCents),
    sitguru_fee_amount: centsToDollars(sitguruFeeCents),
    guru_net_amount: centsToDollars(guruNetCents),
    total_customer_paid: centsToDollars(totalCents),
    tax_status: taxCents > 0 ? "collected" : "not_applicable",
    payout_status: "pending",
  };

  const { error } = await supabaseAdmin
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating paid booking:", error);
  } else {
    console.log("✅ Payment completed for booking:", bookingId);
  }
}

async function updateBookingExpiredFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const bookingId = asTrimmedString(session.metadata?.booking_id);

  if (!bookingId) {
    console.warn("No booking_id in checkout.session.expired metadata");
    return;
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "expired",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating expired booking:", error);
  } else {
    console.log("❌ Payment expired for booking:", bookingId);
  }
}

async function updateBookingRefundedFromCharge(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : "";

  if (!paymentIntentId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "refunded",
      payout_status: "adjusted",
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("Error updating refunded booking:", error);
  } else {
    console.log("↩️ Charge refunded for payment intent:", paymentIntentId);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret!);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          await updateTrustSafetyScreeningPaidFromCheckoutSession(session);
        } else {
          await updateBookingPaidFromCheckoutSession(session);
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          await updateTrustSafetyScreeningExpiredFromCheckoutSession(session);
        } else {
          await updateBookingExpiredFromCheckoutSession(session);
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await updatePawstepInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updatePawstepSubscriptionDeleted(subscription);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const screeningRefunded =
          await updateTrustSafetyScreeningRefundedFromCharge(charge);

        if (!screeningRefunded) {
          await updateBookingRefundedFromCharge(charge);
        }

        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);

    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}