import assert from "node:assert/strict";
import test from "node:test";
import {
  allHqNavHrefs,
  HQ_NAV_SECTIONS,
  isActiveAdminPath,
} from "@/lib/admin/hq-nav";

test("HQ nav includes Overview, Action Center, and contractor finance routes", () => {
  const hrefs = allHqNavHrefs();
  assert.ok(hrefs.includes("/admin"));
  assert.ok(hrefs.includes("/admin/action-center"));
  assert.ok(hrefs.includes("/admin/financials/contractor-hours"));
  assert.ok(hrefs.includes("/admin/financials/contractor-payments"));
  assert.ok(hrefs.includes("/admin/managers"));
  assert.ok(hrefs.includes("/manager"));
});

test("HQ nav sections use the Super Admin taxonomy titles", () => {
  const titles = HQ_NAV_SECTIONS.map((section) => section.title);
  assert.deepEqual(titles, [
    "Overview & Work",
    "People & Access",
    "Marketplace & Care",
    "Community & Growth",
    "Finance",
    "Trust & Security",
    "Platform & Settings",
  ]);
});

test("isActiveAdminPath treats /admin as exact and nested routes as prefixes", () => {
  assert.equal(isActiveAdminPath("/admin", "/admin"), true);
  assert.equal(isActiveAdminPath("/admin/users", "/admin"), false);
  assert.equal(
    isActiveAdminPath(
      "/admin/financials/contractor-hours",
      "/admin/financials/contractor-hours",
    ),
    true,
  );
  assert.equal(
    isActiveAdminPath("/admin/financials/contractor-hours/x", "/admin/financials"),
    true,
  );
});
