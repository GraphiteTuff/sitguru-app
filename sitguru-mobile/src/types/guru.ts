export type PublicGuruProfile = {
  id: string;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  hourly_rate?: number | string | null;
  rating_avg?: number | string | null;
  review_count?: number | string | null;
  is_verified?: boolean | null;
  role?: string | null;
  source?: 'gurus' | 'profiles' | 'placeholder';
};

function cleanString(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getGuruDisplayName(guru: PublicGuruProfile) {
  const displayName = cleanString(guru.display_name);
  if (displayName) return displayName;
  const fullName = cleanString(guru.full_name);
  if (fullName) return fullName;
  const joinedName = [cleanString(guru.first_name), cleanString(guru.last_name)].filter(Boolean).join(' ').trim();
  return joinedName || 'Local Guru';
}

export function getGuruPhotoUrl(guru: PublicGuruProfile) {
  return cleanString(guru.avatar_url) || cleanString(guru.profile_photo_url) || '';
}

export function getGuruLocationLabel(guru: PublicGuruProfile) {
  const city = cleanString(guru.city);
  const state = cleanString(guru.state);
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Local care area';
}

export function getGuruRateLabel(guru: PublicGuruProfile) {
  const rawRate = guru.hourly_rate;
  const rate = typeof rawRate === 'string' ? Number(rawRate) : rawRate;
  if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return `$${Math.round(rate)}/hr`;
  return 'Custom quote';
}

export function getGuruRatingLabel(guru: PublicGuruProfile) {
  const rating = typeof guru.rating_avg === 'string' ? Number(guru.rating_avg) : guru.rating_avg;
  const reviewCount = typeof guru.review_count === 'string' ? Number(guru.review_count) : guru.review_count;
  if (typeof rating === 'number' && Number.isFinite(rating) && rating > 0) {
    if (typeof reviewCount === 'number' && Number.isFinite(reviewCount) && reviewCount > 0) return `${rating.toFixed(1)} (${Math.round(reviewCount)} reviews)`;
    return rating.toFixed(1);
  }
  if (typeof reviewCount === 'number' && Number.isFinite(reviewCount) && reviewCount > 0) return `${Math.round(reviewCount)} reviews`;
  return 'New profile';
}

export function getGuruInitials(guru: PublicGuruProfile) {
  return getGuruDisplayName(guru).split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'SG';
}
