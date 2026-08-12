/**
 * Persist missing city/state/coords from ZIP onto gurus/profiles.
 * Used so bookable Gurus always have map-ready coordinates.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  cleanZipCode,
  lookupZipLocation,
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
  latitude?: number | string | null;
  longitude?: number | string | null;
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

function asFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function hasUsableCoordinates(source: LocationSource) {
  const latitude =
    asFiniteNumber(source.service_latitude) ?? asFiniteNumber(source.latitude);
  const longitude =
    asFiniteNumber(source.service_longitude) ??
    asFiniteNumber(source.longitude);

  return (
    latitude !== null &&
    longitude !== null &&
    latitude !== 0 &&
    longitude !== 0 &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export async function enrichAndPersistLocationFromZip(options: {
  guruId?: string | null;
  profileId?: string | null;
  guru?: LocationSource | null;
  profile?: LocationSource | null;
  /** When true, always try to fill missing lat/lng from ZIP (bookable path). */
  ensureMapCoordinates?: boolean;
}) {
  const guru = options.guru || {};
  const profile = options.profile || {};
  const ensureMapCoordinates = options.ensureMapCoordinates === true;

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

  const locationPatch: Record<string, string | number | null> = {};

  if (resolved.resolvedFromZip && resolved.city && resolved.state) {
    locationPatch.city = resolved.city;
    locationPatch.state = resolved.state;
    locationPatch.service_city = resolved.city;
    locationPatch.service_state = resolved.state;
    locationPatch.zip_code = resolved.zip || zip || null;
    locationPatch.service_zip = resolved.zip || zip || null;
  }

  const needsCoords =
    ensureMapCoordinates || !hasUsableCoordinates(guru) || !hasUsableCoordinates(profile);

  if (needsCoords) {
    // Prefer already-known service coords, then sync both lat pairs.
    const existingLatitude =
      asFiniteNumber(guru.service_latitude) ??
      asFiniteNumber(guru.latitude) ??
      asFiniteNumber(profile.service_latitude) ??
      asFiniteNumber(profile.latitude) ??
      asFiniteNumber(resolved.latitude);
    const existingLongitude =
      asFiniteNumber(guru.service_longitude) ??
      asFiniteNumber(guru.longitude) ??
      asFiniteNumber(profile.service_longitude) ??
      asFiniteNumber(profile.longitude) ??
      asFiniteNumber(resolved.longitude);

    let latitude = existingLatitude;
    let longitude = existingLongitude;

    if (
      (latitude === null || longitude === null) &&
      zip.length === 5
    ) {
      const lookup = await lookupZipLocation(zip);
      latitude = asFiniteNumber(lookup?.latitude);
      longitude = asFiniteNumber(lookup?.longitude);

      if (!locationPatch.city && lookup?.city) {
        locationPatch.city = lookup.city;
        locationPatch.service_city = lookup.city;
      }
      if (!locationPatch.state && lookup?.state) {
        locationPatch.state = lookup.state;
        locationPatch.service_state = lookup.state;
      }
      if (zip) {
        locationPatch.zip_code = zip;
        locationPatch.service_zip = zip;
      }
    }

    if (
      latitude !== null &&
      longitude !== null &&
      latitude !== 0 &&
      longitude !== 0
    ) {
      locationPatch.service_latitude = latitude;
      locationPatch.service_longitude = longitude;
      locationPatch.latitude = latitude;
      locationPatch.longitude = longitude;
    }
  }

  if (Object.keys(locationPatch).length === 0) {
    return resolved;
  }

  try {
    if (options.guruId) {
      await supabaseAdmin
        .from("gurus")
        .update({ ...locationPatch, updated_at: new Date().toISOString() })
        .eq("id", options.guruId);
    }
  } catch {
    // Best-effort write-back.
  }

  try {
    if (options.profileId) {
      await supabaseAdmin
        .from("profiles")
        .update({ ...locationPatch, updated_at: new Date().toISOString() })
        .eq("id", options.profileId);
    }
  } catch {
    // Best-effort write-back.
  }

  return {
    ...resolved,
    latitude:
      asFiniteNumber(locationPatch.latitude) ?? resolved.latitude ?? null,
    longitude:
      asFiniteNumber(locationPatch.longitude) ?? resolved.longitude ?? null,
  };
}

export type { ZipLocation };
