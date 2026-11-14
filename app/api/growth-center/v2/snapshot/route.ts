import { NextRequest, NextResponse } from "next/server";
import { resolveRequestUser, mobileCorsHeaders, optionsWithMobileCors } from "@/lib/supabase/request-auth";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import type { GrowthAudience } from "@/lib/growth-center-v2/types";

export const dynamic="force-dynamic";
export function OPTIONS(req:NextRequest) { return optionsWithMobileCors(req); }
function json(req:NextRequest, body:unknown, status=200) {
  return NextResponse.json(body,{status,headers:{...mobileCorsHeaders(req),"Cache-Control":"private, no-store"}});
}

/** Browser cookie and native bearer sessions share the same authorized Growth snapshot. */
export async function GET(req:NextRequest) {
  const resolved=await resolveRequestUser(req);
  if(!resolved)return json(req,{error:"Sign in required."},401);
  if(!resolved.user.email_confirmed_at)return json(req,{error:"Confirm your SitGuru email before viewing Growth Insights."},403);
  const user=resolved.user;
  const intern=await findInternByAccount({userId:user.id,email:user.email});
  let audience:GrowthAudience;
  if(intern && (!intern.userId || intern.userId===user.id)) {
    const ack=await getInternOnboarding(intern.id);
    if(!internOnboardingComplete(ack))return json(req,{error:"Complete internship onboarding to view Growth Insights."},403);
    audience="intern";
  } else {
    const admin=await resolveAdminIdentityForUser(user);
    if(!admin||!canUseGrowthPortal(admin))return json(req,{error:"Growth Manager or Admin access required."},403);
    audience=admin.isSuperUser ? "admin" : "manager";
  }
  // Never trust a query-string role to elevate the viewer.
  const filters=parseFiltersFromSearch(req.nextUrl.searchParams);
  const snapshot=await loadGrowthCenterSnapshot({
    audience,filters,internUserId:audience==="intern"?user.id:null,
  });
  return json(req,snapshot);
}
