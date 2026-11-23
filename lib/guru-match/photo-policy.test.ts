import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_GURU_MATCH_PHOTO_BYTES,
  allowedGuruMatchPhotoBytes,
  trustedGuruMatchPhotoUrl,
} from "./photo-policy";

test("real full-resolution phone photos are accepted but oversized files are not", () => {
  assert.equal(allowedGuruMatchPhotoBytes(4_267_978), true);
  assert.equal(allowedGuruMatchPhotoBytes(6_014_473), true);
  assert.equal(allowedGuruMatchPhotoBytes(MAX_GURU_MATCH_PHOTO_BYTES), true);
  assert.equal(allowedGuruMatchPhotoBytes(MAX_GURU_MATCH_PHOTO_BYTES + 1), false);
  assert.equal(allowedGuruMatchPhotoBytes(0), false);
  assert.equal(allowedGuruMatchPhotoBytes(Number.NaN), false);
});

test("only recognized public Guru image sources may be downloaded into the poster", () => {
  const origin = "https://mmtjhxnzuglbyumbsjhs.supabase.co";
  assert.ok(trustedGuruMatchPhotoUrl(origin + "/storage/v1/object/public/guru-photos/guru-a.jpg"));
  assert.ok(trustedGuruMatchPhotoUrl(origin + "/storage/v1/render/image/public/guru-photos/guru-a.jpg?width=720"));
  assert.ok(trustedGuruMatchPhotoUrl(origin + "/storage/v1/object/sign/guru-photos/guru-a.jpg?token=abc"));
  assert.ok(trustedGuruMatchPhotoUrl("https://lh3.googleusercontent.com/a/profile.jpg"));
  assert.ok(trustedGuruMatchPhotoUrl("https://auth.sitguru.com/avatar.jpg"));
  assert.equal(trustedGuruMatchPhotoUrl("http://mmtjhxnzuglbyumbsjhs.supabase.co/storage/v1/object/public/guru-photos/a.jpg"), null);
  assert.equal(trustedGuruMatchPhotoUrl("https://mmtjhxnzuglbyumbsjhs.supabase.co.evil.example/storage/v1/object/public/a"), null);
  assert.equal(trustedGuruMatchPhotoUrl("https://evil.example/avatar.jpg"), null);
  assert.equal(trustedGuruMatchPhotoUrl("https://mmtjhxnzuglbyumbsjhs.supabase.co/auth/v1/admin/users"), null);
});
