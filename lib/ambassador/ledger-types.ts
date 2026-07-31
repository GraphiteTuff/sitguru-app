// lib/ambassador/ledger-types.ts
/** Brand Ambassador performance ledger types */

export type AmbassadorPayoutStatus =
  | "PENDING_AUDIT"
  | "APPROVED"
  | "PAID"
  | "VOID";

export type AmbassadorProfileRow = {
  id: string;
  user_id: string;
  ambassador_record_id?: string | null;
  referral_code_slug: string;
  display_name?: string | null;
  region?: string | null;
  commission_rate_per_booking: number;
  lifetime_payouts_sum: number;
  is_active: boolean;
  stripe_connect_account_id?: string | null;
  created_at?: string | null;
};

export type AmbassadorClickRow = {
  click_id: string;
  ambassador_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  landing_path?: string | null;
  created_at: string;
};

export type AmbassadorReferralRow = {
  referral_id: string;
  ambassador_id: string;
  new_user_id?: string | null;
  referred_role?: string | null;
  total_booking_value: number;
  commission_earned: number;
  payout_status: AmbassadorPayoutStatus;
  payout_batch_id?: string | null;
  created_at: string;
};

export type AmbassadorPerformanceRow = {
  profileId: string;
  userId: string;
  displayName: string;
  referralCode: string;
  referralLink: string;
  region: string;
  clicks: number;
  referrals: number;
  conversionRate: number;
  earningsPool: number;
  pendingAudit: number;
  approvedPool: number;
  lifetimePaid: number;
  isActive: boolean;
};

export type AmbassadorNetworkKpis = {
  activeLocalReps: number;
  totalReferralsToday: number;
  pendingPayoutPool: number;
  topPerformingRegion: string;
};

export const AMBASSADOR_REF_COOKIE = "sitguru_ambassador_ref";
/** Canonical cookie already used by /r/ short links + signup capture */
export const AMBASSADOR_CODE_COOKIE = "sitguru_ambassador_code";
export const AMBASSADOR_REF_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
