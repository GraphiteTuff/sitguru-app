import { NextRequest } from "next/server";
import { communityJson } from "@/lib/community-studio/api-access";
import {
  guruMatchActor,loadCampaignDashboard,makeGuruShare,prepareGuruMiniCard,
  readMatchBody,updateGuruShare,
} from "@/lib/guru-match/service";
import { normalizeMatchFilters } from "@/lib/guru-match/matching";
import { optionsWithMobileCors } from "@/lib/supabase/request-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export function OPTIONS(request:NextRequest){return optionsWithMobileCors(request);}
function failure(request:NextRequest,error:unknown){
  const msg=error instanceof Error?error.message:"Guru Match & Share is unavailable.";
  const status=/sign in/i.test(msg)?401:/access|authorized|onboarding|not allowed|required/i.test(msg)?403:400;
  return communityJson(request,{ok:false,error:msg},status);
}
export async function GET(request:NextRequest){
  try{
    const actor=await guruMatchActor(request);
    const params=Object.fromEntries(request.nextUrl.searchParams);
    const filters=normalizeMatchFilters(params);
    const data=await loadCampaignDashboard(actor,filters);
    return communityJson(request,{ok:true,...data});
  }catch(error){return failure(request,error);}
}
export async function POST(request:NextRequest){
  try{
    const actor=await guruMatchActor(request,true);
    const input=await readMatchBody(request);
    if(input.action==="copy"||input.action==="shared")
      return communityJson(request,await updateGuruShare(actor,input));
    if(input.action==="prepare")
      return communityJson(request,{ok:true,share:await prepareGuruMiniCard(actor,input)});
    if(input.action && input.action!=="create")
      return communityJson(request,{ok:false,error:"Unsupported action."},400);
    return communityJson(request,{ok:true,share:await makeGuruShare(actor,input)},201);
  }catch(error){return failure(request,error);}
}
export async function PATCH(request:NextRequest){
  try{
    const actor=await guruMatchActor(request,true);
    const input=await readMatchBody(request);
    if(input.action!=="approve"&&input.action!=="reject")
      return communityJson(request,{ok:false,error:"Unsupported review action."},400);
    return communityJson(request,await updateGuruShare(actor,input));
  }catch(error){return failure(request,error);}
}
