import { useCallback, useEffect, useMemo, useState } from 'react';

import { useBookings } from '@/hooks/data/useBookings';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { useWalkSession } from '@/hooks/data/useWalkSession';
import { sitguruApiFetch } from '@/lib/data/api';
import {
  asNumber,
  asString,
  firstString,
  type RecordRow,
} from '@/lib/data/fields';
import { API_PATHS, REALTIME_CHANNELS, TABLES } from '@/lib/data/schema';
import { useAuth } from '@/hooks/useAuth';

export type LiveCareBadge = {
  id: string;
  label: string;
  kind: 'photo' | 'water' | 'potty' | 'note' | 'status' | 'other';
};

export type LiveCareLog = {
  id: string;
  title: string;
  detail: string;
  createdAt: Date | null;
  kind: LiveCareBadge['kind'];
  photoUrl: string | null;
};

export type PawReportLiveSnapshot = {
  bookingId: string | null;
  petName: string;
  guruName: string;
  statusLabel: string;
  isLive: boolean;
  distanceMiles: number;
  durationMinutes: number;
  latitude: number | null;
  longitude: number | null;
  message: string;
  badges: LiveCareBadge[];
  logs: LiveCareLog[];
  photos: Array<{ id: string; url: string; createdAt: Date | null }>;
  photoCount: number;
};

type LiveStreamPayload = {
  bookingId?: string;
  eventType?: string;
  data?: {
    message?: string;
    latitude?: number;
    longitude?: number;
    currentMetrics?: {
      distanceMiles?: number;
      durationMinutes?: number;
    };
    petName?: string;
  };
};

function kindFromUpdate(row: RecordRow): LiveCareBadge['kind'] {
  const raw = firstString(
    row,
    ['update_type', 'type', 'event_type', 'kind', 'category'],
    '',
  ).toLowerCase();

  if (raw.includes('photo') || raw.includes('image')) return 'photo';
  if (raw.includes('water')) return 'water';
  if (raw.includes('potty') || raw.includes('pee') || raw.includes('poop')) {
    return 'potty';
  }
  if (raw.includes('note') || raw.includes('message')) return 'note';
  if (raw.includes('status') || raw.includes('walk') || raw.includes('start')) {
    return 'status';
  }
  return 'other';
}

function titleFromUpdate(row: RecordRow, kind: LiveCareBadge['kind']) {
  const explicit = firstString(row, ['title', 'label', 'headline']);
  if (explicit) return explicit;
  if (kind === 'photo') return 'Photo added';
  if (kind === 'water') return 'Water refreshed';
  if (kind === 'potty') return 'Potty break';
  if (kind === 'note') return 'Care note';
  if (kind === 'status') return 'Status update';
  return 'Care update';
}

function buildBadges(logs: LiveCareLog[]): LiveCareBadge[] {
  const photoCount = logs.filter((item) => item.kind === 'photo').length;
  const waterCount = logs.filter((item) => item.kind === 'water').length;
  const pottyCount = logs.filter((item) => item.kind === 'potty').length;
  const noteCount = logs.filter((item) => item.kind === 'note').length;

  const badges: LiveCareBadge[] = [];
  if (photoCount > 0) {
    badges.push({
      id: 'photos',
      kind: 'photo',
      label: `${photoCount} new photo${photoCount === 1 ? '' : 's'}`,
    });
  }
  if (waterCount > 0) {
    badges.push({
      id: 'water',
      kind: 'water',
      label: waterCount === 1 ? 'Water refreshed' : `${waterCount} water updates`,
    });
  }
  if (pottyCount > 0) {
    badges.push({
      id: 'potty',
      kind: 'potty',
      label: `${pottyCount} potty break${pottyCount === 1 ? '' : 's'}`,
    });
  }
  if (noteCount > 0) {
    badges.push({
      id: 'notes',
      kind: 'note',
      label: `${noteCount} care note${noteCount === 1 ? '' : 's'}`,
    });
  }
  return badges;
}

/**
 * Pet Parent live PawReport tracker — Bearer walk snapshot + RLS updates.
 */
export function usePawReportLive(bookingIdParam?: string | null) {
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading } = useBookings();
  const preferredBookingId = useMemo(() => {
    if (bookingIdParam) return bookingIdParam;
    const active = bookings.find((booking) =>
      ['in_progress', 'active', 'confirmed', 'accepted', 'paid'].includes(
        booking.status,
      ),
    );
    return active?.id ?? bookings[0]?.id ?? null;
  }, [bookingIdParam, bookings]);

  const { loadVisitUpdates, loadVisitSession } =
    useWalkSession(preferredBookingId);
  const [stream, setStream] = useState<LiveStreamPayload | null>(null);
  const [updates, setUpdates] = useState<RecordRow[]>([]);
  const [session, setSession] = useState<RecordRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async (silent = false) => {
    if (!preferredBookingId) {
      setLoading(false);
      setStream(null);
      setUpdates([]);
      setSession(null);
      return;
    }

    if (!silent) setLoading(true);

    const [snapshotResult, updatesResult, sessionResult] = await Promise.all([
      sitguruApiFetch<LiveStreamPayload>(
        `${API_PATHS.walkStream(preferredBookingId)}?format=json`,
        { method: 'GET' },
      ),
      loadVisitUpdates(),
      loadVisitSession(),
    ]);

    if (snapshotResult.data) {
      setStream(snapshotResult.data);
      setError(null);
    } else if (snapshotResult.error) {
      setError(snapshotResult.error);
    }

    setUpdates(updatesResult.updates);
    setSession(sessionResult.session);
    setLoading(false);
  }, [loadVisitSession, loadVisitUpdates, preferredBookingId]);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!preferredBookingId) return;
    const timer = setInterval(() => void refresh(true), 20_000);
    return () => clearInterval(timer);
  }, [preferredBookingId, refresh]);

  useRealtimeSubscription({
    channelName: preferredBookingId
      ? `${REALTIME_CHANNELS.bookingRoom(preferredBookingId)}:updates`
      : `pawreport-idle-${user?.id ?? 'anon'}`,
    enabled: Boolean(preferredBookingId && user?.id),
    table: TABLES.bookingVisitUpdates,
    filter: preferredBookingId
      ? `booking_id=eq.${preferredBookingId}`
      : undefined,
    onChange: () => {
      void refresh(true);
    },
  });

  useRealtimeSubscription({
    channelName: preferredBookingId
      ? `${REALTIME_CHANNELS.bookingRoom(preferredBookingId)}:sessions`
      : `pawreport-idle-session-${user?.id ?? 'anon'}`,
    enabled: Boolean(preferredBookingId && user?.id),
    table: TABLES.bookingVisitSessions,
    filter: preferredBookingId
      ? `booking_id=eq.${preferredBookingId}`
      : undefined,
    onChange: () => {
      void refresh(true);
    },
  });

  const booking = bookings.find((item) => item.id === preferredBookingId);

  const logs = useMemo<LiveCareLog[]>(() => {
    return updates
      .map((row, index) => {
        const kind = kindFromUpdate(row);
        const createdRaw = firstString(row, [
          'created_at',
          'updated_at',
          'timestamp',
          'recorded_at',
        ]);
        const photoUrl =
          firstString(row, [
            'photo_url',
            'image_url',
            'media_url',
            'attachment_url',
          ]) || null;
        const detail = firstString(
          row,
          ['note', 'message', 'body', 'content', 'description'],
          titleFromUpdate(row, kind),
        );
        const detailLooksLikeUrl = /^https?:\/\//i.test(detail);

        return {
          id: asString(row.id) || `update-${index}`,
          kind: photoUrl || detailLooksLikeUrl ? 'photo' : kind,
          title: titleFromUpdate(
            row,
            photoUrl || detailLooksLikeUrl ? 'photo' : kind,
          ),
          detail,
          photoUrl: photoUrl || (detailLooksLikeUrl ? detail : null),
          createdAt: createdRaw ? new Date(createdRaw) : null,
        };
      })
      .sort(
        (a, b) =>
          (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
  }, [updates]);

  const photos = useMemo(
    () =>
      logs
        .filter((log) => Boolean(log.photoUrl))
        .map((log) => ({
          id: log.id,
          url: log.photoUrl as string,
          createdAt: log.createdAt,
        })),
    [logs],
  );

  const snapshot = useMemo<PawReportLiveSnapshot>(() => {
    const metrics = stream?.data?.currentMetrics;
    const sessionDistance = asNumber(
      session?.distance_miles ??
        session?.total_distance_miles ??
        session?.distance,
    );
    const startedAtRaw = firstString(session ?? {}, [
      'started_at',
      'start_at',
      'created_at',
    ]);
    const startedAt = startedAtRaw ? new Date(startedAtRaw).getTime() : null;
    const elapsedFromSession =
      startedAt && Number.isFinite(startedAt)
        ? Math.max(0, (now - startedAt) / 60_000)
        : 0;

    const distanceMiles = Number(
      metrics?.distanceMiles ?? sessionDistance ?? 0,
    );
    const durationMinutes = Number(
      metrics?.durationMinutes ?? elapsedFromSession ?? 0,
    );

    const liveTypes = new Set([
      'WALK_START',
      'GPS_PING',
      'SNAPSHOT',
      'POTTY_PEE',
      'POTTY_POOP',
      'BREAK_END',
      'BREAK_START',
    ]);
    const isLive = Boolean(
      stream?.eventType &&
        liveTypes.has(stream.eventType) &&
        stream.eventType !== 'WALK_END',
    );

    return {
      bookingId: preferredBookingId,
      petName:
        stream?.data?.petName ||
        booking?.petName ||
        firstString(session ?? {}, ['pet_name'], 'Your pet'),
      guruName: booking?.guruName || 'Your Guru',
      statusLabel: isLive
        ? 'Live now'
        : stream?.data?.message ||
          (preferredBookingId ? 'Waiting for care to start' : 'No active care'),
      isLive,
      distanceMiles: Number(distanceMiles.toFixed(1)),
      durationMinutes: Number(durationMinutes.toFixed(0)),
      latitude:
        typeof stream?.data?.latitude === 'number'
          ? stream.data.latitude
          : null,
      longitude:
        typeof stream?.data?.longitude === 'number'
          ? stream.data.longitude
          : null,
      message:
        stream?.data?.message ||
        logs[0]?.detail ||
        'Live metrics appear once your Guru starts care.',
      badges: buildBadges(logs),
      logs,
      photos,
      photoCount: photos.length,
    };
  }, [booking, logs, now, photos, preferredBookingId, session, stream]);

  return {
    snapshot,
    loading: loading || bookingsLoading,
    error,
    refresh: () => refresh(false),
    bookingId: preferredBookingId,
  };
}
