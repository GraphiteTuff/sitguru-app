import AsyncStorage from '@react-native-async-storage/async-storage';

import { sitguruApiFetch } from '@/lib/data/api';
import {
  isNewAcquisitionAccount,
  shouldAttemptMobileAcquisition,
  shouldClearStoredReferral,
  shouldReplaceStoredReferralSeal,
} from '@/lib/referrals/referral-storage-policy';

const REFERRAL_STORAGE_KEY = 'sitguru.ambassadorReferralCode';
const CAPTURED_AT_KEY = 'sitguru.ambassadorReferralCapturedAt';
const CAPTURE_MAC_KEY = 'sitguru.ambassadorReferralCaptureMac';
const SIGNUP_INTENT_KEY = 'sitguru.signupIntent';

type ProvisionIntent = 'pet_parent' | 'guru' | 'ambassador' | 'both';

export { isNewAcquisitionAccount };

function normalizeCode(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

function mapIntent(value: string | null | undefined): ProvisionIntent {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  if (normalized === 'guru') return 'guru';
  if (normalized === 'ambassador') return 'ambassador';
  if (normalized === 'multiple' || normalized === 'both') return 'both';
  return 'pet_parent';
}

export async function rememberAmbassadorReferral(code: string) {
  const normalized = normalizeCode(code);
  if (!normalized) return;
  try {
    const existingCode = normalizeCode(
      await AsyncStorage.getItem(REFERRAL_STORAGE_KEY),
    );
    const existingAt = await AsyncStorage.getItem(CAPTURED_AT_KEY);
    const existingMac = await AsyncStorage.getItem(CAPTURE_MAC_KEY);
    if (
      !shouldReplaceStoredReferralSeal({
        existingCode,
        incomingCode: normalized,
        existingCapturedAt: existingAt,
        existingMac,
      })
    ) {
      return;
    }

    await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
    const response = await sitguruApiFetch<{
      ok?: boolean;
      capturedAt?: string;
      captureMac?: string;
    }>('/api/ambassador/track-click', {
      method: 'POST',
      auth: false,
      body: { ref: normalized, landingPath: `/r/${normalized}` },
    });
    if (response.data?.capturedAt && response.data?.captureMac) {
      await AsyncStorage.setItem(CAPTURED_AT_KEY, response.data.capturedAt);
      await AsyncStorage.setItem(CAPTURE_MAC_KEY, response.data.captureMac);
    }
  } catch {
    // The code remains in storage. Signup still sends it; the server stamps time.
  }
}

export async function rememberSignupIntent(intent: string) {
  try {
    await AsyncStorage.setItem(SIGNUP_INTENT_KEY, intent);
  } catch {
    // Storage can be unavailable. Email signup still sends its own intent.
  }
}

/**
 * Lock a stored Ambassador code onto a brand-new Auth user id.
 * Existing accounts are left alone, including their role.
 */
export async function lockNewAccountReferral(input: {
  userId?: string | null;
  createdAt?: string | null;
  email?: string | null;
  fullName?: string | null;
}) {
  try {
    if (!input.userId) return;

    const storedCode = normalizeCode(
      await AsyncStorage.getItem(REFERRAL_STORAGE_KEY),
    );
    if (!storedCode) return;

    const capturedAt = await AsyncStorage.getItem(CAPTURED_AT_KEY);
    const captureMac = await AsyncStorage.getItem(CAPTURE_MAC_KEY);
    if (
      !shouldAttemptMobileAcquisition({
        createdAt: input.createdAt,
        capturedAt,
      })
    ) {
      return;
    }

    const storedIntent = await AsyncStorage.getItem(SIGNUP_INTENT_KEY);
    await AsyncStorage.removeItem(SIGNUP_INTENT_KEY);

    const body = {
      userId: input.userId,
      intent: mapIntent(storedIntent),
      fullName: input.fullName || undefined,
      email: input.email || undefined,
      ambassadorReferralCode: storedCode,
      referralCode: storedCode,
      referralCapturedAt: capturedAt || undefined,
      referralCaptureMac: captureMac || undefined,
      source: 'mobile_app',
    };

    const authed = await sitguruApiFetch<{
      appliedReferral?: { applied?: boolean; status?: string };
    }>('/api/auth/provision-signup', {
      method: 'POST',
      auth: true,
      body,
    });
    let result = authed;
    if (authed.status === 401) {
      result = await sitguruApiFetch<{
        appliedReferral?: { applied?: boolean; status?: string };
      }>('/api/auth/provision-signup', {
        method: 'POST',
        auth: false,
        body,
      });
    }
    const applied = result.data?.appliedReferral;
    if (
      shouldClearStoredReferral({
        applied: applied?.applied,
        status: applied?.status,
      })
    ) {
      await AsyncStorage.multiRemove([
        REFERRAL_STORAGE_KEY,
        CAPTURED_AT_KEY,
        CAPTURE_MAC_KEY,
      ]);
    }
  } catch {
    // A failed lock must not block sign-in. The server also refuses old accounts.
  }
}
