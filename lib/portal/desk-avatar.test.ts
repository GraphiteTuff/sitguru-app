import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deskAvatarExtension, deskAvatarFileError } from "./desk-avatar";

describe("desk profile photo", () => {
  it("accepts a jpeg, png, or webp under 8MB", () => {
    assert.equal(deskAvatarFileError({ name: "me.jpg", type: "image/jpeg", size: 1200 }), "");
    assert.equal(deskAvatarFileError({ name: "me.png", type: "image/png", size: 1200 }), "");
    assert.equal(deskAvatarFileError({ name: "me.webp", type: "", size: 1200 }), "");
  });

  it("rejects documents, empty files, and oversized photos", () => {
    assert.match(deskAvatarFileError({ name: "notes.pdf", type: "application/pdf", size: 1200 }), /JPG, PNG, or WEBP/);
    assert.match(deskAvatarFileError({ name: "me.jpg", type: "image/jpeg", size: 0 }), /Choose a profile photo/);
    assert.match(deskAvatarFileError({ name: "me.jpg", type: "image/jpeg", size: 9 * 1024 * 1024 }), /8MB/);
  });

  it("stores png and webp with their own extension", () => {
    assert.equal(deskAvatarExtension({ name: "me.png", type: "image/png" }), "png");
    assert.equal(deskAvatarExtension({ name: "me.webp", type: "" }), "webp");
    assert.equal(deskAvatarExtension({ name: "me.jpeg", type: "image/jpeg" }), "jpg");
  });
});
