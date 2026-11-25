import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, HeartHandshake, PawPrint, UserRound } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

export const dynamic = "force-dynamic";

type ReferralCode = {
  id: string;
  code: string;
  slug: string | null;
  owner_type: string | null;
  owner_name: string | null;
  issued_to_name: string | null;
  ambassador_id: string | null;
  partner_id: string | null;
  status: string;
};
type QueryParams = Record<string, string | string[] | undefined>;

function safeCode(value: string) {
  const text = decodeURIComponent(value).trim();
  return /^[a-z0-9_-]{2,64}$/i.test(text) ? text : "";
}
function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || "").trim().slice(0, 120);
}
function inviteHref(code: string, role: "pet_parent" | "guru" | "partner", via: string) {
  const params = new URLSearchParams({
    ref: code,
    role,
    source: "sitguru_referral_card",
    utm_source: "sitguru_referral",
    utm_medium: via,
    utm_campaign: "referral_invite",
  });
  if (role === "partner") return `/partners?${params.toString()}`;
  return `/signup?${params.toString()}`;
}

export default async function ReferralInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<QueryParams>;
}) {
  const { slug } = await params;
  const query = (await searchParams) || {};
  const rawCode = safeCode(slug);
  if (!rawCode) notFound();

  // Historic QR URLs use the code; newer registered URLs may use the slug.
  // Never create or modify a code just because a public URL is opened.
  const { data: slugRow, error: slugError } = await supabaseAdmin
    .from("referral_codes")
    .select("id,code,slug,owner_type,owner_name,issued_to_name,ambassador_id,partner_id,status")
    .eq("slug", rawCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const lookup = slugRow ? null : await supabaseAdmin
    .from("referral_codes")
    .select("id,code,slug,owner_type,owner_name,issued_to_name,ambassador_id,partner_id,status")
    .ilike("code", rawCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const row = (slugRow || lookup?.data) as ReferralCode | null;
  if (!row) {
    if (slugError || lookup?.error) console.warn("[referrals] invitation lookup unavailable");
    notFound();
  }

  const [ambassador, partner] = await Promise.all([
    row.ambassador_id
      ? supabaseAdmin.from("ambassadors").select("full_name,display_name,status").eq("id", row.ambassador_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.partner_id
      ? supabaseAdmin.from("partners").select("business_name,status").eq("id", row.partner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (partner.data && (partner.data as {status?:string}).status !== "active") notFound();

  const name = String(
    (partner.data as {business_name?:string}|null)?.business_name ||
    (ambassador.data as {display_name?:string;full_name?:string}|null)?.display_name ||
    (ambassador.data as {full_name?:string}|null)?.full_name ||
    row.issued_to_name || row.owner_name || "a SitGuru community member"
  ).trim().slice(0, 90);
  const via = first(query.via) === "qr" ? "qr" :
    ["partner_website", "website", "email", "social"].includes(first(query.utm_medium))
      ? first(query.utm_medium) : "link";
  const campaign = first(query.utm_campaign) || "referral_invite";

  // One landing-page event for this request. Signups/bookings are different
  // lifecycle events and must never be inferred from a visit.
  await trackReferralClick({
    referralCodeId: row.id,
    landingPage: `/r/${encodeURIComponent(rawCode)}?via=${encodeURIComponent(via)}`,
    utmSource: first(query.utm_source) || (row.partner_id ? "sitguru_partner" : "sitguru_ambassador"),
    utmMedium: via,
    utmCampaign: campaign,
  });
  const kind = row.partner_id ? "Partner" : row.owner_type === "guru" ? "Guru" : "Ambassador";
  const code = row.code;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e8fcf3_0%,#ffffff_44%,#f0f9ff_100%)] px-4 py-8 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xl font-black text-emerald-900 shadow-sm">
            <PawPrint className="h-7 w-7 text-emerald-700" /> SitGuru
          </Link>
          <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
            {kind} invitation
          </span>
        </header>
        <section className="mt-6 overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(5,46,22,0.09)]">
          <div className="bg-[linear-gradient(120deg,#c9f8de,#e6f9f4,#d8efff)] px-5 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm">
              <HeartHandshake size={31} />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">You're invited to SitGuru</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight !text-slate-950 sm:text-5xl">
              {name} invited you!
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-700">
              Trusted pet care and a stronger local community. Choose how you want to join, and your referral stays connected.
            </p>
            <p className="mx-auto mt-5 w-fit rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-950 shadow-sm">
              Referral code: <span className="tracking-widest">{code}</span>
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
            <Link href={inviteHref(code, "pet_parent", via)} className="flex min-h-36 flex-col justify-between rounded-3xl border border-emerald-200 bg-emerald-50 p-5 transition hover:bg-emerald-100">
              <PawPrint className="h-8 w-8 text-emerald-800" />
              <span className="mt-4 text-xl font-black text-slate-950">I'm a Pet Parent</span>
              <span className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-emerald-800">Find local care <ArrowRight size={17}/></span>
            </Link>
            <Link href={inviteHref(code, "guru", via)} className="flex min-h-36 flex-col justify-between rounded-3xl border border-sky-200 bg-sky-50 p-5 transition hover:bg-sky-100">
              <UserRound className="h-8 w-8 text-sky-800" />
              <span className="mt-4 text-xl font-black text-slate-950">I want to be a Guru</span>
              <span className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-sky-800">Create my profile <ArrowRight size={17}/></span>
            </Link>
            <Link href={inviteHref(code, "partner", via)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-emerald-900 sm:col-span-2">
              <BriefcaseBusiness size={19}/> Interested in partnering with SitGuru?
            </Link>
          </div>
        </section>
        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-slate-600">
          Visits and QR scans are counted separately from verified signups and completed bookings. Rewards are subject to program eligibility.
        </p>
      </div>
    </main>
  );
}
