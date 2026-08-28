import { useCallback, useEffect, useState } from "react";

export type MobileCommunityEvent = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  image_card_url: string | null;
  image_hero_url: string | null;
  image_original_url: string | null;
  pet_friendly: boolean;
  is_free: boolean;
  partners?: {
    business_name: string | null;
    slug: string | null;
  } | null;
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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.city) params.set("city", filters.city);
      if (filters?.state) params.set("state", filters.state);
      if (filters?.q) params.set("q", filters.q);

      const response = await fetch(`${getApiBaseUrl()}/api/community/events?${params.toString()}`);
      const payload = (await response.json()) as { events?: MobileCommunityEvent[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load events.");
      }

      setEvents(payload.events || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.city, filters?.q, filters?.state]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, loading, error, reload };
}

export async function fetchCommunityEventBySlug(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/community/events?limit=100`);
  const payload = (await response.json()) as { events?: MobileCommunityEvent[] };

  return (payload.events || []).find((event) => event.slug === slug) || null;
}
