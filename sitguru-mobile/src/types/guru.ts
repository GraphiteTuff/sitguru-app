export type PublicGuruProfile = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  slug?: string | null;
  username?: string | null;
  handle?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_area?: string | null;
  zip_code?: string | null;
  service_zip?: string | null;
  service_radius_miles?: number | string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  profile_image_url?: string | null;
  hourly_rate?: number | string | null;
  starting_rate?: number | string | null;
  rate?: number | string | null;
  rating_avg?: number | string | null;
  review_count?: number | string | null;
  is_verified?: boolean | null;
  is_bookable?: boolean | null;
  accepting_bookings?: boolean | null;
  is_accepting_bookings?: boolean | null;
  is_public_visible?: boolean | null;
  admin_status?: string | null;
  profile_quality_status?: string | null;
  role?: string | null;
  services?: string[] | string | null;
  source?: 'public_guru_search_profiles' | 'guru_profiles' | 'gurus' | 'profiles' | 'placeholder';
};

const KNOWN_PREVIEW_GURU_NAMES = ['avery', 'caleb', 'darius', 'emma', 'jason', 'maya', 'nina', 'olivia', 'sofia', 'suzy'];

function cleanString(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(value?: string | null) {
  return cleanString(value).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function toNumber(value?: number | string | null) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

function explicitFalse(value?: boolean | null) {
  return value === false;
}

function explicitTrue(value?: boolean | null) {
  return value === true;
}

function statusMeansBookable(value?: string | null) {
  return ['active', 'approved', 'bookable', 'booking_ready', 'live', 'published', 'requestable'].includes(normalize(value).replace(/ /g, '_'));
}

function statusMeansClosed(value?: string | null) {
  return ['inactive', 'paused', 'closed', 'disabled', 'rejected', 'hidden', 'listed_only', 'preview'].includes(normalize(value).replace(/ /g, '_'));
}

export function getGuruDisplayName(guru: PublicGuruProfile) {
  const displayName = cleanString(guru.display_name);
  if (displayName) return displayName;
  const fullName = cleanString(guru.full_name);
  if (fullName) return fullName;
  const joinedName = [cleanString(guru.first_name), cleanString(guru.last_name)].filter(Boolean).join(' ').trim();
  if (joinedName) return joinedName;
  return cleanString(guru.username) || cleanString(guru.handle) || 'Local Guru';
}

export function getGuruFirstName(guru: PublicGuruProfile) {
  const firstName = cleanString(guru.first_name);
  if (firstName) return firstName;
  return getGuruDisplayName(guru).split(/\s+/)[0] || 'Local';
}

export function getGuruPhotoUrl(guru: PublicGuruProfile) {
  return cleanString(guru.profile_photo_url) || cleanString(guru.avatar_url) || cleanString(guru.photo_url) || cleanString(guru.image_url) || cleanString(guru.profile_image_url) || '';
}

export function getGuruLocationLabel(guru: PublicGuruProfile) {
  const serviceArea = cleanString(guru.service_area);
  if (serviceArea) return serviceArea;
  const city = cleanString(guru.service_city) || cleanString(guru.city);
  const state = cleanString(guru.service_state) || cleanString(guru.state);
  const zip = cleanString(guru.service_zip) || cleanString(guru.zip_code);
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state && zip) return `${state} ${zip}`;
  if (state) return state;
  if (zip) return `ZIP ${zip}`;
  return 'Local care area';
}

export function getGuruRateLabel(guru: PublicGuruProfile) {
  const rate = toNumber(guru.hourly_rate) ?? toNumber(guru.starting_rate) ?? toNumber(guru.rate);
  if (rate && rate > 0) return `$${Math.round(rate)}/hr`;
  return 'Custom quote';
}

export function getGuruRatingLabel(guru: PublicGuruProfile) {
  const rating = toNumber(guru.rating_avg);
  const reviewCount = toNumber(guru.review_count);
  if (rating && rating > 0) {
    if (reviewCount && reviewCount > 0) return `${rating.toFixed(1)} (${Math.round(reviewCount)} reviews)`;
    return rating.toFixed(1);
  }
  if (reviewCount && reviewCount > 0) return `${Math.round(reviewCount)} reviews`;
  return 'New profile';
}

export function getGuruSlug(guru: PublicGuruProfile) {
  const existing = cleanString(guru.slug) || cleanString(guru.username) || cleanString(guru.handle);
  if (existing) return existing.replace(/^@/, '');
  return getGuruDisplayName(guru).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || guru.id;
}

export function isKnownPreviewGuru(guru: PublicGuruProfile) {
  const candidates = [guru.display_name, guru.full_name, guru.first_name, guru.slug, guru.username, guru.handle]
    .map(normalize)
    .filter(Boolean);
  return candidates.some((candidate) => KNOWN_PREVIEW_GURU_NAMES.some((name) => candidate === name || candidate.startsWith(`${name} `) || candidate.startsWith(`${name}-`) || candidate.includes(` ${name} `)));
}

export function isGuruBookable(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) return false;
  if (explicitFalse(guru.is_bookable) || explicitFalse(guru.accepting_bookings) || explicitFalse(guru.is_accepting_bookings)) return false;
  if (statusMeansClosed(guru.admin_status) || statusMeansClosed(guru.profile_quality_status)) return false;
  if (explicitTrue(guru.is_bookable) || explicitTrue(guru.accepting_bookings) || explicitTrue(guru.is_accepting_bookings)) return true;
  return statusMeansBookable(guru.admin_status) || statusMeansBookable(guru.profile_quality_status);
}

export function getGuruBookingLabel(guru: PublicGuruProfile) {
  return isKnownPreviewGuru(guru) ? 'Preview Only' : isGuruBookable(guru) ? 'Request Care' : 'Message First';
}

export function getGuruSearchBadge(guru: PublicGuruProfile) {
  return isKnownPreviewGuru(guru) ? 'Profile Preview' : isGuruBookable(guru) ? 'Booking Ready' : 'Message First';
}

export function getGuruVisibilityLabel(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) return 'Preview profile';
  if (explicitFalse(guru.is_public_visible) || statusMeansClosed(guru.profile_quality_status)) return 'Limited visibility';
  if (explicitTrue(guru.is_public_visible) || statusMeansBookable(guru.admin_status) || statusMeansBookable(guru.profile_quality_status)) return 'Public profile';
  return 'Public listing';
}

export function getGuruBookingStatusLabel(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) return 'Bookings paused';
  return isGuruBookable(guru) ? 'Accepting requests' : 'Message to confirm';
}

export function getGuruProfileNotice(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) return 'This local Guru profile is visible while SitGuru grows local availability, but is not currently accepting booking requests.';
  if (!isGuruBookable(guru)) return 'Message this Guru first to confirm current availability before requesting care.';
  return '';
}

export function getGuruInitials(guru: PublicGuruProfile) {
  return getGuruDisplayName(guru).split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'SG';
}

export function getGuruServices(guru: PublicGuruProfile) {
  if (Array.isArray(guru.services)) return guru.services.filter(Boolean);
  if (typeof guru.services === 'string') return guru.services.split(',').map((service) => service.trim()).filter(Boolean);
  return [];
}
