import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CalendarDays, Handshake, MousePointerClick, QrCode, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";
import PartnerMarketingKitClient from "@/components/partners/PartnerMarketingKitClient";

export const dynamic = "force-dynamic";

type Partner = {
  id: string; owner_user_id: string | null; business_name: string | null;
  referral_code: string | null; slug: string | null; status: string | null;
  website: string | null; city: string | null; state: string | null;
};
const toNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const matchDate = (value: unknown, start: number) => {
  const timestamp = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) && timestamp >= start;
};
type Row = Record<string, unknown>;

export default async function PartnerDashboardPage({
  searchParams,
}: { searchParams?: Promise<{ partner?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fpartners%2Fdashboard");

  const admin = await getAdminIdentity();
  const isAdmin = Boolean(admin?.canAccessAdmin);
  const query = searchParams ? await searchParams : {};
  const partnerSlug = String(query.partner || "").trim().slice(0, 100);

  let partner: Partner | null = null;
  if (isAdmin && partnerSlug) {
    const { data } = await supabaseAdmin.from("partners")
      .select("id,owner_user_id,business_name,referral_code,slug,status,website,city,state")
      .eq("slug", partnerSlug).limit(1).maybeSingle();
    partner = (data || null) as Partner | null;
  }
  if (!partner) {
    const { data } = await supabaseAdmin.from("partners")
      .select("id,owner_user_id,business_name,referral_code,slug,status,website,city,state")
      .eq("owner_user_id", user.id).eq("status", "active")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    partner = (data || null) as Partner | null;
  }

  if (!partner) {
    const { data: adminPartners } = isAdmin
      ? await supabaseAdmin.from("partners").select("id,business_name,slug,status").eq("status", "active").limit(50)
      : { data: null };
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-slate-950">
        <h1 className="text-3xl font-black">SitGuru Partner Dashboard</h1>
        {isAdmin ? (
          <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6">
            <h2 className="text-xl font-black">View a partner as Admin</h2>
            <div className="mt-4 space-y-2">
              {(adminPartners || []).map(row => (
                <Link key={row.id} href={`/partners/dashboard?partner=${encodeURIComponent(row.slug || "")}`} className="block min-h-11 rounded-xl border border-emerald-100 p-3 text-sm font-black text-emerald-900 hover:bg-emerald-50">
                  {row.business_name || "Partner"} — View performance
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-base font-black text-amber-950">No active SitGuru Partner profile is linked to this account.</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">Ask SitGuru to connect your partner account to your approved business before viewing private referral data.</p>
            <Link href="/partners" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-black text-white">Partner Network</Link>
          </section>
        )}
      </main>
    );
  }

  const code = String(partner.referral_code || "").trim();
  const since = Date.now() - 30 * 86_400_000;
  const [registryResult, eventResult, campaignResult, rewardResult, relationshipResult, signupEventResult, bookingResult] = await Promise.all([
    supabaseAdmin.from("referral_codes").select("id,code").eq("partner_id", partner.id).eq("status", "active").limit(10),
    supabaseAdmin.from("partner_tracking_events").select("id,event_type,event_source,event_medium,created_at")
      .eq("partner_id", partner.id).order("created_at", { ascending: false }).limit(4000),
    supabaseAdmin.from("partner_campaigns").select("id,status").eq("partner_id", partner.id).limit(200),
    supabaseAdmin.from("partner_rewards").select("id,reward_amount,status").eq("partner_id", partner.id).limit(1000),
    code ? supabaseAdmin.from("pawperks_referral_relationships").select("id,signup_at,first_booking_at,referred_user_id")
      .ilike("referral_code", code).limit(1000) : Promise.resolve({ data: [], error: null }),
    code ? supabaseAdmin.from("pawperks_referral_events").select("id,event_type,occurred_at,referred_user_id")
      .ilike("submitted_code", code).eq("event_type", "signup_capture").limit(1000) : Promise.resolve({ data: [], error: null }),
    code ? supabaseAdmin.from("growth_campaign_events").select("id,event_type,created_at,booking_id,user_id,partner_code,referral_code")
      .ilike("partner_code", code).in("event_type", ["booking","signup"]).limit(1000) : Promise.resolve({ data: [], error: null }),
  ]);

  const registry = (registryResult.data || []) as Row[];
  const codeIds = registry.map(row => String(row.id || "")).filter(Boolean);
  const clickResult = codeIds.length
    ? await supabaseAdmin.from("referral_clicks").select("id,utm_medium,utm_source,created_at")
      .in("referral_code_id", codeIds).order("created_at", { ascending: false }).limit(4000)
    : { data: [], error: null };
  const clicks = (clickResult.data || []) as Row[];
  const events = (eventResult.data || []) as Row[];
  const linkVisits = clicks.length
    ? clicks.filter(row => matchDate(row.created_at,since) && row.utm_medium !== "qr").length
    : events.filter(row => matchDate(row.created_at,since) && row.event_type === "click" && row.event_medium !== "qr").length;
  const qrScans = clicks.length
    ? clicks.filter(row => matchDate(row.created_at,since) && row.utm_medium === "qr").length
    : events.filter(row => matchDate(row.created_at,since) && row.event_medium === "qr").length;

  const signupKeys = new Set<string>();
  function captureSignup(id: unknown, date: unknown) {
    if (!matchDate(date,since) || !id) return;
    signupKeys.add(String(id));
  }
  const relationships = (relationshipResult.data || []) as Row[];
  relationships.forEach(row => captureSignup(row.referred_user_id || row.id,row.signup_at));
  ((signupEventResult.data || []) as Row[]).forEach(row => captureSignup(row.referred_user_id || row.id,row.occurred_at));
  ((bookingResult.data || []) as Row[]).filter(r=>r.event_type==="signup").forEach(row=>captureSignup(row.user_id || row.id,row.created_at));

  const bookings = new Set<string>();
  relationships.filter(row => matchDate(row.first_booking_at,since)).forEach(row=>bookings.add(String(row.referred_user_id || row.id)));
  ((bookingResult.data || []) as Row[]).filter(row=>row.event_type==="booking" && matchDate(row.created_at,since))
    .forEach(row=>bookings.add(String(row.booking_id || row.id)));

  const rewards = (rewardResult.data || []) as Row[];
  const pendingRewards = rewards.filter(row => ["pending","under_review","approved"].includes(String(row.status || "").toLowerCase()));
  const pendingAmount = pendingRewards.reduce((sum,row)=>sum+Number(row.reward_amount || 0),0);
  const campaigns = (campaignResult.data || []) as Row[];
  const warnings = [registryResult.error, eventResult.error, campaignResult.error, rewardResult.error,
    relationshipResult.error, signupEventResult.error, bookingResult.error, clickResult.error]
    .filter(Boolean).map(error => (error as { message: string }).message);
  const metrics = [
    { label: "Website visits", value: toNumber(linkVisits), icon: MousePointerClick, subtitle: "Tracked link visits" },
    { label: "QR scans", value: toNumber(qrScans), icon: QrCode, subtitle: "In-person referrals" },
    { label: "Signups", value: toNumber(signupKeys.size), icon: Users, subtitle: "Captured signups" },
    { label: "Bookings", value: toNumber(bookings.size), icon: BadgeCheck, subtitle: "Attributed booking events" },
    { label: "Campaigns", value: toNumber(campaigns.filter(c=>c.status==="active").length), icon: TrendingUp, subtitle: "Active partner campaigns" },
    { label: "Rewards in review", value: "$" + pendingAmount.toFixed(2), icon: Handshake, subtitle: "Subject to approval" },
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f2fcf8_0%,#ffffff_55%)] px-3 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(125deg,#c6f4df_0%,#e4fbf5_50%,#e5f2ff_100%)] p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">SitGuru Partner Network · Private Dashboard</p>
          <h1 className="mt-2 text-3xl font-black !text-slate-950 sm:text-5xl">Welcome, {partner.business_name || "Partner"}!</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700">See what your SitGuru website badge, QR code and introductions are generating. The numbers below are actual recorded events, not sample data.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white bg-white/90 px-4 py-2 text-xs font-black text-emerald-900">Status: {partner.status}</span>
            <span className="rounded-full border border-white bg-white/90 px-4 py-2 text-xs font-black text-emerald-900">Last 30 days</span>
            <Link href="/partners/dashboard/community/events" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-xs font-black text-white">Pet Event Manager</Link>
          </div>
        </section>

        <section aria-label="Partner metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map(metric=>{const Icon=metric.icon;return(
            <div key={metric.label} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <Icon size={21} className="text-emerald-700" aria-hidden="true"/>
              <p className="mt-2 text-xs font-black text-slate-600">{metric.label}</p>
              <p className="mt-2 text-3xl font-black tabular-nums text-emerald-950">{metric.value}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{metric.subtitle}</p>
            </div>
          )})}
        </section>

        {code && partner.slug ? (
          <PartnerMarketingKitClient partnerName={partner.business_name || "SitGuru Partner"} referralCode={code} slug={partner.slug}/>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">
            Your partner profile needs a referral code and link before promotion. Contact SitGuru Admin to complete setup.
          </section>
        )}
        <section id="partner-rewards" className="rounded-[26px] border border-emerald-100 bg-white p-5">
          <h2 className="text-2xl font-black text-emerald-950">Your referral activity</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Link visits, QR scans, signups and booking events are measured separately. Rewards are subject to the agreed partner program and review.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-slate-600">Code status</p><p className="mt-2 text-lg font-black text-emerald-950">{registry.length ? "Connected" : "Registry link pending"}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-slate-600">Open reward reviews</p><p className="mt-2 text-lg font-black text-emerald-950">{pendingRewards.length}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-slate-600">Most recent visit</p><p className="mt-2 text-lg font-black text-emerald-950">{clicks[0]?.created_at || events[0]?.created_at ? new Date(String(clicks[0]?.created_at || events[0]?.created_at)).toLocaleDateString("en-US") : "Not yet"}</p></div>
          </div>
        </section>
        {warnings.length ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-950">Tracking sources require attention: {warnings.join(" · ")}</p> : null}
      </div>
    </main>
  );
}
