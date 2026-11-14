export type WeeklyCheckinRow = {
  id: string;
  internId: string;
  internName: string;
  avatarUrl: string;
  weekOf: string;
  submittedAt: string | null;
  reviewStatus: string;
  accomplishment: string;
  contribution: string;
  nextWeek: string;
  hoursLogged: number | null;
  feedback: string;
};
export type CheckinSummary = {
  rows: WeeklyCheckinRow[];
  needsReview: number;
  approved: number;
  submittedThisWeek: number;
  totalThisWeek: number;
  expectedThisWeek: number;
  submissionRate: number | null;
  recentWeeks: Array<{ week: string; submitted: number; approved: number }>;
};

const APPROVED = new Set(["approved","ava_approved","ceo_approved","approved_complete"]);
const SUBMITTED = new Set(["submitted","submitted_to_ava","submitted_to_jason","ava_approved","ceo_approved","approved_complete","approved"]);
const NEEDS_REVIEW = new Set(["submitted","submitted_to_ava","submitted_to_jason"]);
export const isSubmittedWeeklyReview = (status:string) => SUBMITTED.has(status.toLowerCase());
export const isApprovedWeeklyReview = (status:string) => APPROVED.has(status.toLowerCase());
export const needsWeeklyReview = (status:string) => NEEDS_REVIEW.has(status.toLowerCase());

export function weekMonday(date:string) {
  const parsed=new Date(`${date.slice(0,10)}T12:00:00Z`);
  if(Number.isNaN(parsed.getTime()))return "";
  parsed.setUTCDate(parsed.getUTCDate()-(parsed.getUTCDay()+6)%7);
  return parsed.toISOString().slice(0,10);
}
export function buildManagerCheckinSummary(input:{
  rows:WeeklyCheckinRow[];
  activeInternIds:string[];
  now?:Date;
}):CheckinSummary{
  const now=input.now||new Date();
  const day=now.toISOString().slice(0,10);
  const monday=weekMonday(day);
  const rows=[...input.rows].sort((a,b)=>String(b.submittedAt||b.weekOf).localeCompare(String(a.submittedAt||a.weekOf)));
  const active=new Set(input.activeInternIds);
  const uniqueThisWeek=new Set(rows.filter(r=>active.has(r.internId)&&weekMonday(r.weekOf)===monday&&isSubmittedWeeklyReview(r.reviewStatus)).map(r=>r.internId));
  const expectedThisWeek=active.size;
  const recentWeeks=Array.from({length:6},(_,i)=>{
    const t=new Date(monday+"T12:00:00Z");t.setUTCDate(t.getUTCDate()-(5-i)*7);
    const week=t.toISOString().slice(0,10);
    const matching=rows.filter(r=>weekMonday(r.weekOf)===week);
    return {week,submitted:matching.filter(r=>isSubmittedWeeklyReview(r.reviewStatus)).length,approved:matching.filter(r=>isApprovedWeeklyReview(r.reviewStatus)).length};
  });
  return {
    rows,
    needsReview:rows.filter(r=>needsWeeklyReview(r.reviewStatus)).length,
    approved:rows.filter(r=>isApprovedWeeklyReview(r.reviewStatus)).length,
    submittedThisWeek:uniqueThisWeek.size,
    totalThisWeek:rows.filter(r=>weekMonday(r.weekOf)===monday).length,
    expectedThisWeek,
    submissionRate:expectedThisWeek?Math.round((uniqueThisWeek.size/expectedThisWeek)*100):null,
    recentWeeks,
  };
}
