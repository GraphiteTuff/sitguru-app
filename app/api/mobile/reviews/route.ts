import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

const COMPLETED_STATUSES = new Set([
  "completed",
  "complete",
  "fulfilled",
  "finished",
  "closed",
]);

const ALLOWED_PRAISE = new Set([
  "Punctual",
  "Great Photos",
  "Detailed Update",
  "Highly Responsive",
]);

type ReviewAction = "submit" | "skip";

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: mobileCorsHeaders(req),
  });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(asText(value));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeStatus(value: unknown) {
  return asText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function firstId(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }
  return "";
}

function ownsBooking(row: Record<string, unknown>, userId: string) {
  const owners = [
    asText(row.customer_id),
    asText(row.pet_parent_id),
    asText(row.pet_owner_id),
    asText(row.client_id),
    asText(row.owner_id),
    asText(row.user_id),
    asText(row.created_by),
  ].filter(Boolean);

  return owners.includes(userId);
}

async function loadBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  bookingId: string,
) {
  const tables = ["bookings", "booking_requests", "service_requests"];

  for (const table of tables) {
    const result = await admin
      .from(table)
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (!result.error && result.data) {
      return {
        table,
        row: result.data as Record<string, unknown>,
      };
    }
  }

  return null;
}

async function refreshGuruPublicMetrics(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  guruUserId: string,
) {
  const { data: reviews } = await admin
    .from("booking_reviews")
    .select("rating, overall_rating, stars, score, status, review_status")
    .or(
      [
        `guru_user_id.eq.${guruUserId}`,
        `guru_id.eq.${guruUserId}`,
        `provider_id.eq.${guruUserId}`,
        `reviewee_id.eq.${guruUserId}`,
        `subject_user_id.eq.${guruUserId}`,
      ].join(","),
    )
    .limit(500);

  const published = (reviews ?? []).filter((row) => {
    const status = normalizeStatus(
      row.status ?? row.review_status ?? "published",
    );
    return !status || ["published", "pending", "approved"].includes(status);
  });

  const ratings = published
    .map((row) => {
      const value =
        asNumber(row.rating) ||
        asNumber(row.overall_rating) ||
        asNumber(row.stars) ||
        asNumber(row.score);
      return value;
    })
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  const reviewCount = ratings.length;
  const ratingAvg =
    reviewCount > 0
      ? Math.round(
          (ratings.reduce((sum, value) => sum + value, 0) / reviewCount) * 100,
        ) / 100
      : 0;

  const payload = {
    rating_avg: ratingAvg,
    rating: ratingAvg,
    average_rating: ratingAvg,
    review_count: reviewCount,
    reviews_count: reviewCount,
    updated_at: new Date().toISOString(),
  };

  const profileKeys = ["user_id", "id", "profile_id"];
  let profilesUpdated = 0;

  for (const table of ["guru_profiles", "gurus", "profiles"] as const) {
    for (const key of profileKeys) {
      const result = await admin.from(table).update(payload).eq(key, guruUserId);
      if (!result.error) {
        profilesUpdated += 1;
        break;
      }
    }
  }

  return { reviewCount, ratingAvg, profilesUpdated };
}

async function patchBookingReviewFlags(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  table: string,
  bookingId: string,
  flags: Record<string, unknown>,
) {
  const attempts = [
    flags,
    {
      reviewed_at: flags.reviewed_at ?? flags.review_skipped_at,
      updated_at: flags.updated_at,
    },
    { updated_at: flags.updated_at },
  ];

  for (const payload of attempts) {
    const result = await admin.from(table).update(payload).eq("id", bookingId);
    if (!result.error) return true;
  }

  return false;
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

/**
 * Pet Parent end-of-visit review mutation (Bearer or cookie session).
 * Upserts booking_reviews, refreshes Guru public rating metrics,
 * and best-effort flags the booking row as reviewed/skipped.
 */
export async function POST(req: NextRequest) {
  const resolved = await resolveRequestUser(req);

  if (!resolved) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  let payload: {
    action?: unknown;
    bookingId?: unknown;
    rating?: unknown;
    reviewText?: unknown;
    praiseTags?: unknown;
    categoryRatings?: unknown;
    skip?: unknown;
  };

  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  const action: ReviewAction =
    payload.action === "skip" || payload.skip === true ? "skip" : "submit";
  const bookingId = asText(payload.bookingId);

  if (!bookingId) {
    return json(req, { error: "bookingId is required." }, 400);
  }

  const admin = createSupabaseAdminClient();
  const userId = resolved.user.id;
  const now = new Date().toISOString();

  const booking = await loadBooking(admin, bookingId);

  if (!booking) {
    return json(req, { error: "Booking not found." }, 404);
  }

  if (!ownsBooking(booking.row, userId)) {
    return json(
      req,
      { error: "This booking belongs to a different Pet Parent." },
      403,
    );
  }

  const status = normalizeStatus(booking.row.status);
  if (!COMPLETED_STATUSES.has(status)) {
    return json(
      req,
      { error: "Reviews open after the visit is completed." },
      409,
    );
  }

  const guruUserId = firstId(booking.row, [
    "guru_user_id",
    "guru_id",
    "sitter_id",
    "provider_id",
    "caregiver_id",
  ]);

  if (action === "skip") {
    const bookingUpdated = await patchBookingReviewFlags(
      admin,
      booking.table,
      bookingId,
      {
        review_skipped_at: now,
        parent_review_skipped_at: now,
        updated_at: now,
      },
    );

    return json(req, {
      ok: true,
      action: "skip",
      bookingUpdated,
      authSource: resolved.authSource,
    });
  }

  const rating = Math.round(asNumber(payload.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json(req, { error: "Rating must be an integer from 1 to 5." }, 400);
  }

  const reviewText = asText(payload.reviewText);
  if (reviewText.length < 10) {
    return json(
      req,
      { error: "Please enter at least 10 characters about the visit." },
      400,
    );
  }

  if (reviewText.length > 1000) {
    return json(req, { error: "Review text must be 1000 characters or fewer." }, 400);
  }

  const praiseTags = Array.isArray(payload.praiseTags)
    ? payload.praiseTags
        .map((tag) => asText(tag))
        .filter((tag) => ALLOWED_PRAISE.has(tag))
        .slice(0, 8)
    : [];

  const categoryRatings =
    payload.categoryRatings &&
    typeof payload.categoryRatings === "object" &&
    !Array.isArray(payload.categoryRatings)
      ? (payload.categoryRatings as Record<string, unknown>)
      : {};

  if (!guruUserId) {
    return json(req, { error: "Guru could not be verified for this booking." }, 422);
  }

  const reviewerName =
    asText(resolved.user.user_metadata?.full_name) ||
    asText(resolved.user.user_metadata?.name) ||
    asText(resolved.user.email) ||
    "Pet Parent";

  const reviewPayload = {
    booking_id: bookingId,
    care_booking_id: bookingId,
    reviewer_user_id: userId,
    reviewer_id: userId,
    customer_id: userId,
    pet_parent_id: userId,
    author_id: userId,
    user_id: userId,
    guru_user_id: guruUserId,
    guru_id: guruUserId,
    provider_id: guruUserId,
    reviewee_id: guruUserId,
    subject_user_id: guruUserId,
    reviewer_name: reviewerName,
    customer_name: reviewerName,
    pet_parent_name: reviewerName,
    author_name: reviewerName,
    rating,
    overall_rating: rating,
    stars: rating,
    score: rating,
    review_text: reviewText,
    review: reviewText,
    comment: reviewText,
    body: reviewText,
    message: reviewText,
    content: reviewText,
    category_ratings: categoryRatings,
    category_scores: categoryRatings,
    ratings_breakdown: categoryRatings,
    praise_tags: praiseTags,
    praise: praiseTags,
    highlights: praiseTags,
    tags: praiseTags,
    verified_booking: true,
    is_verified: true,
    verified: true,
    would_rebook: rating >= 4,
    is_public: true,
    status: "published",
    review_status: "published",
    moderation_status: "published",
    source: "sitguru_mobile_app",
    submitted_at: now,
    published_at: now,
    updated_at: now,
  };

  const upsert = await admin.from("booking_reviews").upsert(reviewPayload, {
    onConflict: "booking_id",
  });

  if (upsert.error) {
    const insert = await admin.from("booking_reviews").insert(reviewPayload);
    if (insert.error) {
      return json(req, { error: insert.error.message || upsert.error.message }, 500);
    }
  }

  const metrics = await refreshGuruPublicMetrics(admin, guruUserId);
  const bookingUpdated = await patchBookingReviewFlags(
    admin,
    booking.table,
    bookingId,
    {
      reviewed_at: now,
      review_submitted_at: now,
      parent_reviewed_at: now,
      parent_reviewed: true,
      updated_at: now,
    },
  );

  return json(req, {
    ok: true,
    action: "submit",
    bookingId,
    guruUserId,
    rating,
    praiseTags,
    bookingUpdated,
    metrics,
    authSource: resolved.authSource,
  });
}
