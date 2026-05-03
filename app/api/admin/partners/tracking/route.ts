import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TrackingEventBody = {
  partner_id?: string | null;
  ambassador_id?: string | null;
  affiliate_id?: string | null;
  campaign_id?: string | null;
  referral_code?: string | null;
  event_type?: string | null;
  event_source?: string | null;
  event_medium?: string | null;
  event_campaign?: string | null;
  landing_page?: string | null;
  current_url?: string | null;
  referrer_url?: string | null;
  user_id?: string | null;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  email?: string | null;
  phone?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  revenue_amount?: number | null;
  reward_amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
};

function getHeaderValue(request: NextRequest, name: string) {
  return request.headers.get(name) || "";
}

async function sha256(value: string) {
  if (!value) return null;

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEventType(value?: string | null) {
  const safeValue = (value || "click").toLowerCase().trim();

  const allowed = new Set([
    "click",
    "view",
    "signup",
    "customer_signup",
    "guru_signup",
    "partner_signup",
    "booking",
    "completed_booking",
    "cancelled_booking",
    "revenue",
    "reward",
    "payout",
  ]);

  return allowed.has(safeValue) ? safeValue : "click";
}

function normalizeMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return value;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  let body: TrackingEventBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const userAgent = getHeaderValue(request, "user-agent");
  const ipSource =
    getHeaderValue(request, "x-forwarded-for") ||
    getHeaderValue(request, "x-real-ip") ||
    getHeaderValue(request, "cf-connecting-ip");

  const ipHash = await sha256(ipSource);

  const { error } = await supabase.from("partner_tracking_events").insert({
    partner_id: body.partner_id || null,
    ambassador_id: body.ambassador_id || null,
    affiliate_id: body.affiliate_id || null,
    campaign_id: body.campaign_id || null,

    referral_code: body.referral_code || null,
    event_type: normalizeEventType(body.event_type),
    event_source: body.event_source || null,
    event_medium: body.event_medium || null,
    event_campaign: body.event_campaign || null,

    landing_page: body.landing_page || null,
    current_url: body.current_url || null,
    referrer_url: body.referrer_url || request.headers.get("referer") || null,

    user_id: body.user_id || null,
    customer_id: body.customer_id || null,
    guru_id: body.guru_id || null,
    booking_id: body.booking_id || null,

    email: body.email || null,
    phone: body.phone || null,
    zip_code: body.zip_code || null,
    city: body.city || null,
    state: body.state || null,

    revenue_amount: normalizeMoney(body.revenue_amount),
    reward_amount: normalizeMoney(body.reward_amount),
    currency: body.currency || "USD",

    user_agent: userAgent || null,
    ip_hash: ipHash,

    metadata: body.metadata || {},
  });

  if (error) {
    return NextResponse.json(
      {
        error: "Could not record partner tracking event.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const partnerId = searchParams.get("partner_id");
  const referralCode = searchParams.get("referral_code");
  const eventType = searchParams.get("event_type") || "click";

  const userAgent = getHeaderValue(request, "user-agent");
  const ipSource =
    getHeaderValue(request, "x-forwarded-for") ||
    getHeaderValue(request, "x-real-ip") ||
    getHeaderValue(request, "cf-connecting-ip");

  const ipHash = await sha256(ipSource);

  const { error } = await supabase.from("partner_tracking_events").insert({
    partner_id: partnerId || null,
    referral_code: referralCode || null,
    event_type: normalizeEventType(eventType),
    landing_page: searchParams.get("landing_page") || null,
    current_url: searchParams.get("current_url") || null,
    referrer_url: request.headers.get("referer") || null,
    event_source: searchParams.get("utm_source") || null,
    event_medium: searchParams.get("utm_medium") || null,
    event_campaign: searchParams.get("utm_campaign") || null,
    user_agent: userAgent || null,
    ip_hash: ipHash,
    metadata: {
      recorded_from: "GET pixel/link endpoint",
    },
  });

  if (error) {
    return NextResponse.json(
      {
        error: "Could not record partner tracking event.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}