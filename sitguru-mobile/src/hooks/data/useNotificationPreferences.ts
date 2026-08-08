import { useCallback, useEffect, useState } from 'react';

import { sitguruApiFetch } from '@/lib/data/api';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_OPTIONS,
  preferencesFromRow,
  toLegacyPreferenceColumns,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '@/lib/notifications/preferences';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type ApiPreferences = {
  ok?: boolean;
  preferences?: {
    liveWalkUpdates?: boolean;
    chatMediaActivity?: boolean;
    financialTransactions?: boolean;
  };
};

const PREFERENCE_TABLES = [
  'notification_preferences',
  'user_notification_preferences',
] as const;

function fromApiShape(
  prefs: ApiPreferences['preferences'] | null | undefined,
): NotificationPreferences {
  if (!prefs) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  return {
    live_walk_updates:
      typeof prefs.liveWalkUpdates === 'boolean'
        ? prefs.liveWalkUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.live_walk_updates,
    chat_media_activity:
      typeof prefs.chatMediaActivity === 'boolean'
        ? prefs.chatMediaActivity
        : DEFAULT_NOTIFICATION_PREFERENCES.chat_media_activity,
    financial_transactions:
      typeof prefs.financialTransactions === 'boolean'
        ? prefs.financialTransactions
        : DEFAULT_NOTIFICATION_PREFERENCES.financial_transactions,
  };
}

/**
 * Granular push preference matrix with Bearer API sync + Supabase fallback.
 */
export function useNotificationPreferences() {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<NotificationPreferenceKey | null>(
    null,
  );
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      setLoading(false);
      return;
    }

    setLoading(true);

    const api = await sitguruApiFetch<ApiPreferences>(
      '/api/mobile/notification-preferences',
      { method: 'GET' },
    );

    if (api.data?.preferences) {
      setPreferences(fromApiShape(api.data.preferences));
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    for (const table of PREFERENCE_TABLES) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!result.error) {
        setPreferences(preferencesFromRow(result.data as Record<string, unknown> | null));
        setLoading(false);
        return;
      }
    }

    const meta = user.user_metadata?.notification_preferences as
      | Record<string, unknown>
      | undefined;
    if (meta) {
      setPreferences(
        preferencesFromRow({
          live_walk_updates: meta.liveWalkUpdates,
          chat_media_activity: meta.chatMediaActivity,
          financial_transactions: meta.financialTransactions,
        }),
      );
    }

    setLoading(false);
  }, [isAuthenticated, user?.id, user?.user_metadata?.notification_preferences]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (key: NotificationPreferenceKey) => {
      if (!user?.id) return;

      const nextValue = !preferences[key];
      const nextPreferences = {
        ...preferences,
        [key]: nextValue,
      };

      setSavingKey(key);
      setPreferences(nextPreferences);

      const api = await sitguruApiFetch<ApiPreferences>(
        '/api/mobile/notification-preferences',
        {
          method: 'POST',
          body: {
            liveWalkUpdates: nextPreferences.live_walk_updates,
            chatMediaActivity: nextPreferences.chat_media_activity,
            financialTransactions: nextPreferences.financial_transactions,
          },
        },
      );

      if (api.data?.ok || api.data?.preferences) {
        setMessage('Notification preference saved.');
        setSavingKey(null);
        return;
      }

      // Client-side fallback if API base URL is unavailable.
      if (isSupabaseConfigured) {
        const payload = {
          user_id: user.id,
          ...toLegacyPreferenceColumns(nextPreferences),
          updated_at: new Date().toISOString(),
        };

        let saved = false;
        for (const table of PREFERENCE_TABLES) {
          const upsert = await supabase.from(table).upsert(payload);
          if (!upsert.error) {
            saved = true;
            break;
          }
        }

        if (saved) {
          setMessage('Notification preference saved.');
          setSavingKey(null);
          return;
        }
      }

      setPreferences(preferences);
      setMessage(
        api.error ||
          'Notification preference was not saved. Please try again.',
      );
      setSavingKey(null);
    },
    [preferences, user?.id],
  );

  return {
    preferences,
    loading,
    savingKey,
    message,
    options: NOTIFICATION_PREFERENCE_OPTIONS,
    toggle,
    refresh,
    setMessage,
  };
}
