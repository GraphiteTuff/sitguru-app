import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReferralReportingEpoch, isReferralActivitySince } from "@/lib/referrals/reporting-epoch";

export const dynamic = "force-dynamic";

const identity = (row: { referred_user_id?: unknown; referred_email?: unknown; id?: unknown }) =>
  String(row.referred_user_id || row.referred_email || row.id || "").toLowerCase().trim();

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const epoch = await getReferralReportingEpoch();
    if (!epoch) {
      return NextResponse.json({
        active: false, startedAt: null,
        newSignups: null, newQualified: null, firstBookings: null,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const [relationshipsResult, eventsResult] = await Promise.all([
      supabaseAdmin.from("pawperks_referral_relationships")
        .select("id,referred_user_id,referred_email,signup_at,qualified_at,first_booking_at")
        .eq("referrer_user_id", user.id)
        .limit(2000),
      supabaseAdmin.from("pawperks_referral_events")
        .select("id,referred_user_id,referred_email,event_type,occurred_at")
        .eq("referrer_user_id", user.id)
        .eq("event_type", "signup_capture")
        .gte("occurred_at", epoch.startedAt)
        .limit(2000),
    ]);
    if (relationshipsResult.error || eventsResult.error) {
      throw relationshipsResult.error || eventsResult.error;
    }
    const relationships = relationshipsResult.data || [];
    const events = eventsResult.data || [];
    if (relationships.length >= 2000 || events.length >= 2000)
      return NextResponse.json({ error: "Referral data exceeds reporting safety limit." }, { status: 503 });

    const signups = new Set<string>();
    const qualified = new Set<string>();
    const bookings = new Set<string>();
    for (const row of relationships) {
      const key = identity(row);
      if (!key) continue;
      if (isReferralActivitySince(row.signup_at, epoch.startedAt)) signups.add(key);
      if (isReferralActivitySince(row.qualified_at, epoch.startedAt)) qualified.add(key);
      if (isReferralActivitySince(row.first_booking_at, epoch.startedAt)) bookings.add(key);
    }
    for (const row of events) {
      if (isReferralActivitySince(row.occurred_at, epoch.startedAt)) {
        const key = identity(row);
        if (key) signups.add(key);
      }
    }
    return NextResponse.json({
      active: true,
      startedAt: epoch.startedAt,
      newSignups: signups.size, newQualified: qualified.size,
      firstBookings: bookings.size,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[referrals/me/period] unavailable", err);
    return NextResponse.json({ error: "Referral reporting unavailable" }, { status: 503 });
  }
}
