import {NextRequest,NextResponse} from "next/server";
import {findApprovedEventShare,logEventShareActivity} from "@/lib/event-match/service";
import {getPublicEventUrl} from "@/lib/community/slug";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const share=await findApprovedEventShare(code);
  if(!share)return NextResponse.redirect(new URL("/events", "https://www.sitguru.com"),307);
  const agent=request.headers.get("user-agent")||"";
  const crawler=/bot|crawler|spider|facebookexternalhit|facebot|whatsapp|discord|pinterest|linkedin|slack|telegram|preview|embed|curl|wget/i.test(agent);
  const prefetch=Boolean(request.headers.get("next-router-prefetch")||request.headers.get("purpose")==="prefetch");
  if(!crawler&&!prefetch)await logEventShareActivity(share.id,"event_click",share.channel);
  const target=new URL(getPublicEventUrl(share.event.slug));
  target.searchParams.set("utm_source",share.channel);
  target.searchParams.set("utm_medium","social");
  target.searchParams.set("utm_campaign","event-match-share");
  target.searchParams.set("utm_content",share.code);
  return NextResponse.redirect(target,307);
}
