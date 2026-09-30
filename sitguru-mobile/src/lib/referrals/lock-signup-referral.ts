import AsyncStorage from '@react-native-async-storage/async-storage';

import { sitguruApiFetch } from '@/lib/data/api';

const REFERRAL_STORAGE_KEY = 'sitguru.ambassadorReferralCode';
const SIGNUP_INTENT_KEY = 'sitguru.signupIntent';
const NEW_ACCOUNT_MS = 15 * 60 * 1000;

type ProvisionIntent = 'pet_parent' | 'guru' | 'ambassador' | 'both';

export function isNewAcquisitionAccount(
  createdAt?: string | null,
  now = Date.now(),
) {
  const created = Date.parse(String(createdAt || ''));
  if (!Number.isFinite(created)) return false;
  return now >= created && now - created <= NEW_ACCOUNT_MS;
}

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
    if (!input.userId || !isNewAcquisitionAccount(input.createdAt)) return;

    const storedCode = normalizeCode(
      await AsyncStorage.getItem(REFERRAL_STORAGE_KEY),
    );
    if (!storedCode) return;

    const storedIntent = await AsyncStorage.getItem(SIGNUP_INTENT_KEY);
    await AsyncStorage.removeItem(SIGNUP_INTENT_KEY);

    const body = {
      userId: input.userId,
      intent: mapIntent(storedIntent),
      fullName: input.fullName || undefined,
      email: input.email || undefined,
      ambassadorReferralCode: storedCode,
      referralCode: storedCode,
      source: 'mobile_app',
    };

    const authed = await sitguruApiFetch('/api/auth/provision-signup', {
      method: 'POST',
      auth: true,
      body,
    });
    if (authed.status === 401) {
      await sitguruApiFetch('/api/auth/provision-signup', {
        method: 'POST',
        auth: false,
        body,
      });
    }
  } catch {
    // A failed lock must not block sign-in. The server also refuses old accounts.
  }
}
