import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  plannerWriteAfterConflict,
  routeAssignmentCategory,
  sharePointFolderName,
  sitguruStatusFromPlannerPercent,
  teamsAssignmentMessage,
} from "./work-routing";

describe("Growth Microsoft work routing", () => {
  it("sends social and content work to Content and Social", () => {
    assert.equal(routeAssignmentCategory("Social Media").channelLabel, "Content and Social");
    assert.equal(routeAssignmentCategory("Content").channelLabel, "Content and Social");
    assert.equal(routeAssignmentCategory("Creative").canva, true);
  });

  it("sends growth work to Growth and Strategy", () => {
    assert.equal(routeAssignmentCategory("Pet Parent Growth").channelLabel, "Growth and Strategy");
    assert.equal(routeAssignmentCategory("Campaign").channelLabel, "Growth and Strategy");
    assert.equal(routeAssignmentCategory("Growth Experiment").channelLabel, "Growth and Strategy");
  });

  it("sends partnerships and events to Partnerships and Community", () => {
    assert.equal(routeAssignmentCategory("Partnership").channelLabel, "Partnerships and Community");
    assert.equal(routeAssignmentCategory("Community Outreach").channelLabel, "Partnerships and Community");
    assert.equal(routeAssignmentCategory("Event").channelLabel, "Partnerships and Community");
  });

  it("sends analytics and the final project to their channels", () => {
    assert.equal(routeAssignmentCategory("Analytics").channelLabel, "Analytics and Results");
    assert.equal(routeAssignmentCategory("Research / Results").channelLabel, "Analytics and Results");
    assert.equal(routeAssignmentCategory("Final Project").channelLabel, "Intern Projects");
  });

  it("maps Planner percent to operational status, never manager approval", () => {
    assert.equal(sitguruStatusFromPlannerPercent(0), "not_started");
    assert.equal(sitguruStatusFromPlannerPercent(50), "in_progress");
    assert.equal(sitguruStatusFromPlannerPercent(100), "awaiting_review");
  });

  it("refetches a Planner conflict once, then records a sync conflict", () => {
    assert.equal(plannerWriteAfterConflict(0), "refetch");
    assert.equal(plannerWriteAfterConflict(1), "sync_conflict");
  });

  it("keeps the Teams note free of academic and personnel records", () => {
    const message = teamsAssignmentMessage({
      title: "Campus story posts",
      internName: "Intern",
      dueOn: "2026-11-15",
      managerName: "Manager",
      freedom: "Guided",
      plannerUrl: "https://planner.example/task",
      folderUrl: "https://sharepoint.example/folder",
      sitguruUrl: "https://www.sitguru.com/intern/assignments",
    });
    assert.match(message, /Content|Campus story posts|Guided|Planner|Project files|SitGuru/);
    assert.equal(/student id|payroll|tax|approved hours|university transcript/i.test(message), false);
  });

  it("builds a SharePoint-safe folder name", () => {
    assert.equal(sharePointFolderName('Instagram: "Pets"/Growth'), "Instagram Pets Growth");
  });
});
