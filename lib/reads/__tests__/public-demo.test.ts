import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_CONTENT,
  DEMO_TEAM,
  DEMO_TEAM_PICKS,
  isDemoContentId,
} from "../demo-data";
import { READS_FORMAT_NAV, READS_PRIMARY_CTAS } from "../constants";
import { AVA_BOOK, AVA_BOOK_SLUG, createAvaBookPick, mergeAvaBook } from "../curated-ava-book";

describe("reads public demo safety", () => {
  it("marks demo content clearly and includes required formats", () => {
    const types = new Set(DEMO_CONTENT.map((c) => c.content_type));
    assert.ok(types.has("book"));
    assert.ok(types.has("magazine"));
    assert.ok(types.has("podcast"));
    assert.ok(types.has("video"));
    assert.ok(types.has("author"));
    assert.ok(DEMO_CONTENT.every((c) => isDemoContentId(c.id)));
    assert.ok(DEMO_CONTENT.every((c) => c.status === "published"));
  });

  it("includes Ava, Ryan, and Lola in team members and picks", () => {
    const names = DEMO_TEAM.map((m) => m.full_name);
    assert.ok(names.includes("Ava Venezia"));
    assert.ok(names.includes("Ryan Manibo"));
    assert.ok(names.includes("Lola Uhl"));
    assert.ok(DEMO_TEAM_PICKS.length >= 3);
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "ava-venezia"),
    );
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "ryan-manibo"),
    );
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "lola-uhl"),
    );
  });

  it("wires Jason's favorite book to The Forever Dog with author metadata", () => {
    const jasonPick = DEMO_TEAM_PICKS.find(
      (p) => p.team_member?.slug === "jason-graff",
    );
    assert.ok(jasonPick);
    assert.equal(jasonPick?.recommendation_type, "favorite_book");
    assert.equal(jasonPick?.content?.slug, "the-forever-dog");
    assert.equal(jasonPick?.content?.content_type, "book");
    assert.equal(jasonPick?.content?.book?.publisher, "Harper");
    assert.equal(jasonPick?.content?.book?.isbn, "978-0063002609");
    assert.match(
      jasonPick?.content?.book?.author_name || "",
      /Karen Shaw Becker/,
    );
    assert.ok(
      DEMO_CONTENT.some(
        (c) =>
          c.slug === "karen-shaw-becker" &&
          c.person?.person_type === "veterinarian" &&
          c.disclosure_label === "none",
      ),
    );
    assert.ok(
      DEMO_CONTENT.some(
        (c) => c.slug === "rodney-habib" && c.disclosure_label === "none",
      ),
    );
  });

  it("publishes Ava's selected book with the user-provided bibliographic details", () => {
    assert.equal(AVA_BOOK.slug, AVA_BOOK_SLUG);
    assert.equal(AVA_BOOK.title, "The Other End of the Leash");
    assert.equal(AVA_BOOK.book?.author_name, "Patricia B. McConnell, Ph.D.");
    assert.equal(AVA_BOOK.book?.publisher, "Ballantine Books");
    assert.equal(AVA_BOOK.book?.isbn, "9780345446787");
    assert.equal(AVA_BOOK.book?.page_count, 272);
    assert.equal(AVA_BOOK.book?.publication_date, "2003-04-29");
    assert.equal(AVA_BOOK.image_url, "/images/reads/covers/the-other-end-of-the-leash-ava.webp");
    assert.equal(AVA_BOOK.status, "published");
    assert.equal(AVA_BOOK.disclosure_label, "sitguru_recommended");
    assert.ok(!isDemoContentId(AVA_BOOK.id));
    const ava = DEMO_TEAM.find((member) => member.slug === "ava-venezia");
    assert.ok(ava);
    const pick = createAvaBookPick(ava);
    assert.equal(pick.recommendation_type, "favorite_book");
    assert.equal(pick.content?.slug, AVA_BOOK_SLUG);
    assert.equal(pick.quote, ""); // no quote fabricated on Ava's behalf
  });

  it("adds Ava's book to public listings without replacing Jason's featured pick", () => {
    const books = DEMO_CONTENT.filter((item) => item.content_type === "book");
    const result = mergeAvaBook(books, { format: "book" });
    assert.equal(result[0]?.slug, "the-forever-dog");
    assert.equal(result[1]?.slug, AVA_BOOK_SLUG);
    assert.equal(mergeAvaBook(result, { format: "book" }).filter((i) => i.slug === AVA_BOOK_SLUG).length, 1);
    assert.equal(mergeAvaBook(books, { format: "podcast" }).length, books.length);
    assert.equal(mergeAvaBook(books, { format: "book", featured: true }).length, books.length);
  });

  it("exposes primary public navigation and CTAs", () => {
    assert.ok(READS_FORMAT_NAV.some((i) => i.href === "/reads/books"));
    assert.ok(READS_FORMAT_NAV.some((i) => i.href === "/reads/team-picks"));
    assert.equal(READS_PRIMARY_CTAS.length, 4);
  });
});
