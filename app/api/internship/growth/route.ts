import { NextRequest, NextResponse } from "next/server";
import { mobileCorsHeaders, optionsWithMobileCors, resolveRequestUser } from "@/lib/supabase/request-auth";
import { findInternByAccount, getInternOnboarding, getInternWorkspace } from "@/lib/internship/queries";
import { internOnboardingComplete, internOnboardingPublicState } from "@/lib/internship/onboarding";
import { loadStaffInbox } from "@/lib/messaging/staff-data";
import { buildInternGrowthSummary } from "@/lib/internship/growth-home-data";

export const dynamic="force-dynamic";
export function OPTIONS(req:NextRequest) { return optionsWithMobileCors(req); }
function json(req:NextRequest,payload:unknown,status=200) {
  return NextResponse.json(payload,{status,headers:{...mobileCorsHeaders(req),"Cache-Control":"private, no-store"}});
}

/** Same live, non-PII growth summary on web/PWA and native mobile. */
export async function GET(req:NextRequest) {
  const resolved=await resolveRequestUser(req);
  if(!resolved)return json(req,{error:"Sign in to your SitGuru Intern account."},401);
  if(!resolved.user.email_confirmed_at)return json(req,{error:"Verify your account email to open the internship workspace."},403);
  const intern=await findInternByAccount({userId:resolved.user.id,email:resolved.user.email});
  if(!intern || (intern.userId && intern.userId!==resolved.user.id))return json(req,{error:"This login is not linked to an approved internship record."},403);
  const ack=await getInternOnboarding(intern.id);
  if(!internOnboardingComplete(ack))return json(req,{onboardingRequired:true,...internOnboardingPublicState(ack)},403);
  const workspace=await getInternWorkspace(intern.id);
  if(!workspace)return json(req,{error:"Intern workspace is currently unavailable."},503);
  const inbox=await loadStaffInbox(resolved.user.id,false,"intern");
  const messages=inbox.conversations.slice(0,3).map(row=>({
    author:row.messages[row.messages.length-1]?.author || row.subject,
    preview:row.preview || row.messages[row.messages.length-1]?.body || "",
  }));
  return json(req,{capturedAt:new Date().toISOString(),summary:buildInternGrowthSummary({workspace,recentMessages:messages})});
}
