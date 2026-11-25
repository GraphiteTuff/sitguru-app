import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Handshake, PawPrint, QrCode, ShieldCheck, Users } from "lucide-react";
import { resolvePublicReferral, referralCampaign, referralSignupUrl } from "@/lib/referrals/public-referral";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function fromQuery(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value || "").trim().slice(0, 90);
}

export default async function PublicReferralInvitation({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const referral = await resolvePublicReferral(slug);
  if (!referral) notFound();

  const via = fromQuery(query, "via") === "qr" ? "qr" : "link";
  const medium = via === "qr" ? "qr" : fromQuery(query, "utm_medium") || "link";
  const source = fromQuery(query, "utm_source") ||
    (referral.partnerId ? "partner_website" : referral.ambassadorId ? "sitguru_ambassador" : "sitguru_referrals");
  const campaign = fromQuery(query, "utm_campaign") || referralCampaign(referral);

  await trackReferralClick({
    referralCodeId: referral.id,
    landingPage: `/r/${encodeURIComponent(referral.code)}?via=${via}`,
    utmSource: source,
    utmMedium: medium,
    utmCampaign: campaign,
  });

  const tracking = { medium, source, campaign };
  const parentUrl = referralSignupUrl(referral, "pet_parent", tracking);
  const guruUrl = referralSignupUrl(referral, "guru", tracking);
  const partnerUrl = `/partners?ref=${encodeURIComponent(referral.code)}&utm_source=${encodeURIComponent(source)}&utm_campaign=${encodeURIComponent(campaign)}`;
  const isAmbassador = Boolean(referral.ambassadorId);
  const isPartner = Boolean(referral.partnerId);
  const identity = referral.displayName;
  const posterUrl = isAmbassador && referral.isPublicAmbassador
    ? `/api/ambassador/card/${encodeURIComponent(referral.code)}` : null;
  const invitationUrl = `/r/${encodeURIComponent(referral.code)}?via=qr`;
  const qrSrc = "https://api.qrserver.com/v1/create-qr-code/?size=460x460&margin=12&data=" +
    encodeURIComponent("https://www.sitguru.com" + invitationUrl);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fcf9_0%,#ffffff_60%,#edf8f3_100%)] text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#0D5C3A]">SitGuru <span className="text-sm font-bold text-emerald-800">• Connect & Care</span></Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
            <BadgeCheck size={17} aria-hidden="true" /> Tracked SitGuru Invitation
          </span>
        </div>
        <div className="grid overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_24px_72px_rgba(15,80,55,0.09)] lg:grid-cols-2">
          <div className="bg-[radial-gradient(circle_at_90%_10%,#d8f1ff_0%,transparent_31%),linear-gradient(130deg,#cbf6e5_0%,#f5fdfb_64%,#eff8ff_100%)] p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              {isPartner ? "SitGuru Partner Invitation" : isAmbassador ? "Your SitGuru Ambassador" : "You're invited to SitGuru"}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.08] tracking-tight !text-slate-950 sm:text-5xl">
              {identity} {isPartner ? "welcomes you to SitGuru." : isAmbassador ? "invites you to SitGuru!" : "invited you to join SitGuru."}
            </h1>
            {referral.region ? <p className="mt-3 text-sm font-bold text-emerald-800">{referral.region}</p> : null}
            <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-slate-700">
              Meet trusted local pet care, or grow your own pet care business. Your invitation is already connected to this referral code.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
              <PawPrint size={25} className="text-emerald-700" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invitation code</p>
                <p className="break-words text-xl font-black text-emerald-950">{referral.code}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={parentUrl} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3 text-base font-black !text-white transition hover:bg-emerald-900">
                <PawPrint size={21} aria-hidden="true" /> I'm a Pet Parent
              </Link>
              <Link href={guruUrl} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-300 bg-white px-4 py-3 text-base font-black text-emerald-950 transition hover:bg-emerald-50">
                <Users size={21} aria-hidden="true" /> Become a Guru
              </Link>
            </div>
            <Link href={partnerUrl} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-black text-emerald-800 underline-offset-4 hover:underline">
              <Handshake size={18} aria-hidden="true" /> Interested in partnering with SitGuru? <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center gap-5 bg-white px-5 py-7 sm:px-9 lg:py-9">
            {posterUrl ? (
              <>
                <img src={posterUrl} alt={`SitGuru Ambassador referral poster for ${identity}`} className="w-full max-w-[435px] rounded-[22px] border border-emerald-100 bg-emerald-50 shadow-lg" />
                <a href={posterUrl + "?download=1"} download={`sitguru-${referral.code.toLowerCase()}-ambassador.png`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 px-5 text-sm font-black text-emerald-950 hover:bg-emerald-50">Save Ambassador promotional card</a>
              </>
            ) : (
              <div className="w-full max-w-[435px] rounded-[28px] bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
                <div className="text-lg font-black">SitGuru <span className="text-emerald-200">Partner Network</span></div>
                <h2 className="mt-8 text-3xl font-black !text-white">{identity}</h2>
                <p className="mt-3 text-sm font-semibold text-emerald-50">Proudly helping families discover local pet care.</p>
                <div className="mt-6 rounded-2xl bg-white p-4">
                  <img src={qrSrc} alt={`Scan to open the ${identity} SitGuru invitation`} className="mx-auto aspect-square w-full max-w-[300px]" />
                </div>
                <p className="mt-5 text-center text-sm font-black uppercase tracking-wider text-emerald-100">Scan to Connect</p>
              </div>
            )}
            <p className="flex items-center gap-2 text-center text-xs font-semibold text-slate-600"><QrCode size={17} className="text-emerald-700" aria-hidden="true" /> This QR opens this invitation—not SitGuru's generic homepage.</p>
          </div>
        </div>
        <p className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-2 text-center text-xs font-semibold text-slate-600">
          <ShieldCheck size={17} className="shrink-0 text-emerald-700" aria-hidden="true" />
          Referral visits and signups are recorded separately. Any reward requires SitGuru verification and approval.
        </p>
      </section>
    </main>
  );
}
