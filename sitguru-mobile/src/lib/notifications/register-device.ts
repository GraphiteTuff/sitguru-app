import { Platform } from 'react-native';

import { sitguruApiFetch } from '@/lib/data/api';
import { API_PATHS } from '@/lib/data/schema';
import {
  registerForPushNotificationsAsync,
} from '@/lib/notifications/push';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type PushRegistrationResult = {
  token: string | null;
  saved: boolean;
  error: string | null;
};

/**
 * Request Expo push credentials and persist the token for the signed-in user.
 * Prefer the mobile API (Bearer + request-auth on web); fall back to auth metadata.
 */
export async function registerAndPersistPushToken(
  userId: string,
): Promise<PushRegistrationResult> {
  if (!userId) {
    return { token: null, saved: false, error: 'Sign in required.' };
  }

  const token = await registerForPushNotificationsAsync();
  if (!token) {
    return {
      token: null,
      saved: false,
      error:
        Platform.OS === 'web'
          ? 'Push tokens are registered on iOS/Android devices.'
          : 'Notification permission was not granted.',
    };
  }

  const apiResult = await sitguruApiFetch<{
    ok?: boolean;
    error?: string;
  }>(API_PATHS.registerPushToken, {
    body: {
      expoPushToken: token,
      platform: Platform.OS,
    },
  });

  if (!apiResult.error && apiResult.data) {
    return { token, saved: true, error: null };
  }

  // Local fallback when API base URL is missing or column write failed server-side.
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.updateUser({
        data: {
          expo_push_token: token,
          expo_push_platform: Platform.OS,
          expo_push_updated_at: new Date().toISOString(),
        },
      });

      const profileUpdate = await supabase
        .from('profiles')
        .update({
          expo_push_token: token,
          expo_push_platform: Platform.OS,
          expo_push_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (!profileUpdate.error) {
        return { token, saved: true, error: null };
      }

      // Metadata still saved even if profiles columns are absent.
      return {
        token,
        saved: true,
        error: apiResult.error,
      };
    } catch (error) {
      return {
        token,
        saved: false,
        error:
          error instanceof Error
            ? error.message
            : apiResult.error || 'Unable to save push token.',
      };
    }
  }

  return {
    token,
    saved: false,
    error: apiResult.error || 'Unable to save push token.',
  };
}
