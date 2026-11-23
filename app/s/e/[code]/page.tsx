import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays,MapPin,ArrowRight,PawPrint,CheckCircle2 } from "lucide-react";
import { findApprovedEventShare,logEventShareActivity,eventSocialImage } from "@/lib/event-match/service";
import { getPublicEventUrl } from "@/lib/community/slug";
import { formatEventDateRange } from "@/lib/community/format";
import CommunityJoinOptions from "@/components/community/CommunityJoinOptions";
import {getEventPromotionInfo} from "@/lib/community/event-taxonomy";

export const dynamic = "force-dynamic";
type Props={params:Promise<{code:string}>,searchParams:Promise<{via?:string}>};
const sources=new Set(["facebook","instagram","tiktok","x","other","qr"]);
function isPreview(headersValue:Headers){
  const agent=headersValue.get("user-agent")||"";
  return /bot|crawler|spider|facebookexternalhit|facebot|whatsapp|discord|pinterest|linkedin|slack|telegram|preview|embed|curl|wget/i.test(agent)
    ||Boolean(headersValue.get("next-router-prefetch")||headersValue.get("purpose")==="prefetch");
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {code}=await params,share=await findApprovedEventShare(code);
  if(!share)return {title:"Event unavailable | SitGuru"};
  const e=share.event;
  return {
    title:e.title+" | SitGuru Pet Events",
    description:"Discover "+e.title+" in "+(e.city||"your community")+". See details and RSVP on SitGuru.",
    openGraph:{
      title:e.title+" | SitGuru Pet Events",
      description:"Discover this local pet event and join your community on SitGuru.",
      type:"website",url:"https://www.sitguru.com/s/e/"+code,
      images:[{url:eventSocialImage(e.slug),width:1200,height:630,alt:e.title}],
    },
    twitter:{card:"summary_large_image",images:[eventSocialImage(e.slug)]},
  };
}
export default async function EventShareLanding({params,searchParams}:Props){
  const {code}=await params;
  const share=await findApprovedEventShare(code);
  if(!share)redirect("/events");
  const query=await searchParams;
  const source=(sources.has(query.via||"")?query.via:"other") as
    "facebook"|"instagram"|"tiktok"|"x"|"other"|"qr";
  const requestHeaders=await headers();
  if(!isPreview(requestHeaders))await logEventShareActivity(share.id,source==="qr"?"qr_open":"link_open",source);
  const e=share.event;
  const timing=formatEventDateRange(e.start_at,e.end_at,e.timezone);
  return <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 text-[#0F2744] sm:py-12">
    <article className="mx-auto max-w-xl overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-xl">
      <header className="bg-gradient-to-r from-[#0F2744] to-[#0D5C3A] p-6 text-white">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest !text-emerald-100"><PawPrint size={18}/> Featured by SitGuru · {getEventPromotionInfo(e).label}</p>
        <h1 className="mt-3 text-2xl font-black !text-white sm:text-3xl">{e.title}</h1>
        <p className="mt-2 text-sm !text-emerald-50">Discover local pet events · Powered by SitGuru.</p>
      </header>
      <div className="space-y-5 p-5 sm:p-7">
        {e.image_card_url||e.image_hero_url||e.image_original_url?
          <img src={e.image_card_url||e.image_hero_url||e.image_original_url||""} alt="" className="h-48 w-full rounded-xl object-cover" />:null}
        <p className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={18} className="text-[#0D5C3A]"/>{timing.dateLabel}</p>
        <p className="flex items-center gap-2 text-sm font-bold"><MapPin size={18} className="text-[#0D5C3A]"/>{[e.venue_name,e.city,e.state].filter(Boolean).join(" · ")}</p>
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={16}/> Event details and RSVP on SitGuru</p>
        <Link prefetch={false} href={"/go/event-match/"+encodeURIComponent(code)+"?via="+source}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-black !text-white hover:bg-[#1D4ED8]">
          See event &amp; RSVP <ArrowRight size={18}/>
        </Link>
        <Link href={getPublicEventUrl(e.slug)} className="block text-center text-xs font-semibold text-[#0D5C3A]">View event directly on SitGuru</Link>
        <CommunityJoinOptions slug={e.slug} eventId={e.id} variant="event" source="event_share_landing" campaign="event_match_share_join" />
        <p className="text-center text-xs text-slate-500">Featured by SitGuru, not organized or sponsored by SitGuru unless explicitly stated. Confirm details with the event host.</p>
      </div>
    </article>
  </main>;
}
