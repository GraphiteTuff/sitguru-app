import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chatDisplayName } from "./chat-display-name";

describe("chatDisplayName", () => {
  it("prefers first and last when available", () => {
    assert.equal(
      chatDisplayName({ firstName: "Ryan", lastName: "Manibo" }),
      "Ryan Manibo",
    );
    assert.equal(
      chatDisplayName({ fullName: "Lola Uhl", preferredName: "Lola" }),
      "Lola Uhl",
    );
  });

  it("joins profile first/last when full_name is incomplete", () => {
    assert.equal(
      chatDisplayName({
        firstName: "jason",
        lastName: "Graff",
        fullName: "jason",
      }),
      "jason Graff",
    );
  });
});
