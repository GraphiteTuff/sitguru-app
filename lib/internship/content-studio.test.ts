import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canRecordPublication,
  canReviewAssignedContent,
  contentCreativeKey,
  contentEditResetsApproval,
  studioDecision,
  studioSummary,
} from "./content-studio";

describe("content studio workflow", () => {
  it("routes a draft to the assigned manager and blocks intern self-approval", () => {
    const submitted = studioDecision({
      action: "submit",
      stage: "draft",
      actor: "intern",
      comment: "",
    });
    assert.equal(submitted.ok && submitted.stage, "submitted_to_ava");
    const own = studioDecision({
      action: "approve",
      stage: "submitted_to_ava",
      actor: "intern",
      comment: "",
    });
    assert.equal(own.ok, false);
    assert.equal(
      canReviewAssignedContent({
        actorUserId: "ava",
        isSuperUser: false,
        managerUserId: "ava",
      }),
      true,
    );
    assert.equal(
      canReviewAssignedContent({
        actorUserId: "other",
        isSuperUser: false,
        managerUserId: "ava",
      }),
      false,
    );
  });

  it("requires feedback for changes and a live link before publish", () => {
    const changes = studioDecision({
      action: "request_changes",
      stage: "submitted_to_ava",
      actor: "manager",
      comment: "",
    });
    assert.equal(changes.ok, false);
    const approved = studioDecision({
      action: "approve",
      stage: "submitted_to_ava",
      actor: "manager",
      comment: "Looks good.",
    });
    assert.equal(approved.ok && approved.stage, "ava_approved");
    assert.equal(canRecordPublication({ reviewStage: "draft", publishedUrl: "https://instagram.com/p/1" }), "Approve the content before recording a published link.");
    assert.equal(canRecordPublication({ reviewStage: "ava_approved", publishedUrl: "https://www.instagram.com/p/abc" }), "");
  });

  it("drops approval when the caption or brand assets change", () => {
    const first = contentCreativeKey({
      caption: "Hello pets",
      draftUrl: "https://canva.com/design/1",
      platform: "Instagram",
      assetIds: ["logo"],
    });
    assert.equal(
      contentEditResetsApproval({
        reviewStage: "ava_approved",
        approvedSnapshot: first,
        nextKey: contentCreativeKey({
          caption: "Hello pets today",
          draftUrl: "https://canva.com/design/1",
          platform: "Instagram",
          assetIds: ["logo"],
        }),
      }),
      true,
    );
    const counts = studioSummary([
      { reviewStage: "draft", status: "in_progress", plannedAt: "", publishedUrl: "" },
      { reviewStage: "submitted_to_ava", status: "submitted", plannedAt: "", publishedUrl: "" },
      { reviewStage: "ava_approved", status: "approved", plannedAt: "2026-11-08T15:00:00Z", publishedUrl: "" },
    ]);
    assert.equal(counts.pending, 1);
    assert.equal(counts.scheduled, 1);
    assert.equal(counts.published, 0);
  });
});
