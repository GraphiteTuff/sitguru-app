import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  internDocumentationModeEnabled,
  internDocumentationScene,
} from "./documentation-mode";
import { documentationInternWorkspace } from "./documentation-fixture";

const env = process.env as {
  NODE_ENV?: string;
  INTERN_DOCUMENTATION_MODE?: string;
  VERCEL_ENV?: string;
};

describe("intern documentation mode", () => {
  it("never enables when NODE_ENV is production", () => {
    const previousNode = env.NODE_ENV;
    const previousFlag = env.INTERN_DOCUMENTATION_MODE;
    const previousVercel = env.VERCEL_ENV;
    env.INTERN_DOCUMENTATION_MODE = "true";
    env.NODE_ENV = "production";
    delete env.VERCEL_ENV;
    assert.equal(internDocumentationModeEnabled(), false);
    env.NODE_ENV = previousNode;
    env.INTERN_DOCUMENTATION_MODE = previousFlag;
    env.VERCEL_ENV = previousVercel;
  });

  it("never enables on Vercel production or preview", () => {
    const previousNode = env.NODE_ENV;
    const previousFlag = env.INTERN_DOCUMENTATION_MODE;
    const previousVercel = env.VERCEL_ENV;
    env.INTERN_DOCUMENTATION_MODE = "true";
    env.NODE_ENV = "development";
    env.VERCEL_ENV = "production";
    assert.equal(internDocumentationModeEnabled(), false);
    env.VERCEL_ENV = "preview";
    assert.equal(internDocumentationModeEnabled(), false);
    env.NODE_ENV = previousNode;
    env.INTERN_DOCUMENTATION_MODE = previousFlag;
    env.VERCEL_ENV = previousVercel;
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
