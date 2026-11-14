import assert from "node:assert/strict";
import test from "node:test";
import { isJasonManagerAssignmentTestIntern } from "./manager-assignment-test-intern";

test("identifies the retired Jason test intern record", () => {
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Jason Graff" }), true);
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Jason L. Graff" }), true);
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Jason" }), true);
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Jason Graff", email: "jason@sitguru.com" }), true);
});

test("keeps Lola, Ryan, Lalita and other real interns eligible", () => {
  for (const full_name of ["Lola Uhl", "Ryan Manibo", "Lalita Dhital", "Ashley Test", "Jennifer Kelly"]) {
    assert.equal(isJasonManagerAssignmentTestIntern({ full_name, email: "intern@example.com" }), false, full_name);
  }
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Sarah", preferred_name: "Jason", email: "other@example.com" }), false);
});

test("protects non-Jason records even when a matching email is reused", () => {
  assert.equal(isJasonManagerAssignmentTestIntern({ full_name: "Lola Uhl", email: "jason@sitguru.com" }), false);
});
