import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { getAvaLolaConnections, reconcileAvaLolaAccounts } from "@/lib/internship/ava-lola-connections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorize() {
  const actor=await getAdminIdentity();
  return actor?.isSuperUser && actor.canManageRoles ? actor : null;
}
function response(payload: unknown, status=200) {
  return NextResponse.json(payload,{status,headers:{"Cache-Control":"private, no-store"}});
}
export async function GET() {
  const actor=await authorize();
  if(!actor)return response({error:"Super Admin access required."},403);
  return response({checkedAt:new Date().toISOString(),accounts:await getAvaLolaConnections()});
}
export async function POST(req:NextRequest) {
  const actor=await authorize();
  if(!actor)return response({error:"Super Admin access required."},403);
  const origin=req.headers.get("origin");
  if(origin && origin!==req.nextUrl.origin)return response({error:"Invalid request origin."},403);
  const content=await req.json().catch(()=>({}));
  if(content?.confirm!=="RECONCILE_VERIFIED_AVA_LOLA")return response({error:"Explicit reconciliation confirmation required."},400);
  try {
    const changes=await reconcileAvaLolaAccounts(actor);
    const accounts=await getAvaLolaConnections();
    return response({changes,accounts,checkedAt:new Date().toISOString()});
  } catch(error) {
    return response({error:error instanceof Error?error.message:"Unable to reconcile accounts."},500);
  }
}
