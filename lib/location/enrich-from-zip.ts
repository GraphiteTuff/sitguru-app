/**
 * Persist missing city/state (and optional coords) from ZIP onto gurus/profiles.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  cleanZipCode,
  resolveLocationParts,
  type ZipLocation,
} from "@/lib/location/zip-lookup";

type LocationSource = {
  city?: string | null;
  state?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  zip_code?: string | null;
  service_zip?: string | null;
  service_zip_code?: string | null;
  postal_code?: string | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
};

function firstZip(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const zip = cleanZipCode(value);
    if (zip.length === 5) return zip;
  }
  return "";
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

export async function enrichAndPersistLocationFromZip(options: {
  guruId?: string | null;
  profileId?: string | null;
  guru?: LocationSource | null;
  profile?: LocationSource | null;
}) {
  const guru = options.guru || {};
  const profile = options.profile || {};

  const zip = firstZip(
    guru.service_zip,
    guru.service_zip_code,
    guru.zip_code,
    guru.postal_code,
    profile.service_zip,
    profile.service_zip_code,
    profile.zip_code,
    profile.postal_code,
  );

  const resolved = await resolveLocationParts({
    city: firstText(guru.city, profile.city),
    state: firstText(guru.state, profile.state),
    serviceCity: firstText(guru.service_city, profile.service_city),
    serviceState: firstText(guru.service_state, profile.service_state),
    zip,
  });

  if (!resolved.resolvedFromZip || !resolved.city || !resolved.state) {
    return resolved;
  }

  const locationPatch = {
    city: resolved.city,
    state: resolved.state,
    service_city: resolved.city,
    service_state: resolved.state,
    zip_code: resolved.zip || zip || null,
    service_zip: resolved.zip || zip || null,
    ...(resolved.latitude != null
      ? { service_latitude: resolved.latitude }
      : {}),
    ...(resolved.longitude != null
      ? { service_longitude: resolved.longitude }
      : {}),
  };

  try {
    if (options.guruId) {
      await supabaseAdmin
        .from("gurus")
        .update(locationPatch)
        .eq("id", options.guruId);
    }
  } catch {
    // Best-effort write-back.
  }

  try {
    if (options.profileId) {
      await supabaseAdmin
        .from("profiles")
        .update(locationPatch)
        .eq("id", options.profileId);
    }
  } catch {
    // Best-effort write-back.
  }

  return resolved;
}

export type { ZipLocation };
