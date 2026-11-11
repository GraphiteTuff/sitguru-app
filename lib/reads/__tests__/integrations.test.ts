import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MANAGER_PORTAL_SIDEBAR } from "@/lib/admin/growth/manager-portal";
import { MANAGER_ROUTES } from "@/lib/admin/growth/manager-routes";
import { resolveDateRange } from "@/lib/growth-center-v2/date-range";
import { buildGrowthInsights } from "@/lib/growth-center-v2/insights";
import { INTERN_PORTAL_SIDEBAR } from "@/lib/internship/intern-portal-nav";
import { INTERN_ROUTES } from "@/lib/internship/intern-routes";
import {
  assertNoSelfPublish,
  canInternEditContent,
  type ReadsIdentity,
} from "@/lib/reads/access";
import { READS_TEAM_AVATARS } from "@/lib/reads/team";

function identity(
  staffRole: ReadsIdentity["staffRole"],
  id = "user-1",
): ReadsIdentity {
  return {
    id,
    email: `${staffRole}@sitguru.com`,
    role: staffRole === "intern" ? "content_intern" : staffRole,
    staffRole,
    canCreate: true,
    canSubmit: true,
    canReview: staffRole !== "intern",
    canPublish: staffRole !== "intern",
    canOverride: staffRole === "admin",
    canManagePartnerships: staffRole !== "intern",
    canEscalate: staffRole !== "intern",
    canViewAllAnalytics: staffRole !== "intern",
    canViewOwnAnalytics: true,
    canManageTaxonomy: staffRole !== "intern",
    canImportYoutube: true,
  };
}

describe("reads portal integrations", () => {
  it("wires Manager Content Studio peer to /manager/reads", () => {
    assert.equal(MANAGER_ROUTES.reads, "/manager/reads");
    const labels = MANAGER_PORTAL_SIDEBAR.map((item) => item.label);
    assert.equal(labels.includes("Reads & Media"), true);
    assert.equal(labels[labels.indexOf("Content Studio") + 1], "Reads & Media");
  });

  it("wires Intern portal Reads & Media beside Create Content", () => {
    assert.equal(INTERN_ROUTES.reads, "/intern/content/reads");
    const labels = INTERN_PORTAL_SIDEBAR.map((item) => item.label);
    assert.equal(labels.includes("Reads & Media"), true);
    assert.equal(labels[labels.indexOf("Create Content") + 1], "Reads & Media");
  });

  it("keeps intern self-publish blocked while allowing draft ownership edits", () => {
    const intern = identity("intern", "intern-1");
    assert.equal(
      canInternEditContent(intern, {
        created_by: "intern-1",
        assigned_intern_id: null,
      }),
      true,
    );
    assert.throws(() => assertNoSelfPublish(intern), /cannot publish/i);
  });

  it("exposes local avatar paths for every seeded teammate", () => {
    for (const slug of Object.keys(READS_TEAM_AVATARS)) {
      assert.match(READS_TEAM_AVATARS[slug], /^\/images\/staff\//);
    }
  });
});

describe("reads growth insights integration", () => {
  it("emits grounded Reads insights with audience-correct hrefs", () => {
    const filters = resolveDateRange({
      preset: "last_7",
      timeZone: "America/New_York",
    });

    const managerInsights = buildGrowthInsights({
      audience: "manager",
      filters,
      kpis: [],
      funnel: [],
      campaigns: [],
      contentPending: 0,
      reads: {
        pageViews: 40,
        videoPlays: 0,
        needsReview: 2,
        partnerLeads: 1,
      },
    });

    const ids = managerInsights.map((item) => item.id);
    assert.equal(ids.includes("reads-needs-review"), true);
    assert.equal(ids.includes("reads-views-no-plays"), true);
    assert.equal(ids.includes("reads-partner-leads"), true);
    assert.equal(
      managerInsights.find((item) => item.id === "reads-needs-review")?.actionHref,
      "/manager/reads?tab=content",
    );

    const internInsights = buildGrowthInsights({
      audience: "intern",
      filters,
      kpis: [],
      funnel: [],
      campaigns: [],
      contentPending: 0,
      reads: {
        pageViews: 40,
        videoPlays: 0,
        needsReview: 2,
        partnerLeads: 0,
      },
    });
    assert.equal(
      internInsights.find((item) => item.id === "reads-needs-review")?.actionHref,
      "/intern/content/reads?tab=content",
    );

    const adminInsights = buildGrowthInsights({
      audience: "admin",
      filters,
      kpis: [],
      funnel: [],
      campaigns: [],
      contentPending: 0,
      reads: {
        pageViews: 0,
        videoPlays: 0,
        needsReview: 1,
        partnerLeads: 0,
      },
    });
    assert.equal(
      adminInsights.find((item) => item.id === "reads-needs-review")?.actionHref,
      "/admin/growth/reads?tab=content",
    );
  });
});
