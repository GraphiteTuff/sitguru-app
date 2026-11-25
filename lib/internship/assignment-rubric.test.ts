import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ASSIGNMENT_RUBRIC, parseAssignmentRubric } from "./assignment-rubric";

test("validates integers within the employer rubric and separates private feedback", () => {
  const form = new FormData();
  for (const item of ASSIGNMENT_RUBRIC) {
    form.set(`score-${item.index}`, "20");
    form.set(`maximum-${item.index}`, String(item.defaultMaximum));
  }
  form.set("feedback", "Shared feedback");
  form.set("privateNotes", "Instructor notes");
  assert.deepEqual(parseAssignmentRubric(form), {
    scores: [20, 20, 20, 20], maximums: [25, 25, 25, 25],
    feedback: "Shared feedback", privateNotes: "Instructor notes",
  });
  form.set("score-0", "26");
  assert.equal(parseAssignmentRubric(form), null);
  form.set("maximum-0", "30");
  assert.equal(parseAssignmentRubric(form)?.maximums[0], 30);
  form.set("score-0", "26.1");
  assert.equal(parseAssignmentRubric(form), null);
});
