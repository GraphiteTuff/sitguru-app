import { useCallback, useState } from 'react';

import { sitguruApiFetch } from '@/lib/data/api';
import {
  markVisitReviewSkipped,
  markVisitReviewSubmitted,
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
  VISIT_PRAISE_TAGS,
} from '@/lib/reviews/visit-review';

export type SubmitBookingReviewInput = {
  bookingId: string;
  rating: number;
  reviewText: string;
  praiseTags?: string[];
  categoryRatings?: Record<string, string>;
};

export type SubmitBookingReviewResult = {
  ok: boolean;
  error: string | null;
  action: 'submit' | 'skip' | null;
  metrics?: {
    reviewCount?: number;
    ratingAvg?: number;
  } | null;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  action?: 'submit' | 'skip';
  metrics?: {
    reviewCount?: number;
    ratingAvg?: number;
  };
};

/**
 * Secure end-of-visit review mutation via /api/mobile/reviews
 * (Bearer headers resolved in sitguruApiFetch → request-auth on web).
 */
export function useSubmitBookingReview() {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = useCallback(
    async (input: SubmitBookingReviewInput): Promise<SubmitBookingReviewResult> => {
      const bookingId = input.bookingId.trim();
      const reviewText = input.reviewText.trim();
      const rating = Math.round(input.rating);

      if (!bookingId) {
        return {
          ok: false,
          error: 'Open Reviews from a completed booking.',
          action: null,
        };
      }

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return {
          ok: false,
          error: 'Choose a rating from 1 to 5 stars.',
          action: null,
        };
      }

      if (reviewText.length < REVIEW_TEXT_MIN) {
        return {
          ok: false,
          error: `Please enter at least ${REVIEW_TEXT_MIN} characters about the completed care.`,
          action: null,
        };
      }

      if (reviewText.length > REVIEW_TEXT_MAX) {
        return {
          ok: false,
          error: `Keep your review under ${REVIEW_TEXT_MAX} characters.`,
          action: null,
        };
      }

      const allowed = new Set<string>(VISIT_PRAISE_TAGS);
      const praiseTags = (input.praiseTags ?? []).filter((tag) =>
        allowed.has(tag),
      );

      setSubmitting(true);

      try {
        const result = await sitguruApiFetch<ApiResponse>('/api/mobile/reviews', {
          method: 'POST',
          body: {
            action: 'submit',
            bookingId,
            rating,
            reviewText,
            praiseTags,
            categoryRatings: input.categoryRatings ?? {},
          },
        });

        if (result.error || !result.data?.ok) {
          return {
            ok: false,
            error: result.error || result.data?.error || 'Review not submitted.',
            action: null,
          };
        }

        await markVisitReviewSubmitted(bookingId);

        return {
          ok: true,
          error: null,
          action: 'submit',
          metrics: result.data.metrics ?? null,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const skipReview = useCallback(
    async (bookingId: string): Promise<SubmitBookingReviewResult> => {
      const id = bookingId.trim();
      if (!id) {
        return {
          ok: false,
          error: 'No booking selected to skip.',
          action: null,
        };
      }

      setSubmitting(true);

      try {
        const result = await sitguruApiFetch<ApiResponse>('/api/mobile/reviews', {
          method: 'POST',
          body: { action: 'skip', bookingId: id },
        });

        // Always close the local prompt so Skip stays progressive even offline.
        await markVisitReviewSkipped(id);

        if (result.error && result.status !== 0) {
          return {
            ok: true,
            error: null,
            action: 'skip',
          };
        }

        return {
          ok: true,
          error: null,
          action: 'skip',
        };
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return {
    submitting,
    submitReview,
    skipReview,
  };
}
