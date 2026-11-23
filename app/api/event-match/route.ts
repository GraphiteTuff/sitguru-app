import { NextRequest } from "next/server";
import { communityJson } from "@/lib/community-studio/api-access";
import { optionsWithMobileCors } from "@/lib/supabase/request-auth";
import {
  eventMatchActor,readEventMatchBody,loadEventShareDashboard,
  createEventShare,updateEventShare,
} from "@/lib/event-match/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function OPTIONS(request:NextRequest){return optionsWithMobileCors(request);}
function failure(request:NextRequest,error:unknown){
  const message=error instanceof Error?error.message:"Event Match & Share is unavailable.";
  const status=/sign in/i.test(message)?401:/access|authorized|onboarding|not allowed|required/i.test(message)?403:400;
  return communityJson(request,{ok:false,error:message},status);
}
export async function GET(request:NextRequest){
  try{
    const actor=await eventMatchActor(request);
    const data=await loadEventShareDashboard(actor,Object.fromEntries(request.nextUrl.searchParams));
    return communityJson(request,{ok:true,...data});
  }catch(error){return failure(request,error);}
}
export async function POST(request:NextRequest){
  try{
    const actor=await eventMatchActor(request,true);
    const input=await readEventMatchBody(request);
    if(input.action==="copy"||input.action==="shared"){
      return communityJson(request,await updateEventShare(actor,input));
    }
    if(input.action&&input.action!=="create"){
      return communityJson(request,{ok:false,error:"Unsupported action."},400);
    }
    const share=await createEventShare(actor,input);
    return communityJson(request,{ok:true,share},201);
  }catch(error){return failure(request,error);}
}
export async function PATCH(request:NextRequest){
  try{
    const actor=await eventMatchActor(request,true);
    const input=await readEventMatchBody(request);
    if(input.action!=="approve"&&input.action!=="reject")
      return communityJson(request,{ok:false,error:"Unsupported review action."},400);
    return communityJson(request,await updateEventShare(actor,input));
  }catch(error){return failure(request,error);}
}
