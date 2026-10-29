import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canReadPrivateInternRecord } from "./manager-access";
import {
  assignmentIsVisibleToIntern,
  validateManagerAssignment,
  type AssignmentDraft,
} from "./manager-assignment";

const base: AssignmentDraft = {
  internId: "intern-a",
  title: "Campus story posts",
  category: "Content",
  milestoneId: "",
  dueOn: "2026-11-02",
  priority: "Normal",
  description: "Draft three posts for the campus pet-parent push.",
  deliverables: ["Three captions"],
  review: "Manager Review Required",
  freedom: "Guided",
  resources: ["https://www.sitguru.com/brand-guide"],
  notes: "",
  clientRequestId: "req-1",
};

describe("manager assignment form", () => {
  it("lets a manager assign only an authorized intern", () => {
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: "manager-a",
        targetInternId: "intern-a",
        managerUserId: "manager-a",
      }),
      true,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: "manager-a",
        targetInternId: "intern-b",
        managerUserId: "manager-b",
      }),
      false,
    );
  });

  it("allows an incomplete draft and requires the publish fields", () => {
    const draft = validateManagerAssignment(
      { ...base, dueOn: "", description: "", deliverables: [], resources: [] },
      "draft",
    );
    assert.equal(draft.ok, true);

    const missing = validateManagerAssignment(
      { ...base, dueOn: "", deliverables: [] },
      "create",
    );
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(Boolean(missing.errors.dueOn), true);
      assert.equal(Boolean(missing.errors.deliverables), true);
    }
  });

  it("rejects a resource that is not a web link", () => {
    const result = validateManagerAssignment(
      { ...base, resources: ["not a link"] },
      "create",
    );
    assert.equal(result.ok, false);
  });

  it("hides drafts from the intern and shows published work", () => {
    assert.equal(assignmentIsVisibleToIntern("draft"), false);
    assert.equal(assignmentIsVisibleToIntern("todo"), true);
  });
});
