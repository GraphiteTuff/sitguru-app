"use client";

import { useEffect } from "react";

export const COMMUNITY_EVENT_COMPANION_STORAGE_KEY =
  "sitguru_community_event_companion";

export type StoredCommunityEventCompanion = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  state?: string | null;
  savedAt: number;
};

export function readStoredCommunityEventCompanion(): StoredCommunityEventCompanion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMMUNITY_EVENT_COMPANION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCommunityEventCompanion;
    if (!parsed?.slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

type CommunityEventCompanionSeedProps = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  state?: string | null;
};

/** Seeds Rogue with the active event context on detail pages. */
export default function CommunityEventCompanionSeed({
  id,
  slug,
  title,
  city,
  state,
}: CommunityEventCompanionSeedProps) {
  useEffect(() => {
    try {
      sessionStorage.setItem(
        COMMUNITY_EVENT_COMPANION_STORAGE_KEY,
        JSON.stringify({
          id,
          slug,
          title,
          city: city || null,
          state: state || null,
          savedAt: Date.now(),
        } satisfies StoredCommunityEventCompanion),
      );
    } catch {
      // ignore
    }
  }, [city, id, slug, state, title]);

  return null;
}
