import { useCallback, useEffect, useState } from "react";

import { sitguruApiFetch } from "@/lib/data/api";

export type MobileCommunityEvent = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description?: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  venue_name: string | null;
  address_line_1?: string | null;
  city: string | null;
  state: string | null;
  postal_code?: string | null;
  image_card_url: string | null;
  image_hero_url: string | null;
  image_original_url: string | null;
  pet_friendly: boolean;
  is_free: boolean;
  status?: string;
  partners?: {
    business_name: string | null;
    slug: string | null;
  } | null;
};

export type MobileAttendanceCounts = {
  petParents: number;
  gurus: number;
  ambassadors: number;
  totalGoing: number;
};

function getApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_SITGURU_API_URL ||
    process.env.EXPO_PUBLIC_SITGURU_WEB_URL ||
    "https://www.sitguru.com"
  ).replace(/\/$/, "");
}

export function useCommunityEvents(filters?: {
  city?: string;
  state?: string;
  q?: string;
}) {
  const [events, setEvents] = useState<MobileCommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterCity = filters?.city;
  const filterQuery = filters?.q;
  const filterState = filters?.state;
  const fetchReload = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCity) params.set("city", filterCity);
    if (filterState) params.set("state", filterState);
    if (filterQuery) params.set("q", filterQuery);

    return fetch(
        `${getApiBaseUrl()}/api/community/events?${params.toString()}`,
      ).then(async (response) => {
      const payload = (await response.json()) as {
        events?: MobileCommunityEvent[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load events.");
      }

      setEvents(payload.events || []);
    }).catch((loadError) => {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load events.",
      );
      setEvents([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [filterCity, filterQuery, filterState]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchReload();
  }, [fetchReload, setLoading, setError]);

  const filterKey = JSON.stringify([filterCity, filterState, filterQuery]);
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    void fetchReload();
  }, [fetchReload]);

  return { events, loading, error, reload };
}

export async function fetchCommunityEventBySlug(slug: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/community/events?slug=${encodeURIComponent(slug)}`,
  );
  const payload = (await response.json()) as {
    event?: MobileCommunityEvent | null;
    events?: MobileCommunityEvent[];
  };

  if (payload.event) return payload.event;
  return (payload.events || []).find((event) => event.slug === slug) || null;
}

export function useEventAttendance(eventId?: string) {
  const [counts, setCounts] = useState<MobileAttendanceCounts>({
    petParents: 0,
    gurus: 0,
    ambassadors: 0,
    totalGoing: 0,
  });
  const [going, setGoing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    const result = await sitguruApiFetch<{
      counts?: MobileAttendanceCounts;
      mine?: { status?: string } | null;
    }>(`/api/community/events/${eventId}/attendance`, {
      method: "GET",
      auth: true,
    });

    // Public counts still useful when signed out
    if (result.status === 401 || result.error?.includes("Sign in")) {
      const publicResult = await sitguruApiFetch<{
        counts?: MobileAttendanceCounts;
      }>(`/api/community/events/${eventId}/attendance`, {
        method: "GET",
        auth: false,
      });
      if (publicResult.data?.counts) setCounts(publicResult.data.counts);
      setGoing(false);
      setLoading(false);
      return;
    }

    if (result.data?.counts) setCounts(result.data.counts);
    setGoing(result.data?.mine?.status === "going");
    if (result.error) setError(result.error);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external community-event detail fetch
    void reload();
  }, [reload]);

  const setAttendance = useCallback(
    async (status: "going" | "cancelled") => {
      if (!eventId) return { ok: false as const, error: "Missing event." };

      const result = await sitguruApiFetch<{
        counts?: MobileAttendanceCounts;
        attendance?: { status?: string };
        error?: string;
      }>(`/api/community/events/${eventId}/attendance`, {
        method: "POST",
        body: { status },
      });

      if (result.status === 401) {
        return { ok: false as const, error: "Sign in to say you're going." };
      }

      if (result.error || !result.data) {
        return {
          ok: false as const,
          error: result.error || "Unable to update RSVP.",
        };
      }

      if (result.data.counts) setCounts(result.data.counts);
      setGoing(status === "going");
      return { ok: true as const };
    },
    [eventId],
  );

  return { counts, going, loading, error, reload, setAttendance };
}
