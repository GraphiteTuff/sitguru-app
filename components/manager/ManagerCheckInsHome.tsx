import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardCheck, MessageCircle, Users, AlertCircle } from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { reviewPortalSubmission } from "@/lib/internship/portal-actions";
import { isApprovedWeeklyReview, needsWeeklyReview, type CheckinSummary, type WeeklyCheckinRow } from "@/lib/internship/checkins-summary";
import { reviewStageLabel } from "@/lib/internship/review-flow";

function ReviewActions({row,canCeo}:{row:WeeklyCheckinRow;canCeo:boolean}) {
  const stage=row.reviewStatus.toLowerCase();
  const routine=stage==="submitted_to_ava"||stage==="submitted";
  const ceo=stage==="submitted_to_jason" && canCeo;
  if(!routine&&!ceo)return null;
  const approval=ceo?"ceo_approve":"approve";
  const changes=ceo?"ceo_request_changes":"request_changes";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <form action={reviewPortalSubmission}>
        <input type="hidden" name="internId" value={row.internId}/>
        <input type="hidden" name="targetType" value="weekly"/>
        <input type="hidden" name="targetId" value={row.id}/>
        <input type="hidden" name="returnTo" value="/manager/check-ins"/>
        <button name="reviewAction" value={approval} className="min-h-11 rounded-xl bg-[#166534] px-3 text-xs font-black !text-white hover:bg-[#14532D]">
          {ceo?"CEO approve":"Approve"}
        </button>
      </form>
      <form action={reviewPortalSubmission} className="flex min-w-0 flex-1 flex-wrap gap-2">
        <input type="hidden" name="internId" value={row.internId}/>
        <input type="hidden" name="targetType" value="weekly"/>
        <input type="hidden" name="targetId" value={row.id}/>
        <input type="hidden" name="returnTo" value="/manager/check-ins"/>
        <input name="comment" required aria-label={"Requested changes for "+row.internName} placeholder="Feedback required" className="min-h-11 min-w-40 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0F2744]"/>
        <button name="reviewAction" value={changes} className="min-h-11 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-900">Request changes</button>
      </form>
    </div>
  );
}
function formatDate(value:string|null|undefined) {
  if(!value)return "Not submitted";
  const date=new Date(value.includes("T")?value:`${value}T12:00:00`);
  return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function Status({value}:{value:string}){
  const status=reviewStageLabel(value||"draft");
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${isApprovedWeeklyReview(value)?"bg-emerald-100 text-emerald-900":needsWeeklyReview(value)?"bg-amber-100 text-amber-900":"bg-slate-100 text-slate-700"}`}>{status}</span>;
}
export default function ManagerCheckInsHome({summary,canCeo,notice="",error=""}:{
  summary:CheckinSummary;canCeo:boolean;notice?:string;error?:string;
}) {
  const {rows,needsReview,approved,submittedThisWeek,expectedThisWeek,submissionRate,recentWeeks}=summary;
  return (
    <ManagerSectionScaffold
      title="Check-Ins"
      subtitle="Weekly reviews submitted by your assigned interns. Approval and feedback update their Intern Portal and Growth Workspace."
      overlay="Progress today. Stronger communities for tomorrow."
      icon={<ClipboardCheck size={22} />}
      stats={[
        {label:"Submitted This Week",value:submittedThisWeek,detail:expectedThisWeek?`Of ${expectedThisWeek} assigned active interns`:"No active intern check-ins expected",tone:"sky",icon:<Users size={18}/>},
        {label:"Needs Review",value:needsReview,tone:"violet",icon:<MessageCircle size={18}/>},
        {label:"Approved",value:approved,detail:"Recorded approvals",tone:"green",icon:<CheckCircle2 size={18}/>},
        {label:"Submission Rate",value:submissionRate==null?"—":`${submissionRate}%`,detail:submissionRate==null?"No eligible weekly submissions yet":"Current calendar week",tone:"amber",icon:<CalendarDays size={18}/>},
      ]}
    >
      {notice?<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{notice}</p>:null}
      {error?<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>:null}
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
          <div>
            <h2 className="text-lg font-black text-[#0F2744]">Weekly check-ins ({rows.length})</h2>
            <p className="mt-1 text-xs font-medium text-slate-600">{needsReview} awaiting review · {approved} approved</p>
          </div>
          <Link href="/intern/manage?tab=reviews" className="inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white">Open full review queue</Link>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs font-black uppercase tracking-wide text-slate-500">
                <tr><th scope="col" className="px-4 py-3">Week</th><th scope="col" className="px-4 py-3">Intern</th><th scope="col" className="px-4 py-3">Work reported</th><th scope="col" className="px-4 py-3">Submitted</th><th scope="col" className="px-4 py-3">Review</th></tr>
              </thead>
              <tbody>
                {rows.map(row=>(
                  <tr key={row.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-[#0F2744]">{formatDate(row.weekOf)}</td>
                    <td className="min-w-40 px-4 py-4">
                      <InternName name={row.internName} src={row.avatarUrl} className="font-bold text-[#0F2744]"/>
                      <Link href={`/intern?view=${encodeURIComponent(row.internId)}`} className="mt-2 block text-xs font-bold text-[#2563EB]">View student record</Link>
                    </td>
                    <td className="min-w-64 max-w-[370px] px-4 py-4">
                      <p className="line-clamp-3 whitespace-pre-line text-sm font-semibold text-slate-700">{row.accomplishment || row.contribution || "No work details entered"}</p>
                      {row.hoursLogged!=null?<p className="mt-1 text-xs text-slate-500">{row.hoursLogged} hours reported (not necessarily approved)</p>:null}
                      {row.feedback?<p className="mt-2 rounded-lg bg-[#EFF6FF] p-2 text-xs font-medium text-[#0F2744]">Latest manager feedback: {row.feedback}</p>:null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(row.submittedAt)}</td>
                    <td className="min-w-64 px-4 py-4">
                      <Status value={row.reviewStatus}/>
                      <ReviewActions row={row} canCeo={canCeo}/>
                      {row.reviewStatus==="submitted_to_jason"&&!canCeo?<p className="mt-2 text-xs font-bold text-amber-900">Escalated to Jason for CEO review</p>:null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):(
          <div className="flex gap-3 p-6 text-slate-600"><AlertCircle className="shrink-0 text-[#2563EB]" size={21}/><p className="text-sm font-medium">No weekly check-ins have been submitted by your assigned interns yet. Once Lola or another assigned intern submits, their entry will appear here automatically.</p></div>
        )}
      </article>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Six-week submission trend</h2>
          <p className="mt-1 text-xs font-medium text-slate-600">Actual weekly submissions and approvals. No sample activity.</p>
          <div className="mt-5 grid grid-cols-6 items-end gap-2">
            {recentWeeks.map(w=>{
              const height=Math.max(...recentWeeks.map(x=>x.submitted),1);
              return <div key={w.week} className="text-center">
                <div className="flex h-28 items-end justify-center gap-1 border-b border-slate-200 pb-1">
                  <div aria-label={`${w.submitted} submitted`} className="w-1/3 rounded-t bg-[#60A5FA]" style={{height:`${w.submitted/height*100}%`}}/>
                  <div aria-label={`${w.approved} approved`} className="w-1/3 rounded-t bg-[#22C55E]" style={{height:`${w.approved/height*100}%`}}/>
                </div>
                <p className="mt-2 text-[10px] font-black text-slate-600">{formatDate(w.week).replace(/, \d{4}$/, "")}</p>
                <p className="text-[10px] text-slate-500">{w.submitted}/{w.approved}</p>
              </div>;
            })}
          </div>
          <p className="mt-3 text-xs text-slate-600"><span className="font-bold text-[#2563EB]">Blue</span> submitted · <span className="font-bold text-[#166534]">Green</span> approved</p>
        </section>
        <section className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Manager actions</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/intern/manage?tab=reviews" className="rounded-xl bg-[#EFF6FF] px-4 py-3 text-sm font-black text-[#1D4ED8]">Review all intern submissions</Link>
            <Link href="/manager/messages" className="rounded-xl bg-[#FFF7ED] px-4 py-3 text-sm font-black text-[#C2410C]">Send a coaching message</Link>
            <Link href="/manager/insights" className="rounded-xl bg-[#F0FDF4] px-4 py-3 text-sm font-black text-[#166534]">View live Growth Insights</Link>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-600">Interns submit their own weekly check-ins. Approval and revision decisions stay in the SitGuru review workflow and are shared with Admin HQ.</p>
        </section>
      </div>
    </ManagerSectionScaffold>
  );
}
