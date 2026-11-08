import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessBrandUploadClaim,
  brandKitCapabilities,
  inspectBrandBytes,
  safeBrandFileName,
} from "./brand-kit";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const svg = new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>`);
const svgScript = new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`);

describe("brand kit permissions", () => {
  it("lets growth managers upload and archive, and only super users approve or delete", () => {
    const manager = brandKitCapabilities({
      canAccessAdmin: true,
      isSuperUser: false,
      growthOnly: true,
      intern: false,
    });
    assert.equal(manager.upload, true);
    assert.equal(manager.archive, true);
    assert.equal(manager.approve, false);
    assert.equal(manager.delete, false);
    const admin = brandKitCapabilities({
      canAccessAdmin: true,
      isSuperUser: true,
      growthOnly: false,
      intern: false,
    });
    assert.equal(admin.approve, true);
    assert.equal(admin.delete, true);
    const intern = brandKitCapabilities({
      canAccessAdmin: false,
      isSuperUser: false,
      growthOnly: false,
      intern: true,
    });
    assert.equal(intern.upload, false);
    assert.equal(intern.delete, false);
    assert.equal(intern.viewApproved, true);
  });
});

describe("brand kit files", () => {
  it("accepts a real PNG and SVG and rejects a renamed or active file", () => {
    const pngOk = inspectBrandBytes({
      bytes: png,
      fileName: "sitguru-logo.png",
      declaredMime: "image/png",
      byteLength: png.length,
    });
    assert.equal(pngOk.ok, true);
    const svgOk = inspectBrandBytes({
      bytes: svg,
      fileName: "mark.svg",
      declaredMime: "image/svg+xml",
      byteLength: svg.length,
    });
    assert.equal(svgOk.ok, true);
    const html = inspectBrandBytes({
      bytes: new TextEncoder().encode("<html><body>nope</body></html>"),
      fileName: "logo.png",
      declaredMime: "image/png",
      byteLength: 32,
    });
    assert.equal(html.ok, false);
    const active = inspectBrandBytes({
      bytes: svgScript,
      fileName: "mark.svg",
      declaredMime: "image/svg+xml",
      byteLength: svgScript.length,
    });
    assert.equal(active.ok, false);
  });

  it("rejects unsafe names and oversized claims", () => {
    assert.equal(safeBrandFileName("../logo.png"), "logo.png");
    assert.equal(safeBrandFileName(".."), "");
    assert.equal(safeBrandFileName("logo..png"), "");
    const huge = assessBrandUploadClaim({
      fileName: "clip.mp4",
      declaredMime: "video/mp4",
      declaredSize: 80 * 1024 * 1024,
    });
    assert.equal(huge.ok, false);
    const zip = assessBrandUploadClaim({
      fileName: "kit.zip",
      declaredMime: "application/zip",
      declaredSize: 1024,
    });
    assert.equal(zip.ok, true);
  });
});
