import assert from "node:assert/strict";
import test from "node:test";
import { guruFirstName, guruPublicIntro } from "./public-intro";

test("public Guru share introduces the Guru by first name", () => {
  assert.equal(guruFirstName("kara"), "Kara");
  assert.equal(guruFirstName("George Medina"), "George");
  assert.equal(guruFirstName("Élodie Dubois"), "Élodie");
});

test("real Kara bio has its duplicated greeting removed but keeps her words", () => {
  const excerpt = guruPublicIntro(
    "Hi!! i’m Kara! i have 6 years experience in dog sitting, walking, grooming, and all things fur babies! i would love to care for yours!",
    "Kara"
  );
  assert.equal(
    excerpt,
    "I have 6 years experience in dog sitting, walking, grooming, and all things fur babies! I would love to care for yours!"
  );
});

test("public Guru bios are presented as plain, short excerpts", () => {
  assert.equal(guruPublicIntro("  <b>I love dogs!</b>  ", "Sam"), "I love dogs!");
  assert.equal(guruPublicIntro("This Guru is building their profile.", "Sam"), null);
  assert.equal(guruPublicIntro(null, "Sam"), null);
  const long = "I care for your furry companions. ".repeat(22);
  const result = guruPublicIntro(long, "Sam");
  assert.ok(result);
  assert.ok(result!.length <= 270);
  assert.ok(result!.endsWith("…"));
});
