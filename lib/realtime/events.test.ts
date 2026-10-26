import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NOTIFY_WORTHY_EVENTS,
  SITGURU_DOMAIN_EVENTS,
} from "./events";
import { checkRecordVersion, STALE_RECORD_MESSAGE } from "./concurrency";
import { stableEventId, uniqueUserIds } from "./pure";
import {
  pathsForGrowthWorkspace,
  pathsForInternWorkspace,
  WORKSPACE_QUERY_KEYS,
} from "./query-keys";

describe("sitguru domain events", () => {
  it("keeps notify-worthy events as a focused subset", () => {
    assert.equal(
      NOTIFY_WORTHY_EVENTS.has(SITGURU_DOMAIN_EVENTS.INTERN_HOURS_SUBMITTED),
      true,
    );
    assert.equal(
      NOTIFY_WORTHY_EVENTS.has(SITGURU_DOMAIN_EVENTS.GROWTH_INITIATIVE_UPDATED),
      false,
    );
    assert.equal(
      NOTIFY_WORTHY_EVENTS.has(SITGURU_DOMAIN_EVENTS.WORKSPACE_GENERIC),
      false,
    );
  });

  it("uses stable event ids for idempotent retries", () => {
    const a = stableEventId(["intern.hours.submitted", "log-1", "ava"]);
    const b = stableEventId(["intern.hours.submitted", "log-1", "ava"]);
    const c = stableEventId(["intern.hours.submitted", "log-2", "ava"]);
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 40);
  });
});

describe("recipients and paths", () => {
  it("deduplicates recipient user ids", () => {
    assert.deepEqual(uniqueUserIds(["a", "a", "", null, "b", "a"]), ["a", "b"]);
  });

  it("exposes intern + growth refresh paths without inventing duplicate stores", () => {
    assert.ok(pathsForInternWorkspace().includes("/intern"));
    assert.ok(pathsForInternWorkspace().includes("/intern/manage"));
    assert.ok(pathsForGrowthWorkspace().includes("/admin/growth"));
    assert.equal(WORKSPACE_QUERY_KEYS.managerDesk, "manager-desk");
  });
});

describe("concurrency guards", () => {
  it("detects status changes since open", () => {
    const result = checkRecordVersion({
      expectedStatus: "submitted",
      currentStatus: "ava_approved",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, STALE_RECORD_MESSAGE);
      assert.equal(result.reason, "status_changed");
    }
  });

  it("detects newer updated_at", () => {
    const result = checkRecordVersion({
      openedAt: "2026-10-26T12:00:00.000Z",
      currentUpdatedAt: "2026-10-26T12:05:00.000Z",
    });
    assert.equal(result.ok, false);
  });

  it("allows matching versions", () => {
    const result = checkRecordVersion({
      openedAt: "2026-10-26T12:00:00.000Z",
      currentUpdatedAt: "2026-10-26T12:00:00.000Z",
      expectedStatus: "submitted",
      currentStatus: "submitted",
    });
    assert.equal(result.ok, true);
  });
});
