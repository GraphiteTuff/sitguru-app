import AsyncStorage from '@react-native-async-storage/async-storage';

/** Canonical end-of-visit praise tags shown in the mobile review loop. */
export const VISIT_PRAISE_TAGS = [
  'Punctual',
  'Great Photos',
  'Detailed Update',
  'Highly Responsive',
] as const;

export type VisitPraiseTag = (typeof VISIT_PRAISE_TAGS)[number];

export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 1000;

export const RATING_LABELS: Record<number, string> = {
  5: 'Excellent care',
  4: 'Great care',
  3: 'Good care',
  2: 'Needs improvement',
  1: 'Poor experience',
};

function skipKey(bookingId: string) {
  return `sitguru.review.skipped.${bookingId}`;
}

function submittedKey(bookingId: string) {
  return `sitguru.review.submitted.${bookingId}`;
}

export async function markVisitReviewSkipped(bookingId: string) {
  if (!bookingId) return;
  await AsyncStorage.setItem(skipKey(bookingId), new Date().toISOString());
}

export async function markVisitReviewSubmitted(bookingId: string) {
  if (!bookingId) return;
  await AsyncStorage.setItem(submittedKey(bookingId), new Date().toISOString());
  await AsyncStorage.removeItem(skipKey(bookingId));
}

export async function isVisitReviewClosed(bookingId: string) {
  if (!bookingId) return false;

  const [skipped, submitted] = await Promise.all([
    AsyncStorage.getItem(skipKey(bookingId)),
    AsyncStorage.getItem(submittedKey(bookingId)),
  ]);

  return Boolean(skipped || submitted);
}
