import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeAssignmentCategory } from "@/lib/admin/growth/work-routing";
import {
  appOnlyGraphMayCall,
  delegatedTeamsCredentialAvailable,
  planTeamsChannel,
  resolveTeamsNotificationMode,
} from "./teams-notify";

describe("Teams notification mode", () => {
  it("keeps Social Media on the Content and Social channel", () => {
    assert.equal(routeAssignmentCategory("Social Media").channelLabel, "Content and Social");
  });

  it("does not let application Graph post channel messages or use migration permission", () => {
    assert.equal(appOnlyGraphMayCall("/teams/team/channels/channel/messages"), false);
    assert.equal(appOnlyGraphMayCall("/teamwork/migrate"), false);
    assert.equal(appOnlyGraphMayCall("/planner/tasks"), true);
    assert.equal(appOnlyGraphMayCall("/sites/site/drives/drive/items/root/children"), true);
  });

  it("defaults to channel links and does not mark a notification as posted", () => {
    assert.equal(resolveTeamsNotificationMode({}), "link_only");
    const plan = planTeamsChannel({
      channelId: "channel-1",
      channelUrl: "https://teams.example/channel",
      mode: "link_only",
    });
    assert.equal(plan.recordStatus, "connected");
    assert.equal(plan.notificationStatus, "not_requested");
    assert.equal(plan.postWithApplicationGraph, false);
  });

  it("treats a missing poster as a successful link, not an assignment failure", () => {
    const plan = planTeamsChannel({
      channelId: "",
      channelUrl: "https://teams.example/content",
      mode: "link_only",
    });
    assert.equal(plan.channelStatus, "connected");
    assert.notEqual(plan.recordStatus, "error");
  });

  it("requires a real delegated credential before delegated posting", () => {
    assert.equal(delegatedTeamsCredentialAvailable(), false);
    assert.equal(
      resolveTeamsNotificationMode({
        requested: "delegated_posting",
        hasDelegatedCredential: false,
      }),
      "link_only",
    );
    assert.equal(
      resolveTeamsNotificationMode({
        requested: "delegated_posting",
        hasDelegatedCredential: true,
      }),
      "delegated",
    );
  });

  it("uses a workflow webhook only when one is configured", () => {
    assert.equal(
      resolveTeamsNotificationMode({
        requested: "workflow_webhook",
        hasWorkflowWebhook: false,
      }),
      "link_only",
    );
    assert.equal(
      resolveTeamsNotificationMode({
        requested: "workflow_webhook",
        hasWorkflowWebhook: true,
      }),
      "workflow_webhook",
    );
  });
});
