import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  READS_CATEGORY_CONFIG,
  READS_CATEGORY_NAV,
  READS_PRIMARY_PILLS,
  RECOMMENDATION_SOURCE_COPY,
} from "../category-config";
import { filterBySegment } from "../browse-filters";
import { DEMO_CONTENT } from "../demo-data";

describe("reads category browse config", () => {
  it("covers all eight public category routes", () => {
    assert.equal(READS_CATEGORY_NAV.length, 8);
    assert.deepEqual(
      READS_CATEGORY_NAV.map((item) => item.href),
      [
        "/reads/books",
        "/reads/magazines",
        "/reads/podcasts",
        "/reads/videos",
        "/reads/authors",
        "/reads/team-picks",
        "/reads/guru-picks",
        "/reads/pet-parent-picks",
      ],
    );
    assert.equal(READS_PRIMARY_PILLS.length, 3);
  });

  it("keeps recommendation source distinctions clear", () => {
    assert.match(
      READS_CATEGORY_CONFIG["team-picks"].description,
      /staff/i,
    );
    assert.match(
      READS_CATEGORY_CONFIG["guru-picks"].description,
      /registered pet-care providers/i,
    );
    assert.match(
      READS_CATEGORY_CONFIG["pet-parent-picks"].description,
      /community/i,
    );
    assert.match(RECOMMENDATION_SOURCE_COPY.guru.reviewNote, /review/i);
    assert.match(
      RECOMMENDATION_SOURCE_COPY.pet_parent.reviewNote,
      /approval/i,
    );
  });

  it("filters magazine segments for dog, cat, and wellness", () => {
    const magazines = DEMO_CONTENT.filter((c) => c.content_type === "magazine");
    assert.ok(filterBySegment(magazines, "dog").length >= 1);
    assert.ok(filterBySegment(magazines, "cat").length >= 1);
    assert.ok(filterBySegment(magazines, "health").length >= 1);
  });
});
