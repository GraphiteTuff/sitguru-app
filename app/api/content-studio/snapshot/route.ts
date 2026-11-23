import {NextRequest,NextResponse} from "next/server";
import {resolveRequestUser,mobileCorsHeaders,optionsWithMobileCors} from "@/lib/supabase/request-auth";
import {resolveAdminIdentityForUser} from "@/lib/admin/access";
import {canUseGrowthPortal} from "@/lib/admin/growth/access";
import {findInternByAccount,getInternOnboarding} from "@/lib/internship/queries";
import {internOnboardingComplete} from "@/lib/internship/onboarding";
import {loadInternContentStudio,loadManagerContentStudio} from "@/lib/internship/content-studio-actions";
import {studioStatusLabel} from "@/lib/internship/content-studio";

export const dynamic="force-dynamic";
export function OPTIONS(request:NextRequest){return optionsWithMobileCors(request);}
function send(request:NextRequest,body:unknown,status=200){
  return NextResponse.json(body,{status,headers:{...mobileCorsHeaders(request),"Cache-Control":"private, no-store"}});
}
export async function GET(request:NextRequest){
  const auth=await resolveRequestUser(request);
  if(!auth)return send(request,{error:"Sign in required."},401);
  if(!auth.user.email_confirmed_at)return send(request,{error:"Confirm your SitGuru account email."},403);
  const intern=await findInternByAccount({userId:auth.user.id,email:auth.user.email});
  let workspace:"intern"|"manager"="manager";
  let studio;
  if(intern && (!intern.userId || intern.userId===auth.user.id)){
    const onboarding=await getInternOnboarding(intern.id);
    if(!internOnboardingComplete(onboarding))return send(request,{error:"Complete intern onboarding first."},403);
    workspace="intern";
    studio=await loadInternContentStudio(intern.id);
  }else{
    const admin=await resolveAdminIdentityForUser(auth.user);
    if(!admin||!canUseGrowthPortal(admin))return send(request,{error:"Assigned Growth staff access required."},403);
    studio=await loadManagerContentStudio(auth.user.id,admin.isSuperUser);
  }
  // Do not leak captions, private storage paths, reviewer notes, intern email or
  // file metadata; native mobile shows safe summaries from the desktop workflow.
  return send(request,{
    ok:true,workspace,summary:studio.summary,
    items:studio.items.map(i=>({
      id:i.id,title:i.title,platform:i.platform,internName:i.internName,
      contentType:i.contentType,reviewStage:i.reviewStage,
      status:studioStatusLabel(i.status,i.reviewStage,i.publishedUrl),
      published:Boolean(i.publishedUrl),plannedAt:i.plannedAt,
      createdAt:i.createdAt,
    })),
    webPath:workspace==="intern"?"/intern/content":"/manager/campaigns-content",
    note:"Mobile summaries use the same source as Content Studio. Edit, approve and publish in the role-gated web workspace.",
  });
}
