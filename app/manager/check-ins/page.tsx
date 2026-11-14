import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildManagerCheckinSummary, type WeeklyCheckinRow } from "@/lib/internship/checkins-summary";
import ManagerCheckInsHome from "@/components/manager/ManagerCheckInsHome";

export const dynamic = "force-dynamic";

export default async function ManagerCheckInsPage({searchParams}:{
  searchParams?:Promise<Record<string,string|string[]|undefined>>;
}) {
  const access=await requireGrowthWorkplace("manager");
  if(!access.ok)return access.ui;
  const desk=await loadManagerDeskBundle();
  if(!desk)return (
    <section className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-[#0F2744]">Check-Ins unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">Manager Desk data could not be loaded. <Link href="/intern/manage" className="font-bold text-[#2563EB]">Open Intern Team Desk</Link></p>
    </section>
  );
  const byId=new Map(desk.cards.map(card=>[card.id,card]));
  const assignedIds=[...byId.keys()];
  const data=assignedIds.length?await supabaseAdmin
    .from("internship_weekly_reviews")
    .select("id,intern_id,week_of,review_status,submitted_at,accomplished,contribution_added,changing_next_week,hours_logged")
    .in("intern_id",assignedIds)
    .order("week_of",{ascending:false})
    .limit(500):{data:[],error:null};
  if(data.error)return (
    <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6">
      <h1 className="text-xl font-black text-[#0F2744]">Weekly reviews could not be loaded</h1>
      <p className="mt-2 text-sm font-medium text-slate-600">The live internship database returned an error. No check-in statistics are being estimated.</p>
    </section>
  );
  const raw=data.data||[];
  const ids=raw.map(row=>String(row.id));
  const comments=ids.length?await supabaseAdmin
    .from("internship_review_events")
    .select("target_id,comment,created_at")
    .eq("target_type","weekly")
    .in("target_id",ids)
    .order("created_at",{ascending:false})
    .limit(700):{data:[]};
  const latestComments=new Map<string,string>();
  for(const event of comments.data||[]){
    const id=String(event.target_id||"");
    if(id && !latestComments.has(id) && String(event.comment||"").trim())
      latestComments.set(id,String(event.comment||"").trim());
  }
  const rows:WeeklyCheckinRow[]=raw.map(row=>({
    id:String(row.id),
    internId:String(row.intern_id),
    internName:byId.get(String(row.intern_id))?.name||"Assigned Intern",
    avatarUrl:byId.get(String(row.intern_id))?.avatarUrl||"",
    weekOf:String(row.week_of||""),
    submittedAt:row.submitted_at?String(row.submitted_at):null,
    reviewStatus:String(row.review_status||"draft"),
    accomplishment:String(row.accomplished||""),
    contribution:String(row.contribution_added||""),
    nextWeek:String(row.changing_next_week||""),
    hoursLogged:row.hours_logged==null?null:Number(row.hours_logged),
    feedback:latestComments.get(String(row.id))||"",
  }));
  const localDate=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const now=new Date(`${localDate}T12:00:00Z`);
  const summary=buildManagerCheckinSummary({rows,activeInternIds:desk.cards.filter(c=>c.roster==="active" && c.summary.weekNumber>0).map(c=>c.id),now});
  const params=searchParams?await searchParams:{};
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]||"":value||"";
  return <ManagerCheckInsHome summary={summary} canCeo={access.actor.isSuperUser} notice={first(params.ok)} error={first(params.error)}/>;
}
