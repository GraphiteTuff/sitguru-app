import {NextResponse} from "next/server";
import {findApprovedEventShare} from "@/lib/event-match/service";
import {getBrandedSocialGraphicUrl} from "@/lib/community/social-assets";

export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Reuse the established event social image pipeline. */
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const share=await findApprovedEventShare(code);
  if(!share)return new Response("Not found",{status:404});
  const image=new URL(getBrandedSocialGraphicUrl(share.event.slug,"landscape"));
  return NextResponse.redirect(image,307);
}
