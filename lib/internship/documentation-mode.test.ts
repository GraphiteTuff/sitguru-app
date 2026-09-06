import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  internDocumentationModeEnabled,
  internDocumentationScene,
} from "./documentation-mode";
import { documentationInternWorkspace } from "./documentation-fixture";

describe("intern documentation mode", () => {
  it("never enables when NODE_ENV is production", () => {
    const previousNode = process.env.NODE_ENV;
    const previousFlag = process.env.INTERN_DOCUMENTATION_MODE;
    const previousVercel = process.env.VERCEL_ENV;
    process.env.INTERN_DOCUMENTATION_MODE = "true";
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL_ENV;
    assert.equal(internDocumentationModeEnabled(), false);
    process.env.NODE_ENV = previousNode;
    process.env.INTERN_DOCUMENTATION_MODE = previousFlag;
    process.env.VERCEL_ENV = previousVercel;
  });

  it("never enables on Vercel production or preview", () => {
    const previousNode = process.env.NODE_ENV;
    const previousFlag = process.env.INTERN_DOCUMENTATION_MODE;
    const previousVercel = process.env.VERCEL_ENV;
    process.env.INTERN_DOCUMENTATION_MODE = "true";
    process.env.NODE_ENV = "development";
    process.env.VERCEL_ENV = "production";
    assert.equal(internDocumentationModeEnabled(), false);
    process.env.VERCEL_ENV = "preview";
    assert.equal(internDocumentationModeEnabled(), false);
    process.env.NODE_ENV = previousNode;
    process.env.INTERN_DOCUMENTATION_MODE = previousFlag;
    process.env.VERCEL_ENV = previousVercel;
  });

  it("builds a fictional intern workspace without production IDs", () => {
    const workspace = documentationInternWorkspace("approved");
    assert.equal(workspace.intern.fullName, "Taylor Morgan");
    assert.match(workspace.intern.email, /example\.edu$/);
    assert.equal(workspace.intern.requiredHours, 120);
    assert.equal(workspace.tasks.length, 21);
    assert.ok(workspace.tasks.some((row) => row.status === "revision_requested"));
    assert.ok(workspace.metrics.some((row) => row.isVerified && row.label.includes("verified")));
    assert.equal(internDocumentationScene("checkin-form"), "checkin-form");
  });
});
