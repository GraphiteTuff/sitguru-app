import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  approveDraft,
  canAccessConversation,
  canModerate,
  canSend,
  draftRequired,
  editPreservesHistory,
  marketplacePairStillAllowed,
  reportRoute,
  scanSensitive,
  softDeletePreservesAudit,
  visibleMessage,
} from "./staff-policy";

describe("SitGuru staff messaging", () => {
  it("keeps an intern out of another intern's messages and out of leadership", () => {
    assert.equal(
      canAccessConversation({
        actor: "intern",
        actorId: "intern-a",
        type: "internal_direct",
        participantIds: ["intern-b", "growth"],
      }),
      false,
    );
    assert.equal(
      canAccessConversation({
        actor: "intern",
        actorId: "intern-a",
        type: "leadership",
        participantIds: ["founder", "growth"],
      }),
      false,
    );
  });

  it("hides internal notes and internal threads from community users", () => {
    assert.equal(visibleMessage({ visibility: "internal_note", actor: "community" }), false);
    assert.equal(visibleMessage({ visibility: "internal_note", actor: "growth" }), true);
    assert.equal(
      canAccessConversation({
        actor: "community",
        actorId: "parent-1",
        type: "internal_direct",
        participantIds: ["founder", "growth"],
      }),
      false,
    );
  });

  it("limits intern replies and requires draft review until independence is granted", () => {
    assert.equal(
      canSend({ actor: "intern", level: "reply_assigned", initiating: true, assigned: false }).ok,
      false,
    );
    assert.equal(draftRequired({ actor: "intern", review: "all" }), true);
    const bypass = approveDraft({
      actor: "intern",
      rewritten: false,
      originalAuthorId: "intern-a",
      editorId: "intern-a",
    });
    assert.equal(bypass.ok, false);
    const sent = approveDraft({
      actor: "growth",
      rewritten: true,
      originalAuthorId: "intern-a",
      editorId: "growth",
    });
    assert.equal(sent.ok && sent.finalAuthorId, "growth");
    assert.equal(sent.ok && sent.preservesOriginal, true);
  });

  it("lets the founder review reports and blocks other managers from moderation tools", () => {
    assert.equal(canModerate("founder"), true);
    assert.equal(canModerate("growth"), false);
    assert.equal(canModerate("other_admin"), false);
    assert.equal(reportRoute({ reporter: "intern", targetIsManager: true }), "founder");
  });

  it("preserves edit and delete history and leaves marketplace pairs intact", () => {
    assert.equal(editPreservesHistory(), true);
    const removed = softDeletePreservesAudit({ legalHold: false });
    assert.equal(removed.ok && removed.display, "Message removed");
    assert.equal(removed.ok && removed.auditKept, true);
    assert.equal(softDeletePreservesAudit({ legalHold: true }).ok, false);
    assert.equal(marketplacePairStillAllowed("parent", "guru"), true);
    assert.equal(marketplacePairStillAllowed("guru", "parent"), true);
    assert.match(scanSensitive("password: hunter2").message, /credentials/);
  });
});
