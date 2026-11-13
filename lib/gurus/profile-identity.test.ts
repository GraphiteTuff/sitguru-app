import assert from "node:assert/strict";
import test from "node:test";
import {
  getGuruUrlMatchPriority,
  isSameGuruAccount,
} from "./profile-identity";

test("a shared name or URL does not authorize copying a different Guru's photo", () => {
  assert.equal(
    isSameGuruAccount(
      { id: "11111111-1111-4111-8111-111111111111", email: "one@example.test" },
      { id: "22222222-2222-4222-8222-222222222222", email: "two@example.test" },
    ),
    false,
  );
});

test("related Guru rows are recognized by a shared user ID", () => {
  assert.equal(
    isSameGuruAccount(
      { id: "11111111-1111-4111-8111-111111111111", user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      { id: "22222222-2222-4222-8222-222222222222", profile_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    ),
    true,
  );
});

test("a shared non-placeholder account email can link migrated Guru rows", () => {
  assert.equal(
    isSameGuruAccount(
      { id: "111", email: "Guru@example.test" },
      { id: "222", email: "guru@example.test" },
    ),
    true,
  );
  assert.equal(
    isSameGuruAccount(
      { id: "111", email: "placeholder@placeholder.sitguru.local" },
      { id: "222", email: "placeholder@placeholder.sitguru.local" },
    ),
    false,
  );
});

test("the exact stored slug beats a row with only a matching ID prefix", () => {
  const slug = "laura-kurtycz-b583515d";
  assert.equal(getGuruUrlMatchPriority({ slug }, slug), 3);
  assert.equal(
    getGuruUrlMatchPriority({ user_id: "b583515d-3333-4333-8333-333333333333" }, slug),
    2,
  );
  assert.equal(
    getGuruUrlMatchPriority({ user_id: "a1111111-3333-4333-8333-333333333333" }, slug),
    0,
  );
});
