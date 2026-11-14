import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  plannerConfigurationReady,
  plannerCreateBody,
  plannerManagerAssignment,
  plannerAssignmentDescription,
  safePlannerAssignee,
  isPlannerObjectId,
} from "./planner-automation";

describe("Planner automatic task creation stays off until explicitly configured", () => {
  const configured = { graphConfigured: true, planId: "2iwB3a7HmK4x9-Si7QCa4w", bucketId: "gQ6ZgNwkD-JQUpEo8j0hRA", enabled: true };

  it("requires valid plan and bucket IDs plus explicit enable flag", () => {
    assert.equal(plannerConfigurationReady(configured), true);
    assert.equal(plannerConfigurationReady({ ...configured, enabled: false }), false);
    assert.equal(plannerConfigurationReady({ ...configured, graphConfigured: false }), false);
    assert.equal(plannerConfigurationReady({ ...configured, planId: "" }), false);
    assert.equal(plannerConfigurationReady({ ...configured, bucketId: "" }), false);
    assert.equal(isPlannerObjectId("../plan"), false);
  });

  it("uses a single approved plan/bucket and a precise due date", () => {
    assert.deepEqual(plannerCreateBody({
      title: "Lola: Pet Trend Research", dueOn: "2026-11-19", planId: configured.planId, bucketId: configured.bucketId,
    }), {
      planId: configured.planId,
      bucketId: configured.bucketId,
      title: "Lola: Pet Trend Research",
      dueDateTime: "2026-11-19T23:59:59Z",
    });
    assert.throws(() => plannerCreateBody({ title: "Unconfigured", dueOn: "", planId: "", bucketId: "" }));
  });

  it("never treats a SitGuru or email ID as an Entra assignee", () => {
    const ava = "22c606ce-9065-44a9-a532-8feac5c2ac22";
    assert.equal(safePlannerAssignee(ava), ava);
    assert.equal(safePlannerAssignee("ava@sitguru.com"), "");
    assert.equal(safePlannerAssignee("../etc/passwd"), "");
    assert.deepEqual(plannerManagerAssignment(ava), {
      assignments: { [ava]: { "@odata.type": "#microsoft.graph.plannerAssignment", orderHint: " !" } },
    });
    assert.equal(plannerManagerAssignment("lola@example.com"), null);
  });

  it("links only to SitGuru's own manager page and supporting SharePoint resources", () => {
    const note = plannerAssignmentDescription({
      assignmentId: "a79e6bb0-4439-421b-b24f-5fb8553f620c",
      internName: "Lola Uhl",
      description: "Find two pet trends.",
      deliverables: ["Two source links", "Two Reel ideas", "One discussion question"],
      sharePointUrl: "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth",
    });
    assert.match(note, /Lola Uhl/);
    assert.match(note, /Find two pet trends/);
    assert.match(note, /Two Reel ideas/);
    assert.match(note, /https:\/\/www\.sitguru\.com\/manager\/assignments\/a79e6bb0/);
    assert.match(note, /sitgurullc\.sharepoint\.com/);
  });
});
