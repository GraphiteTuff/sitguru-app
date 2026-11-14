import type { InternshipWorkspaceData, InternshipTask } from "@/lib/internship/types";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import { taskStatusLabel } from "@/lib/internship/labels";
import type InternGrowthWorkspaceHome from "@/components/internship/InternGrowthWorkspaceHome";

export type InternGrowthSummary = Parameters<typeof InternGrowthWorkspaceHome>[0];
const COMPLETE_STATUSES = new Set(["approved","complete","completed","done"]);
const OPEN_EXCEPTIONS = new Set(["cancelled","canceled","not_accepted"]);

function isComplete(task: InternshipTask) {
  const status = String(task.status||"").toLowerCase();
  const reviewStage=String(task.reviewStage||"").toLowerCase();
  return COMPLETE_STATUSES.has(status) || task.supervisorApproved === true ||
    ["approved_complete","ceo_approved"].includes(reviewStage);
}
function formatDue(iso:string|null|undefined) {
  if(!iso)return "Not scheduled";
  const parsed=new Date(iso.includes("T")?iso:`${iso}T12:00:00`);
  return Number.isNaN(parsed.getTime())?"Not scheduled":parsed.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function pct(done:number,total:number) {
  return total>0?Math.min(100,Math.max(0,Math.round((done/total)*100))):null;
}
function startOfCurrentWeek(now:Date) {
  const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  return [monday.getFullYear(),String(monday.getMonth()+1).padStart(2,"0"),String(monday.getDate()).padStart(2,"0")].join("-");
}

export function buildInternGrowthSummary(input:{
  workspace:InternshipWorkspaceData;
  now?:Date;
  recentMessages?:Array<{author:string;preview:string}>;
}):InternGrowthSummary {
  const {workspace}=input;
  const now=input.now||new Date();
  const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const weekEnd=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  weekEnd.setDate(weekEnd.getDate()+7);
  const sevenDays=[weekEnd.getFullYear(),String(weekEnd.getMonth()+1).padStart(2,"0"),String(weekEnd.getDate()).padStart(2,"0")].join("-");
  const hourSummary=summarizeInternshipHours({
    requiredHours:workspace.intern.requiredHours,
    requirementStatus:workspace.intern.requirementStatus,
    plannedWeeklyHours:workspace.intern.plannedWeeklyHours,
    internshipWeeks:workspace.intern.internshipWeeks,
    startDate:workspace.intern.academicStartDate,
    today:now,
    entries:(workspace.timeLogs||[]).map(row=>({
      workedOn:row.workedOn,hours:row.hours,status:row.status,weekNumber:row.weekNumber,
    })),
    exceptions:workspace.scheduleExceptions,
    weekZeroReady:true,
    internshipStatus:workspace.intern.status,
  });
  const assignedTasks=(workspace.tasks||[]).filter(task=>!OPEN_EXCEPTIONS.has(String(task.status||"").toLowerCase()));
  const openTasks=assignedTasks.filter(task=>!isComplete(task));
  const nextTask=[...openTasks].sort((a,b)=>(a.dueOn||"9999").localeCompare(b.dueOn||"9999"))[0];
  const dueSoon=openTasks.filter(task=>task.dueOn && task.dueOn<=sevenDays).length;
  const relevantMilestones=(workspace.milestones||[]).filter(m=>!m.universityId || m.universityId===workspace.intern.universityId);
  const completedMilestones=relevantMilestones.filter(m=>COMPLETE_STATUSES.has(String(m.status||"").toLowerCase())).length;
  const monday=startOfCurrentWeek(now);
  const reviewThisWeek=(workspace.weeklyReviews||[]).find(row=>row.weekOf>=monday && row.weekOf<=today && /submit|approv|complete/i.test(String(row.reviewStatus||"")));
  const activeWeek=hourSummary.weekNumber>0 && workspace.intern.status==="active";
  const checkInDue=activeWeek && !reviewThisWeek;
  const upcoming=[
    ...openTasks.filter(t=>t.dueOn && t.dueOn>=today).map(t=>({
      title:t.title,when:formatDue(t.dueOn),kind:"Assignment",date:t.dueOn||"",
    })),
    ...relevantMilestones.filter(m=>m.dueOn && m.dueOn>=today && !COMPLETE_STATUSES.has(String(m.status||"").toLowerCase())).map(m=>({
      title:m.title,when:formatDue(m.dueOn),kind:"Program milestone",date:m.dueOn,
    })),
  ].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4).map(({title,when,kind})=>({title,when,kind}));
  const messages=(input.recentMessages||[]).filter(m=>m.author.trim() && m.preview.trim()).slice(0,3);
  return {
    firstName:workspace.intern.preferredName || workspace.intern.fullName.split(/\s+/)[0] || "Intern",
    hoursThisWeek:hourSummary.loggedThisWeek,
    hoursPlanned:hourSummary.plannedWeeklyHours??0,
    assignmentCount:openTasks.length,
    assignmentsDueSoon:dueSoon,
    checkInsDue:checkInDue?1:0,
    nextCheckIn:activeWeek?(reviewThisWeek?"Submitted":"Awaiting this week's submission"):"Not started",
    milestoneCount:relevantMilestones.length,
    milestonesInProgress:relevantMilestones.filter(m=>["in_progress","active","open"].includes(String(m.status||"").toLowerCase())).length,
    assignments:openTasks.slice(0,4).map(task=>({id:task.id,title:task.title,status:taskStatusLabel(task.status,task.reviewStage),due:formatDue(task.dueOn)})),
    progress:[
      {label:"Hours",pct:hourSummary.progressPercent,tone:"bg-[#22C55E]"},
      {label:"Check-ins",pct:activeWeek?(reviewThisWeek?100:0):null,tone:"bg-[#3B82F6]"},
      {label:"Assignments",pct:pct(assignedTasks.filter(isComplete).length,assignedTasks.length),tone:"bg-[#A855F7]"},
      {label:"Program milestones",pct:pct(completedMilestones,relevantMilestones.length),tone:"bg-[#F97316]"},
    ],
    nextActions:[
      {step:1,title:nextTask?`Work on “${nextTask.title}”`:"Review your assignments",href:"/intern/assignments",cta:nextTask?"Open assignment":"View assignments"},
      {step:2,title:hourSummary.weekNumber>0?"Log this week's hours":"Review internship hour requirements",href:"/intern/time",cta:"Open My Hours"},
      {step:3,title:reviewThisWeek?"Your check-in has been submitted":activeWeek?"Submit this week's check-in":"Review check-in requirements",href:"/intern/check-ins",cta:"View check-ins"},
      {step:4,title:"Review live growth insights",href:"/intern/insights",cta:"Open Growth Insights"},
    ],
    messages,
    upcoming,
  };
}
