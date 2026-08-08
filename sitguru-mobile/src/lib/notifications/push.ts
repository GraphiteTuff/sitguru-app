import { NativePermissionCopy } from '@/constants/native-permissions';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Lock-screen / notification-center quick actions for booking requests. */
export const BOOKING_REQUEST_CATEGORY = 'booking_request';
export const ACCEPT_BOOKING_ACTION = 'ACCEPT_BOOKING';
export const DECLINE_BOOKING_ACTION = 'DECLINE_BOOKING';
export const OPEN_BOOKING_ACTION = 'OPEN_BOOKING';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('sitguru-bookings', {
    name: 'Booking requests',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0D5C3A',
  });

  await Notifications.setNotificationChannelAsync('sitguru-messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
  });

  await Notifications.setNotificationChannelAsync('sitguru-care', {
    name: 'Care updates',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Registers Accept / Decline actions shown on the lock screen (iOS)
 * and as action buttons on Android notifications.
 */
export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(BOOKING_REQUEST_CATEGORY, [
    {
      identifier: ACCEPT_BOOKING_ACTION,
      buttonTitle: 'Accept Booking',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: DECLINE_BOOKING_ACTION,
      buttonTitle: 'Decline',
      options: {
        opensAppToForeground: true,
        isDestructive: true,
      },
    },
    {
      identifier: OPEN_BOOKING_ACTION,
      buttonTitle: 'View',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidChannels();
  await registerNotificationCategories();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    status = asked.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

/** Product copy used for in-app permission education (Info.plist owns the OS dialog). */
export function getPushPermissionRationale() {
  return NativePermissionCopy.notifications;
}

/**
 * Dev / QA helper: schedule a local booking request with Accept on lock screen.
 */
export async function scheduleDemoBookingRequestNotification(input?: {
  bookingId?: string;
  petName?: string;
}) {
  await ensureAndroidChannels();
  await registerNotificationCategories();

  const bookingId = input?.bookingId ?? 'demo-booking';
  const petName = input?.petName ?? 'Scout';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New booking request',
      body: `${petName} needs care — Accept Booking from the lock screen.`,
      data: {
        type: 'booking_request',
        bookingId,
        href: '/guru-requests',
      },
      categoryIdentifier: BOOKING_REQUEST_CATEGORY,
      sound: true,
      ...(Platform.OS === 'android'
        ? { channelId: 'sitguru-bookings' }
        : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export type PushActionHandler = (input: {
  actionId: string;
  bookingId: string | null;
  href: string | null;
}) => void;

export function subscribeToNotificationResponses(handler: PushActionHandler) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as Record<
      string,
      unknown
    >;

    const bookingId =
      typeof data.bookingId === 'string'
        ? data.bookingId
        : typeof data.booking_id === 'string'
          ? data.booking_id
          : null;

    const href =
      typeof data.href === 'string'
        ? data.href
        : typeof data.url === 'string'
          ? data.url
          : null;

    handler({ actionId, bookingId, href });
  });
}
