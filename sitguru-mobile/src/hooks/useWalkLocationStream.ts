import { useCallback, useEffect, useRef } from 'react';

import { useLatestRef } from '@/hooks/useLatestRef';

import {
  createPingThrottle,
  pingWalkCoordinate,
  setActiveWalkBookingId,
  startBackgroundWalkUpdates,
  stopBackgroundWalkUpdates,
  WALK_PING_MIN_INTERVAL_MS,
} from '@/lib/location/background-walk-task';
import {
  useLiveLocation,
  type LiveCoords,
} from '@/hooks/useLiveLocation';

type UseWalkLocationStreamOptions = {
  bookingId?: string | null;
  enabled?: boolean;
  /** Minimum gap between walk API pings (battery guard). */
  minPingIntervalMs?: number;
  onUpdate?: (coords: LiveCoords) => void;
  onPermissionDenied?: (message: string) => void;
  onStreamError?: (message: string) => void;
};

/**
 * Foreground GPS watch + throttled `ping_coordinate` posts to the walk API.
 * Also attempts background updates when the OS grants them.
 */
export function useWalkLocationStream({
  bookingId = null,
  enabled = false,
  minPingIntervalMs = WALK_PING_MIN_INTERVAL_MS,
  onUpdate,
  onPermissionDenied,
  onStreamError,
}: UseWalkLocationStreamOptions) {
  const throttleRef = useRef(createPingThrottle(minPingIntervalMs));
  const bookingIdRef = useLatestRef(bookingId);
  const onPermissionDeniedRef = useLatestRef(onPermissionDenied);
  const onStreamErrorRef = useLatestRef(onStreamError);
  const onUpdateRef = useLatestRef(onUpdate);

  useEffect(() => {
    throttleRef.current = createPingThrottle(minPingIntervalMs);
  }, [minPingIntervalMs]);

  const streamCoords = useCallback(async (coords: LiveCoords) => {
    onUpdateRef.current?.(coords);

    const id = bookingIdRef.current;
    if (!id) return;

    await throttleRef.current.maybeRun(async () => {
      const result = await pingWalkCoordinate({
        bookingId: id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });

      if (result.error) {
        onStreamErrorRef.current?.(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latest-refs are stable; do not restart the GPS stream
  }, []);

  const location = useLiveLocation({
    enabled,
    // Slightly slower watch; throttle still caps API traffic.
    timeIntervalMs: minPingIntervalMs,
    distanceIntervalMeters: 20,
    onUpdate: (coords) => {
      void streamCoords(coords);
    },
  });

  useEffect(() => {
    if (location.error) {
      onPermissionDeniedRef.current?.(location.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission callback is kept on a latest-ref
  }, [location.error]);

  useEffect(() => {
    let cancelled = false;

    async function syncBackground() {
      if (!enabled || !bookingId) {
        setActiveWalkBookingId(null);
        await stopBackgroundWalkUpdates();
        return;
      }

      setActiveWalkBookingId(bookingId);
      const result = await startBackgroundWalkUpdates(bookingId);
      if (cancelled) return;

      if (!result.ok && result.error) {
        // Soft signal — foreground stream can still work.
        onPermissionDeniedRef.current?.(result.error);
      }
    }

    void syncBackground();

    return () => {
      cancelled = true;
      void stopBackgroundWalkUpdates();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission callback is kept on a latest-ref
  }, [bookingId, enabled]);

  return {
    ...location,
    bookingId: bookingId || null,
  };
}
