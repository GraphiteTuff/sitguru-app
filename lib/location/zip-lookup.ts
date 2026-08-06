/**
 * Shared US ZIP → city/state lookup for SitGuru.
 * Uses Zippopotam with a small in-memory cache for server renders.
 */

export type ZipLocation = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type ZippopotamPlace = {
  "place name"?: string;
  state?: string;
  "state abbreviation"?: string;
  latitude?: string;
  longitude?: string;
};

type ZippopotamResponse = {
  "post code"?: string;
  places?: ZippopotamPlace[];
};

const zipCache = new Map<string, ZipLocation | null>();

export function cleanZipCode(value?: string | null) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

export function formatCityState(
  city?: string | null,
  state?: string | null,
  zip?: string | null,
) {
  const cleanCity = String(city || "").trim();
  const cleanState = String(state || "").trim();
  const cleanZip = cleanZipCode(zip);
  const cityState = [cleanCity, cleanState].filter(Boolean).join(", ");

  if (cityState && cleanZip) return `${cityState} ${cleanZip}`;
  if (cityState) return cityState;
  if (cleanZip) return cleanZip;
  return "";
}

/** Resolve city/state for a US ZIP. Returns null when unavailable. */
export async function lookupZipLocation(
  zipInput?: string | null,
): Promise<ZipLocation | null> {
  const zip = cleanZipCode(zipInput);
  if (zip.length !== 5) return null;

  if (zipCache.has(zip)) {
    return zipCache.get(zip) || null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) {
      zipCache.set(zip, null);
      return null;
    }

    const data = (await response.json()) as ZippopotamResponse;
    const place = data.places?.[0];
    const city = String(place?.["place name"] || "").trim();
    const state = String(
      place?.["state abbreviation"] || place?.state || "",
    ).trim();

    if (!city || !state) {
      zipCache.set(zip, null);
      return null;
    }

    const latitude = Number(place?.latitude);
    const longitude = Number(place?.longitude);

    const result: ZipLocation = {
      zip,
      city,
      state,
      stateName: String(place?.state || "").trim() || undefined,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
    };

    zipCache.set(zip, result);
    return result;
  } catch {
    zipCache.set(zip, null);
    return null;
  }
}

/**
 * Prefer explicit city/state; if missing and ZIP is present, resolve from ZIP.
 */
export async function resolveLocationParts(input: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  serviceCity?: string | null;
  serviceState?: string | null;
}) {
  const zip = cleanZipCode(input.zip);
  let city = String(input.serviceCity || input.city || "").trim();
  let state = String(input.serviceState || input.state || "").trim();
  let resolvedFromZip = false;
  let coords: { latitude: number | null; longitude: number | null } | null =
    null;

  if ((!city || !state) && zip.length === 5) {
    const lookup = await lookupZipLocation(zip);
    if (lookup) {
      city = city || lookup.city;
      state = state || lookup.state;
      resolvedFromZip = true;
      coords = {
        latitude: lookup.latitude ?? null,
        longitude: lookup.longitude ?? null,
      };
    }
  }

  return {
    city,
    state,
    zip: zip.length === 5 ? zip : "",
    label: formatCityState(city, state, zip) || "Location not listed",
    resolvedFromZip,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  };
}
