import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("fetchCommunityRecommendations query shape", () => {
  it("filters format and search in the database query with an inner join", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/reads/queries.ts"),
      "utf8",
    );
    const start = source.indexOf(
      "export async function fetchCommunityRecommendations",
    );
    assert.ok(start > -1);
    const nextExport = source.indexOf("\nexport ", start + 10);
    const fn = source.slice(start, nextExport === -1 ? undefined : nextExport);
    assert.match(fn, /reads_content!inner/);
    assert.match(fn, /content\.content_type/);
    assert.match(fn, /quote\.ilike/);
    assert.doesNotMatch(fn, /\.filter\(\(row\) => \{\s*if \(filters\?\.format/);
  });
});
