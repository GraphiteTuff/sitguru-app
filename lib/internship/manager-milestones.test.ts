import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationInternWorkspace } from "./documentation-fixture";
import { buildManagerMilestones, milestoneDisplayStatus } from "./manager-milestones";
import type { InternshipMilestone } from "./types";

const base = documentationInternWorkspace().intern;
const lola = { ...base, id: "lola", fullName: "Lola Uhl", universityId: "sju", cohortId: "spring-2027" };
const ryan = { ...base, id: "ryan", fullName: "Ryan Manibo", universityId: "psu", cohortId: "spring-2027" };
function make(id: string, owner: string, universityId: string | null, date: string, status: string): InternshipMilestone {
  return {
    id, cohortId: "spring-2027", universityId,
    universityName: universityId === "sju" ? "Saint Joseph's University" : universityId === "psu" ? "Penn State" : "",
    key: id, title: id, dueOn: date, phase: "Delivery", owner,
    action: "Complete the assigned milestone with verified evidence.", status,
  };
}
test("manager milestones do not fabricate results when the calendar is empty", () => {
  const summary=buildManagerMilestones({
    milestones:[], interns:[lola,ryan], assignedInternIds:["lola","ryan"], cohortId:"spring-2027", today:"2026-11-13",
  });
  assert.equal(summary.total,0);
  assert.equal(summary.completed,0);
  assert.equal(summary.overdue,0);
  assert.equal(summary.percentComplete,null);
  assert.equal(summary.rows.length,0);
});

test("completed SitGuru milestones apply once to all assigned interns", () => {
  const summary=buildManagerMilestones({
    milestones:[
      make("program-confirmed","sitguru",null,"2026-09-18","done"),
      make("phase-one","intern",null,"2027-01-22","scheduled"),
    ],
    interns:[lola,ryan], assignedInternIds:["lola","ryan"], cohortId:"spring-2027",today:"2026-11-13",
  });
  assert.equal(summary.total,2);
  assert.equal(summary.completed,1);
  assert.equal(summary.percentComplete,50);
  assert.deepEqual(summary.rows[0].assignedInterns.map(x=>x.id),["lola","ryan"]);
  assert.equal(summary.rows[1].displayStatus,"scheduled");
});

test("university dates are never copied to a different school's intern", () => {
  const summary=buildManagerMilestones({
    milestones:[
      make("sju-paperwork","university","sju","2026-11-20","scheduled"),
      make("psu-paperwork","university","psu","2026-11-20","scheduled"),
    ],
    interns:[lola,ryan], assignedInternIds:["lola"],cohortId:"spring-2027", today:"2026-11-13",
  });
  assert.deepEqual(summary.rows.map(x=>x.id),["sju-paperwork"]);
  assert.deepEqual(summary.rows[0].assignedInterns.map(x=>x.id),["lola"]);
});

test("overdue status is derived from real dates only and respects completion", () => {
  assert.equal(milestoneDisplayStatus(make("late","intern",null,"2026-11-10","scheduled"),"2026-11-13"),"overdue");
  assert.equal(milestoneDisplayStatus(make("late-started","intern",null,"2026-11-10","in_progress"),"2026-11-13"),"overdue");
  assert.equal(milestoneDisplayStatus(make("old-done","intern",null,"2026-11-10","done"),"2026-11-13"),"completed");
  assert.equal(milestoneDisplayStatus(make("not-due","intern",null,"2027-01-22","scheduled"),"2026-11-13"),"scheduled");
});
