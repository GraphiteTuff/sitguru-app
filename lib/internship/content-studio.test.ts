import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canRecordPublication,
  canReviewAssignedContent,
  contentCreativeKey,
  contentEditResetsApproval,
  contentReviewNotice,
  deliverableMailbox,
  studioDecision,
  studioSummary,
} from "./content-studio";
import { assessContentCreative, contentCreativeOwned, creativeBytesMatch } from "./content-creative";

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
    assert.equal(
      contentEditResetsApproval({
        reviewStage: "ava_approved",
        approvedSnapshot: first,
        nextKey: contentCreativeKey({
          caption: "Hello pets",
          draftUrl: "https://canva.com/design/1",
          platform: "Instagram",
          assetIds: ["logo"],
          creativePath: "interns/lola/content/reel.mp4",
        }),
      }),
      true,
    );
  });

  it("keeps phone-login addresses out of review mail and describes the notice", () => {
    assert.equal(deliverableMailbox("phone.16098195819@users.sitguru.internal", "lola.uhl5@gmail.com"), "lola.uhl5@gmail.com");
    assert.equal(deliverableMailbox(""), "");
    const notice = contentReviewNotice({
      kind: "submitted",
      title: "Pet Safety",
      href: "https://www.sitguru.com/manager/campaigns-content?content=1",
    });
    assert.match(notice.subject, /Pet Safety/);
    assert.match(notice.text, /manager\/campaigns-content/);
  });
});

describe("content creative files", () => {
  it("accepts a png, rejects a public-looking path, and checks file bytes", () => {
    const png = assessContentCreative({ name: "logo.PNG", size: 1200, type: "image/png" });
    assert.equal(png.ok && png.direct, true);
    const huge = assessContentCreative({ name: "reel.mp4", size: 30 * 1024 * 1024, type: "video/mp4" });
    assert.equal(huge.ok, false);
    assert.equal(contentCreativeOwned("intern-1", "interns/intern-1/content/file.png"), true);
    assert.equal(contentCreativeOwned("intern-1", "interns/intern-2/content/file.png"), false);
    assert.equal(contentCreativeOwned("intern-1", "interns/intern-1/../secret.png"), false);
    assert.equal(creativeBytesMatch("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])), true);
    assert.equal(creativeBytesMatch("image/png", Uint8Array.from([0x3c, 0x73, 0x63, 0x72, 0, 0, 0, 0, 0, 0, 0, 0])), false);
  });
});
