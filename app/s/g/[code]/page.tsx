import Link from "next/link";
import {headers} from "next/headers";
import { notFound } from "next/navigation";
import { PawPrint,MapPin,ShieldCheck,ArrowRight,HeartHandshake } from "lucide-react";
import { findApprovedShare,logPublicShareEvent } from "@/lib/guru-match/service";
import { GURU_MATCH_SERVICES } from "@/lib/guru-match/matching";

export const dynamic="force-dynamic";
const channels=new Set(["facebook","instagram","tiktok","x","other","qr"]);
export default async function SharedGuruLanding({
  params,searchParams,
}:{params:Promise<{code:string}>;
  searchParams:Promise<{via?:string}>}){
  const {code}=await params;
  const share=await findApprovedShare(code);
  if(!share)notFound();
  const search=await searchParams;
  const via=(channels.has(search.via||"")?search.via:"other") as
    "facebook"|"instagram"|"tiktok"|"x"|"other"|"qr";
  // Social preview crawlers and speculative prefetches are not human clicks.
  const requestHeaders=await headers();
  const agent=requestHeaders.get("user-agent")||"";
  const crawler=/bot|crawler|spider|facebookexternalhit|facebot|whatsapp|discord|pinterest|linkedin|slack|telegram|preview|embed|curl|wget/i.test(agent);
  const prefetch=Boolean(requestHeaders.get("next-router-prefetch")||requestHeaders.get("purpose")==="prefetch");
  if(!crawler&&!prefetch)await logPublicShareEvent(share.id,via==="qr"?"qr_open":"link_open",via);
  const community=share.promotionType==="community";
  const firstName=community?"":share.guru.firstName;
  const label=share.service_key==="custom_care"?"Pet care":GURU_MATCH_SERVICES.find(s=>s.key===share.service_key)?.label||"Pet care";
  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 text-[#0F2744] sm:py-12">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,39,68,0.12)]">
        <div className="bg-gradient-to-r from-[#0F2744] to-[#0D5C3A] p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-100">
            <PawPrint size={16}/> SITGURU · LOCAL PET CARE
          </p>
          <h1 className="mt-3 text-2xl font-black !text-white sm:text-3xl">{community?"Find pet care with SitGuru":`Meet ${firstName}, your local Guru`}</h1>
          <p className="mt-2 text-sm font-medium !text-emerald-50">{community?"Browse pet care options and confirm availability before booking.":"Find care closer to home, with the flexibility your pets deserve."}</p>
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          {!community&&<div className="flex items-center gap-4">
            {share.guru.photoUrl ? (
              <img src={share.guru.photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover"/>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <PawPrint size={30}/>
              </div>
            )}
            <div>
              <h2 className="text-xl font-black">{share.guru.name.replace(/^\S+/,firstName)}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-600"><MapPin size={15}/>{share.city}, {share.state}</p>
              <p className="mt-1 text-sm font-bold text-[#0D5C3A]">{label}</p>
            </div>
          </div>}
          {community&&<div className="rounded-xl bg-[#EFF6FF] p-5">
            <h2 className="text-xl font-black text-[#0F2744]">Explore care in {share.city}, {share.state}</h2>
            <p className="mt-2 text-sm text-slate-700">SitGuru helps Pet Parents discover pet care providers. Availability and services vary by provider. This is a community discovery link, not a booking offer from any specific Guru.</p>
          </div>}
          <div className="rounded-xl border border-[#D1EADD] bg-[#F0FDF4] p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={18}/> {community?"Explore SitGuru care options.":"See services, experience and availability on SitGuru."}</p>
            {community ? (
              <p className="mt-1 text-xs text-slate-600">
                Compare providers and verify their availability and services before booking.
              </p>
            ) : (
              <div className="mt-3 border-t border-[#D1EADD] pt-3">
                <p className="text-lg font-black leading-snug text-[#0F2744]">
                  Hi, I’m {firstName}! <span aria-hidden="true">👋</span>
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#36534A]">
                  {share.guru.intro ||
                    "Take a look at my SitGuru profile to learn more about the care I offer and see if I’m a good fit for your pet."}
                </p>
              </div>
            )}
          </div>
          <Link prefetch={false} href={`/go/guru-match/${share.code}?intent=profile`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 font-black !text-white hover:bg-[#1D4ED8]">
            {community?"Find local pet care":`View ${firstName}’s profile`} <ArrowRight size={18}/>
          </Link>
          {!community&&<Link prefetch={false} href={`/go/guru-match/${share.code}?intent=inquiry`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-4 py-3 font-black text-[#0D5C3A] hover:bg-[#DCFCE7]">
            <HeartHandshake size={18}/> Explore booking with {firstName}
          </Link>}
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-[#D1EADD] bg-[#F0FDF4] p-4 text-center sm:p-5">
            <p className="text-sm font-black text-[#0F2744]">
              {community?"Scan to explore local pet care":`Scan to meet ${firstName} on SitGuru`}
            </p>
            <div className="rounded-2xl border border-[#D1EADD] bg-white p-3 shadow-sm">
              <img
                src={`/api/guru-match/qr/${encodeURIComponent(share.code)}`}
                width={224} height={224}
                alt={community?"Scannable QR code to explore SitGuru pet care":`Scannable QR code to meet ${firstName} on SitGuru`}
                className="block h-56 w-56 max-w-full rounded-lg"
                loading="eager"
              />
            </div>
            <p className="text-xs font-semibold text-[#326B58]">Share this QR code or scan it from another device.</p>
          </div>
          <p className="text-center text-sm font-bold text-[#0D5C3A]">Trusted Pet Care. Simplified.</p>
        </div>
      </div>
    </main>
  );
}
