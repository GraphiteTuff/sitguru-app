import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationInternWorkspace } from "@/lib/internship/documentation-fixture";
import { buildInternGrowthSummary } from "./growth-home-data";

test("growth workspace never invents hours, messages or completion percentages", () => {
  const workspace=documentationInternWorkspace();
  workspace.tasks=[];
  workspace.milestones=[];
  workspace.weeklyReviews=[];
  workspace.timeLogs=[];
  workspace.intern.requiredHours=null;
  workspace.intern.requirementStatus="pending";
  workspace.intern.plannedWeeklyHours=null;
  workspace.intern.status="accepted";
  const result=buildInternGrowthSummary({workspace,now:new Date("2026-11-13T12:00:00-05:00")});
  assert.equal(result.assignmentCount,0);
  assert.equal(result.milestoneCount,0);
  assert.equal(result.hoursThisWeek,0);
  assert.equal(result.hoursPlanned,0);
  assert.deepEqual(result.progress.map(p=>p.pct),[null,null,null,null]);
  assert.deepEqual(result.messages,[]);
  assert.deepEqual(result.upcoming,[]);
  assert.equal(result.checkInsDue,0);
});

test("completed tasks and cohort milestones are counted from their real statuses", () => {
  const workspace=documentationInternWorkspace();
  workspace.timeLogs=[];
  workspace.tasks=[
    { ...workspace.tasks[0], id:"task-a", title:"Delivered campaign", status:"approved", supervisorApproved:true },
    { ...workspace.tasks[0], id:"task-b", title:"Draft campaign", status:"in_progress", supervisorApproved:false },
  ];
  workspace.milestones=[
    {id:"m1",cohortId:"spring",universityId:null,universityName:"",key:"k1",title:"Program approved",dueOn:"2026-11-01",phase:"recruiting",owner:"sitguru",action:"",status:"done"},
    {id:"m2",cohortId:"spring",universityId:null,universityName:"",key:"k2",title:"Upcoming",dueOn:"2027-02-01",phase:"delivery",owner:"sitguru",action:"",status:"scheduled"},
  ];
  const result=buildInternGrowthSummary({workspace,now:new Date("2026-11-13T12:00:00-05:00"),recentMessages:[{author:"Ava",preview:"Reviewed your campaign"}]});
  assert.equal(result.assignmentCount,1);
  assert.equal(result.progress.find(p=>p.label==="Assignments")?.pct,50);
  assert.equal(result.progress.find(p=>p.label==="Program milestones")?.pct,50);
  assert.equal(result.messages[0].author,"Ava");
  assert.ok(result.upcoming.some(item=>item.title==="Upcoming"));
});
