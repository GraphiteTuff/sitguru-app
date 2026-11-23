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
  const via=channels.has(search.via||"")?search.via!:"other";
  // Social preview crawlers and speculative prefetches are not human clicks.
  const requestHeaders=await headers();
  const agent=requestHeaders.get("user-agent")||"";
  const crawler=/bot|crawler|spider|facebookexternalhit|facebot|whatsapp|discord|pinterest|linkedin|slack|telegram|preview|embed|curl|wget/i.test(agent);
  const prefetch=Boolean(requestHeaders.get("next-router-prefetch")||requestHeaders.get("purpose")==="prefetch");
  if(!crawler&&!prefetch)await logPublicShareEvent(share.id,via==="qr"?"qr_open":"link_open",via);
  const label=GURU_MATCH_SERVICES.find(s=>s.key===share.service_key)?.label||"Pet care";
  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 text-[#0F2744] sm:py-12">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,39,68,0.12)]">
        <div className="bg-gradient-to-r from-[#0F2744] to-[#0D5C3A] p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-100">
            <PawPrint size={16}/> SITGURU · LOCAL PET CARE
          </p>
          <h1 className="mt-3 text-2xl font-black !text-white sm:text-3xl">Meet your local Guru</h1>
          <p className="mt-2 text-sm font-medium !text-emerald-50">Find care closer to home, with the flexibility your pets deserve.</p>
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center gap-4">
            {share.guru.photoUrl ? (
              <img src={share.guru.photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover"/>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <PawPrint size={30}/>
              </div>
            )}
            <div>
              <h2 className="text-xl font-black">{share.guru.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-600"><MapPin size={15}/>{share.city}, {share.state}</p>
              <p className="mt-1 text-sm font-bold text-[#0D5C3A]">{label}</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#D1EADD] bg-[#F0FDF4] p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={18}/> See services, experience and availability on SitGuru.</p>
            <p className="mt-1 text-xs text-slate-600">A match is an invitation to explore. Confirm availability and your pet’s needs directly with the Guru.</p>
          </div>
          <Link href={`/go/guru-match/${share.code}?intent=profile`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 font-black !text-white hover:bg-[#1D4ED8]">
            View Guru profile <ArrowRight size={18}/>
          </Link>
          <Link href={`/go/guru-match/${share.code}?intent=inquiry`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-4 py-3 font-black text-[#0D5C3A] hover:bg-[#DCFCE7]">
            <HeartHandshake size={18}/> Explore booking this Guru
          </Link>
          <p className="text-center text-xs text-slate-500">SitGuru · People. Happier pets. No booking or availability is guaranteed by this promotion.</p>
        </div>
      </div>
    </main>
  );
}
