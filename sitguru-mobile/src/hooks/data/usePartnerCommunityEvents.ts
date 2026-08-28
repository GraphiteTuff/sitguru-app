import { useCallback, useEffect, useState } from "react";

import { sitguruApiFetch } from "@/lib/data/api";

export type PartnerMobileEvent = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  venue_name: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  image_original_url: string | null;
  pet_friendly: boolean;
  is_free: boolean;
  status: string;
};

export type PartnerAccountSummary = {
  id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
};

export function usePartnerCommunityEvents(tab = "upcoming") {
  const [events, setEvents] = useState<PartnerMobileEvent[]>([]);
  const [partner, setPartner] = useState<PartnerAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await sitguruApiFetch<{
      events?: PartnerMobileEvent[];
      partner?: PartnerAccountSummary;
      error?: string;
    }>(`/api/partners/events?tab=${encodeURIComponent(tab)}`);

    if (result.status === 401) {
      setError(result.error || "Partner sign-in required.");
      setEvents([]);
      setPartner(null);
      setLoading(false);
      return;
    }

    if (result.error || !result.data) {
      setError(result.error || "Unable to load partner events.");
      setEvents([]);
      setLoading(false);
      return;
    }

    setEvents(result.data.events || []);
    setPartner(result.data.partner || null);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, partner, loading, error, reload };
}

export async function fetchPartnerEvent(eventId: string) {
  const result = await sitguruApiFetch<{
    event?: PartnerMobileEvent;
    error?: string;
  }>(`/api/partners/events/${eventId}`);

  if (result.error || !result.data?.event) {
    return { event: null, error: result.error || "Event not found." };
  }

  return { event: result.data.event, error: null };
}

export async function createPartnerEvent(input: Record<string, unknown>) {
  const result = await sitguruApiFetch<{
    event?: PartnerMobileEvent;
    error?: string;
  }>("/api/partners/events", {
    method: "POST",
    body: input,
  });

  if (result.error || !result.data?.event) {
    return { ok: false as const, error: result.error || "Unable to create event." };
  }

  return { ok: true as const, event: result.data.event };
}

export async function savePartnerEvent(
  eventId: string,
  input: Record<string, unknown>,
) {
  const result = await sitguruApiFetch<{
    ok?: boolean;
    event?: PartnerMobileEvent;
    error?: string;
  }>(`/api/partners/events/${eventId}`, {
    method: "PATCH",
    body: input,
  });

  if (result.error || !result.data?.event) {
    return { ok: false as const, error: result.error || "Unable to save event." };
  }

  return { ok: true as const, event: result.data.event };
}

export async function partnerEventAction(
  eventId: string,
  action: "submit" | "cancel" | "duplicate" | "series",
  extra: Record<string, unknown> = {},
) {
  const result = await sitguruApiFetch<{
    ok?: boolean;
    event?: PartnerMobileEvent;
    error?: string;
    createdCount?: number;
  }>(`/api/partners/events/${eventId}`, {
    method: "POST",
    body: { action, ...extra },
  });

  if (result.error) {
    return { ok: false as const, error: result.error };
  }

  if (result.data && "ok" in result.data && result.data.ok === false) {
    return {
      ok: false as const,
      error: (result.data as { error?: string }).error || "Action failed.",
    };
  }

  return { ok: true as const, data: result.data };
}
