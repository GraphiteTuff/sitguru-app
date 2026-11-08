import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { internAttachmentReturnPath } from "./attachment-return";
import { internLegacySectionRedirect, withInternFlash } from "./intern-routes";

describe("brand kit upload return path", () => {
  it("stays on the brand tool instead of the toolkit home", () => {
    const path = internAttachmentReturnPath("intern", "intern-1", "brand");
    assert.equal(path, "/intern/toolkit?tool=brand");
    assert.equal(path.includes("/intern?tool=brand"), false);
  });

  it("keeps a legacy brand bookmark on the brand tool and preserves the confirmation", () => {
    const legacy = internLegacySectionRedirect({ tool: "brand" });
    assert.equal(legacy, "/intern/toolkit?tool=brand");
    const landed = withInternFlash(legacy || "", {
      ok: "File saved in Brand kit. SitGuru can review it from your internship file.",
    });
    assert.equal(landed.startsWith("/intern/toolkit?"), true);
    assert.equal(landed.includes("tool=brand"), true);
    assert.equal(landed.includes("ok="), true);
    assert.equal(landed === "/intern/toolkit", false);
  });

  it("still sends supervisor files back to the intern record", () => {
    assert.equal(
      internAttachmentReturnPath("supervisor", "intern-1", "brand"),
      "/admin/internship/interns/intern-1",
    );
  });
});
