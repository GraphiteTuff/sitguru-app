import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildManagerCheckinSummary,
  isApprovedWeeklyReview,
  isSubmittedWeeklyReview,
  needsWeeklyReview,
  weekMonday,
  type WeeklyCheckinRow,
} from "./checkins-summary";

function review(id:string,internId:string,weekOf:string,reviewStatus:string):WeeklyCheckinRow {
  return {
    id,internId,internName:internId==="lola"?"Lola Uhl":"Ryan Manibo",
    avatarUrl:"",weekOf,submittedAt:weekOf+"T18:00:00Z",reviewStatus,
    accomplishment:"Real work",contribution:"Evidence",nextWeek:"",
    hoursLogged:3,feedback:"",
  };
}

test("empty check-in list shows zero instead of fictional interns or rates",()=>{
  const summary=buildManagerCheckinSummary({rows:[],activeInternIds:[],now:new Date("2026-11-13T12:00:00Z")});
  assert.equal(summary.submittedThisWeek,0);
  assert.equal(summary.needsReview,0);
  assert.equal(summary.approved,0);
  assert.equal(summary.submissionRate,null);
  assert.equal(summary.recentWeeks.length,6);
  assert.ok(summary.recentWeeks.every(w=>w.submitted===0&&w.approved===0));
});

test("manager sees only real submitted and approved check-ins",()=>{
  const rows=[
    review("1","lola","2026-11-09","submitted_to_ava"),
    review("2","ryan","2026-11-09","ava_approved"),
    review("3","lola","2026-11-02","draft"),
  ];
  const summary=buildManagerCheckinSummary({rows,activeInternIds:["lola","ryan"],now:new Date("2026-11-13T12:00:00Z")});
  assert.equal(summary.submittedThisWeek,2);
  assert.equal(summary.expectedThisWeek,2);
  assert.equal(summary.submissionRate,100);
  assert.equal(summary.needsReview,1);
  assert.equal(summary.approved,1);
  assert.equal(summary.rows.length,3);
  assert.equal(summary.recentWeeks.at(-1)?.submitted,2);
  assert.equal(summary.recentWeeks.at(-1)?.approved,1);
});

test("count only distinct assigned interns during week and protect statuses",()=>{
  const rows=[
    review("1","lola","2026-11-09","submitted_to_ava"),
    review("2","lola","2026-11-10","ava_approved"),
    review("3","stranger","2026-11-09","submitted_to_ava"),
  ];
  const summary=buildManagerCheckinSummary({rows,activeInternIds:["lola","ryan"],now:new Date("2026-11-13T12:00:00Z")});
  assert.equal(summary.submittedThisWeek,1);
  assert.equal(summary.submissionRate,50);
  assert.equal(weekMonday("2026-11-13"),"2026-11-09");
  assert.ok(isSubmittedWeeklyReview("submitted_to_ava"));
  assert.ok(isApprovedWeeklyReview("ava_approved"));
  assert.ok(needsWeeklyReview("submitted_to_jason"));
  assert.ok(!isApprovedWeeklyReview("draft"));
});
