import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { sitguruApiFetch } from '@/lib/data/api';
import { API_PATHS } from '@/lib/data/schema';

/** TaskManager task name — must stay stable across app launches. */
export const SITGURU_WALK_LOCATION_TASK = 'sitguru-background-walk-location';

const ACTIVE_BOOKING_KEY = 'sitguru.activeWalkBookingId';
const LAST_PING_AT_KEY = 'sitguru.walkLastPingAt';

/** Default throttle for battery-safe telemetry (~12s). */
export const WALK_PING_MIN_INTERVAL_MS = 12_000;

type MemoryStore = {
  bookingId: string | null;
  lastPingAt: number;
};

const memoryStore: MemoryStore = {
  bookingId: null,
  lastPingAt: 0,
};

export function setActiveWalkBookingId(bookingId: string | null) {
  memoryStore.bookingId = bookingId;
}

export function getActiveWalkBookingId() {
  return memoryStore.bookingId;
}

export function createPingThrottle(minIntervalMs = WALK_PING_MIN_INTERVAL_MS) {
  let lastSentAt = 0;
  let inFlight = false;

  return {
    async maybeRun(run: () => Promise<void>) {
      const now = Date.now();
      if (inFlight || now - lastSentAt < minIntervalMs) {
        return false;
      }

      inFlight = true;
      try {
        await run();
        lastSentAt = Date.now();
        memoryStore.lastPingAt = lastSentAt;
        return true;
      } finally {
        inFlight = false;
      }
    },
    reset() {
      lastSentAt = 0;
      inFlight = false;
    },
  };
}

export async function pingWalkCoordinate(input: {
  bookingId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}) {
  return sitguruApiFetch<{ ok?: boolean; error?: string }>(
    API_PATHS.walkAction(input.bookingId),
    {
      body: {
        action: 'ping_coordinate',
        lat: input.latitude,
        lng: input.longitude,
        accuracy: input.accuracy ?? null,
      },
    },
  );
}

/**
 * Define once at module load. Task handlers must stay outside React trees.
 * Safe no-op on web / when TaskManager is unavailable.
 */
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(SITGURU_WALK_LOCATION_TASK)) {
  TaskManager.defineTask(SITGURU_WALK_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      return;
    }

    const bookingId = memoryStore.bookingId;
    if (!bookingId) return;

    const payload = data as {
      locations?: Location.LocationObject[];
    };

    const latest = payload.locations?.[payload.locations.length - 1];
    if (!latest) return;

    const now = Date.now();
    if (now - memoryStore.lastPingAt < WALK_PING_MIN_INTERVAL_MS) {
      return;
    }

    memoryStore.lastPingAt = now;

    await pingWalkCoordinate({
      bookingId,
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      accuracy: latest.coords.accuracy,
    });
  });
}

export async function startBackgroundWalkUpdates(bookingId: string) {
  if (Platform.OS === 'web') {
    return { ok: false as const, error: 'Background GPS runs on iOS/Android.' };
  }

  setActiveWalkBookingId(bookingId);

  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    return {
      ok: false as const,
      error: 'Location permission is required for live route tracking.',
    };
  }

  const background = await Location.getBackgroundPermissionsAsync();
  let backgroundStatus = background.status;

  if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
    const asked = await Location.requestBackgroundPermissionsAsync();
    backgroundStatus = asked.status;
  }

  if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
    return {
      ok: false as const,
      error:
        'Background location is off. SitGuru will keep streaming while the care screen is open.',
    };
  }

  const started = await Location.hasStartedLocationUpdatesAsync(
    SITGURU_WALK_LOCATION_TASK,
  );

  if (!started) {
    await Location.startLocationUpdatesAsync(SITGURU_WALK_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: WALK_PING_MIN_INTERVAL_MS,
      distanceInterval: 20,
      deferredUpdatesInterval: WALK_PING_MIN_INTERVAL_MS * 2,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'SitGuru live care',
        notificationBody: 'Sharing your route with the Pet Parent during this visit.',
        notificationColor: '#0D5C3A',
      },
      pausesUpdatesAutomatically: true,
      activityType: Location.ActivityType.Fitness,
    });
  }

  return { ok: true as const, error: null };
}

export async function stopBackgroundWalkUpdates() {
  setActiveWalkBookingId(null);

  if (Platform.OS === 'web') return;

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(
      SITGURU_WALK_LOCATION_TASK,
    );
    if (started) {
      await Location.stopLocationUpdatesAsync(SITGURU_WALK_LOCATION_TASK);
    }
  } catch {
    // Ignore teardown races when the task was never started.
  }
}

/** Keep keys referenced so SecureStore adapters can swap in later without API churn. */
export const WalkLocationStorageKeys = {
  ACTIVE_BOOKING_KEY,
  LAST_PING_AT_KEY,
} as const;
