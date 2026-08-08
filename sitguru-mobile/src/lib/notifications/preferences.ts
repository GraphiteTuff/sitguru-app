export type NotificationPreferenceKey =
  | 'live_walk_updates'
  | 'chat_media_activity'
  | 'financial_transactions';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  live_walk_updates: true,
  chat_media_activity: true,
  financial_transactions: true,
};

export const NOTIFICATION_PREFERENCE_OPTIONS: {
  key: NotificationPreferenceKey;
  label: string;
  helper: string;
}[] = [
  {
    key: 'live_walk_updates',
    label: 'Live Walk Updates',
    helper: 'Alerts during real-time GPS paths and live care progress.',
  },
  {
    key: 'chat_media_activity',
    label: 'Chat & Media Activity',
    helper: 'Text messages, photos, and voice notes from your Guru.',
  },
  {
    key: 'financial_transactions',
    label: 'Financial Transactions',
    helper: 'Payouts, tips, and payment confirmations when they clear.',
  },
];

/** Legacy column aliases written alongside the focus toggles. */
export function toLegacyPreferenceColumns(prefs: NotificationPreferences) {
  return {
    live_walk_updates: prefs.live_walk_updates,
    chat_media_activity: prefs.chat_media_activity,
    financial_transactions: prefs.financial_transactions,
    pawreport_alerts: prefs.live_walk_updates,
    message_alerts: prefs.chat_media_activity,
    payment_alerts: prefs.financial_transactions,
    booking_alerts: prefs.live_walk_updates,
    referral_alerts: prefs.financial_transactions,
  };
}

export function preferencesFromRow(
  row: Record<string, unknown> | null | undefined,
): NotificationPreferences {
  if (!row) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  const read = (keys: string[], fallback: boolean) => {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'boolean') return value;
      if (value === 1 || value === '1' || value === 'true') return true;
      if (value === 0 || value === '0' || value === 'false') return false;
    }
    return fallback;
  };

  return {
    live_walk_updates: read(
      ['live_walk_updates', 'pawreport_alerts', 'walk_alerts'],
      DEFAULT_NOTIFICATION_PREFERENCES.live_walk_updates,
    ),
    chat_media_activity: read(
      ['chat_media_activity', 'message_alerts', 'chat_alerts'],
      DEFAULT_NOTIFICATION_PREFERENCES.chat_media_activity,
    ),
    financial_transactions: read(
      [
        'financial_transactions',
        'payment_alerts',
        'payout_alerts',
        'tip_alerts',
      ],
      DEFAULT_NOTIFICATION_PREFERENCES.financial_transactions,
    ),
  };
}
