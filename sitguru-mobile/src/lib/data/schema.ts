/**
 * Canonical table / column / realtime channel contracts shared with SitGuru web.
 * Prefer these names over screen-local fallback lists.
 */

export const TABLES = {
  profiles: 'profiles',
  userRoles: 'user_roles',
  pets: 'pets',
  gurus: 'gurus',
  guruServiceRates: 'guru_service_rates',
  bookings: 'bookings',
  bookingPayments: 'booking_payments',
  conversations: 'conversations',
  conversationParticipants: 'conversation_participants',
  messages: 'messages',
  notifications: 'notifications',
  bookingVisitSessions: 'booking_visit_sessions',
  bookingVisitUpdates: 'booking_visit_updates',
  bookingWalkTracks: 'booking_walk_tracks',
  bookingWalkTrackPoints: 'booking_walk_track_points',
  reviews: 'reviews',
  guruPayouts: 'guru_payouts',
  userPayoutAccounts: 'user_payout_accounts',
  userPayoutPreferences: 'user_payout_preferences',
} as const;

/** Parent ownership columns on bookings (web order). */
export const BOOKING_PARENT_ID_FIELDS = [
  'pet_owner_id',
  'customer_id',
  'user_id',
  'pet_parent_id',
] as const;

/** Assigned guru columns on bookings (web order). */
export const BOOKING_GURU_ID_FIELDS = [
  'guru_id',
  'provider_id',
  'sitter_id',
  'caregiver_id',
] as const;

/** Pet owner columns (web order). */
export const PET_OWNER_ID_FIELDS = [
  'user_id',
  'owner_id',
  'owner_profile_id',
] as const;

export const ACTIVE_BOOKING_STATUSES = new Set([
  'confirmed',
  'accepted',
  'in_progress',
  'active',
  'paid',
  'upcoming',
]);

export const PAID_PAYMENT_STATUSES = new Set([
  'paid',
  'succeeded',
  'complete',
  'completed',
]);

/** Match web NotificationBell / ChatWindow channel naming. */
export const REALTIME_CHANNELS = {
  chat: (conversationId: string) => `chat:${conversationId}`,
  notifications: (userId: string, nonce = '') =>
    `notifications:${userId}${nonce ? `:${nonce}` : ''}`,
  inboxToast: (userId: string) => `inbox-toast:${userId}`,
  bookingRoom: (bookingId: string) => `room-${bookingId}`,
  presence: 'sitguru-message-presence',
  guruLiveSearch: 'sitguru-guru-live-search',
  guruLiveProfile: (slug: string) => `sitguru-guru-live-profile-${slug}`,
} as const;

export const API_PATHS = {
  createBooking: '/api/bookings/create',
  sendMessage: '/api/messages/send',
  ensureBookingConversation: '/api/messaging/ensure-booking-conversation',
  mobileCheckout: '/api/mobile/payments/checkout',
  registerPushToken: '/api/mobile/push-token',
  payoutSetup: '/api/payouts/setup',
  walkAction: (bookingId: string) =>
    `/api/walk/${encodeURIComponent(bookingId)}/actions`,
  walkStream: (bookingId: string) =>
    `/api/walk/stream/${encodeURIComponent(bookingId)}`,
} as const;
