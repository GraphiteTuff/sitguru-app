import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type LiveCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

type UseLiveLocationOptions = {
  /** When false, watch stops and last coords are kept. */
  enabled?: boolean;
  /** High-accuracy GPS for active care routes. */
  accuracy?: Location.Accuracy;
  distanceIntervalMeters?: number;
  timeIntervalMs?: number;
  onUpdate?: (coords: LiveCoords) => void;
};

/**
 * expo-location watch for live care tracking.
 * Only request / subscribe while `enabled` (active booked care).
 */
export function useLiveLocation({
  enabled = false,
  accuracy = Location.Accuracy.High,
  distanceIntervalMeters = 8,
  timeIntervalMs = 4000,
  onUpdate,
}: UseLiveLocationOptions = {}) {
  const [coords, setCoords] = useState<LiveCoords | null>(null);
  const [permission, setPermission] =
    useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPermission(Location.PermissionStatus.DENIED);
      setError('Live GPS tracking runs on iOS/Android devices.');
      return false;
    }

    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;

    if (status !== Location.PermissionStatus.GRANTED) {
      const asked = await Location.requestForegroundPermissionsAsync();
      status = asked.status;
    }

    setPermission(status);

    if (status !== Location.PermissionStatus.GRANTED) {
      setError('Location permission is required for live route tracking.');
      return false;
    }

    setError(null);
    return true;
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      if (!enabled) {
        setTracking(false);
        return;
      }

      const ok = await requestPermission();
      if (!ok || cancelled) return;

      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy,
            distanceInterval: distanceIntervalMeters,
            timeInterval: timeIntervalMs,
            mayShowUserSettingsDialog: true,
          },
          (position) => {
            const next: LiveCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            };
            setCoords(next);
            setTracking(true);
            setError(null);
            onUpdateRef.current?.(next);
          },
        );
      } catch {
        if (!cancelled) {
          setTracking(false);
          setError('SitGuru could not start live location updates.');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
      setTracking(false);
    };
  }, [
    accuracy,
    distanceIntervalMeters,
    enabled,
    requestPermission,
    timeIntervalMs,
  ]);

  return {
    coords,
    permission,
    error,
    tracking,
    requestPermission,
  };
}
