import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildManagerResources } from "./resource-catalog";
import { buildManagerToolkit, searchToolkit } from "./toolkit-catalog";

const folders = {
  "general-brand-kit": "https://sitgurullc.sharepoint.com/brand",
  "content-drafts": "https://sitgurullc.sharepoint.com/drafts",
  "strategy-market-research": "https://sitgurullc.sharepoint.com/research",
};

describe("manager toolkit catalog", () => {
  it("gives every section a real destination and does not loop with resources", () => {
    const toolkit = buildManagerToolkit({
      isSuperUser: false,
      folders,
      teamsHref: "https://teams.cloud.microsoft",
    });
    assert.equal(toolkit.length, 6);
    const brand = toolkit.find((section) => section.id === "brand");
    assert.equal(brand?.href, "/manager/toolkit/brand");
    assert.equal(brand?.features.some((feature) => feature.href === "/manager/resources"), false);
    assert.equal(toolkit.find((section) => section.id === "company")?.href, "/manager/resources");
    const resources = buildManagerResources({
      isSuperUser: false,
      folders,
      teamsHref: "https://teams.cloud.microsoft",
    });
    assert.equal(
      resources.some((group) => group.items.some((item) => item.href === "/manager/toolkit")),
      false,
    );
    assert.equal(
      resources.some((group) => group.items.some((item) => item.href === "/manager/toolkit/brand")),
      true,
    );
  });

  it("searches real tools and labels unconfigured SharePoint research", () => {
    const toolkit = buildManagerToolkit({
      isSuperUser: true,
      folders: {},
      teamsHref: "https://teams.cloud.microsoft",
    });
    const hits = searchToolkit("live results", toolkit, []);
    assert.equal(hits?.some((hit) => hit.href === "/manager/results"), true);
    assert.deepEqual(searchToolkit("zzzz-not-a-tool", toolkit, []), []);
    assert.equal(searchToolkit("  ", toolkit, []), null);
    const research = toolkit
      .find((section) => section.id === "growth")
      ?.features.find((feature) => feature.label === "Competitor Research");
    assert.equal(Boolean(research?.unavailable), true);
    assert.equal(research?.href, undefined);
  });

  it("does not hardcode a person into shared labels", () => {
    const toolkit = buildManagerToolkit({
      isSuperUser: false,
      folders,
      teamsHref: "https://teams.cloud.microsoft",
    });
    const labels = toolkit.flatMap((section) => [section.title, ...section.features.map((feature) => feature.label)]);
    assert.equal(labels.some((label) => /ava|jason|lola/i.test(label)), false);
  });
});
