import { NextRequest,NextResponse } from "next/server";
import { findApprovedShare,logPublicShareEvent } from "@/lib/guru-match/service";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const share=await findApprovedShare(code);
  if(!share)return NextResponse.redirect(new URL("/find-care","https://www.sitguru.com"),307);
  const inquiry=request.nextUrl.searchParams.get("intent")==="inquiry";
  const agent=request.headers.get("user-agent")||"";
  const crawler=/bot|crawler|spider|facebookexternalhit|facebot|whatsapp|discord|pinterest|linkedin|slack|telegram|preview|curl|wget/i.test(agent);
  const prefetch=Boolean(request.headers.get("next-router-prefetch")||request.headers.get("purpose")==="prefetch");
  if(!crawler&&!prefetch)await logPublicShareEvent(share.id,inquiry?"inquiry_click":"profile_click",share.channel);
  const community=share.promotionType==="community";
  const destination=community
    ?new URL("/find-care","https://www.sitguru.com")
    :new URL(`/guru/${encodeURIComponent(share.guru.slug)}`,"https://www.sitguru.com");
  if(community){
    destination.searchParams.set("city",share.city);
    destination.searchParams.set("state",share.state);
  }
  destination.searchParams.set("utm_source",share.channel);
  destination.searchParams.set("utm_medium","social");
  destination.searchParams.set("utm_campaign","guru-match-share");
  destination.searchParams.set("utm_content",share.code);
  if(inquiry&&!community)destination.searchParams.set("sitguru_intent","booking");
  return NextResponse.redirect(destination,307);
}
