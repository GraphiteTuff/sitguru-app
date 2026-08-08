/**
 * Unified SitGuru mobile data layer.
 *
 * Reads: anon Supabase client + RLS (same tables as web).
 * Privileged mutations: Bearer → SitGuru web APIs (same service-role paths as desktop).
 * Realtime: filtered channels using web naming where applicable.
 */

export { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
export { usePets } from '@/hooks/data/usePets';
export { useBookings, useBooking } from '@/hooks/data/useBookings';
export { useConversations, useConversation } from '@/hooks/data/useMessages';
export { useNotifications } from '@/hooks/data/useNotifications';
export { usePublicGurus, useGuruProfile } from '@/hooks/data/useGurus';
export { useWalkSession } from '@/hooks/data/useWalkSession';
export { usePawReportLive } from '@/hooks/data/usePawReportLive';
export { useGuruEarnings } from '@/hooks/data/useGuruEarnings';

export type { CanonicalPet, CanonicalPetForm } from '@/lib/data/pets';
export type { SitGuruBooking, CreateBookingInput } from '@/hooks/data/useBookings';
export type {
  SitGuruMessage,
  SitGuruConversation,
} from '@/hooks/data/useMessages';
export type { SitGuruNotification } from '@/hooks/data/useNotifications';
export type { PublicGuru } from '@/hooks/data/useGurus';
export type {
  WalkActionName,
  WalkActionInput,
} from '@/hooks/data/useWalkSession';
export type {
  PawReportLiveSnapshot,
  LiveCareBadge,
  LiveCareLog,
} from '@/hooks/data/usePawReportLive';
export type {
  GuruEarningsItem,
  GuruEarningsSummary,
  GuruPayoutSetup,
} from '@/hooks/data/useGuruEarnings';
