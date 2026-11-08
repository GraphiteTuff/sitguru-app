import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBrandCategory } from "./brand-kit";
import {
  brandUploadHttpError,
  brandUploadProgressLabel,
  brandUploadShouldRetry,
  brandUploadTransportError,
  brandUploadUsesSignedUrl,
  parseBrandUploadJson,
} from "./brand-kit-upload";

describe("brand kit upload transport", () => {
  it("sends every Brand Kit file through a signed upload so Vercel never carries the bytes", () => {
    assert.equal(brandUploadUsesSignedUrl(1), true);
    assert.equal(brandUploadUsesSignedUrl(1024), true);
    assert.equal(brandUploadUsesSignedUrl(3 * 1024 * 1024), true);
    assert.equal(brandUploadUsesSignedUrl(12 * 1024 * 1024), true);
    assert.equal(isBrandCategory("photography_stock"), true);
  });

  it("keeps real server errors and only says offline when the browser is offline", () => {
    assert.equal(brandUploadHttpError(401), "Sign in again, then upload the file.");
    assert.equal(brandUploadHttpError(403), "You cannot upload brand files on this login.");
    assert.equal(brandUploadHttpError(413), "That file is too large for SitGuru to accept.");
    assert.equal(brandUploadHttpError(500), "SitGuru could not store that file. Try again in a moment.");
    assert.equal(brandUploadHttpError(400, { error: "Choose a brand category." }), "Choose a brand category.");
    assert.match(brandUploadTransportError({ online: true }), /interrupted/i);
    assert.doesNotMatch(brandUploadTransportError({ online: true }), /appear to be offline/i);
    assert.match(brandUploadTransportError({ online: false }), /appear to be offline/i);
    assert.equal(brandUploadTransportError({ aborted: true }), "Upload cancelled.");
    assert.equal(parseBrandUploadJson("{bad").error, undefined);
    assert.equal(parseBrandUploadJson('{"error":"Choose a brand category."}').error, "Choose a brand category.");
    assert.equal(brandUploadProgressLabel(0.42, true), "Uploading 42%");
    assert.equal(brandUploadProgressLabel(1, true), "Finishing upload…");
    assert.equal(brandUploadShouldRetry("The upload was interrupted before SitGuru finished saving the file."), true);
    assert.equal(brandUploadShouldRetry("Choose a brand category."), false);
  });
});
