export type CommunityLocationPreference = {
  zip?: string;
  county?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  source?: "search" | "profile" | "manual" | "default" | "device";
};

const ZIP_KEY = "sitguru_home_zip";
const COUNTY_KEY = "sitguru_home_county";
const CITY_KEY = "sitguru_home_city";
const STATE_KEY = "sitguru_home_state";
const SOURCE_KEY = "sitguru_home_location_source";
const LAT_KEY = "sitguru_home_latitude";
const LNG_KEY = "sitguru_home_longitude";

function readStoredNumber(key: string) {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function readCommunityLocationPreference(): CommunityLocationPreference {
  if (typeof window === "undefined") return {};

  return {
    zip: window.localStorage.getItem(ZIP_KEY) || undefined,
    county: window.localStorage.getItem(COUNTY_KEY) || undefined,
    city: window.localStorage.getItem(CITY_KEY) || undefined,
    state: window.localStorage.getItem(STATE_KEY) || undefined,
    latitude: readStoredNumber(LAT_KEY),
    longitude: readStoredNumber(LNG_KEY),
    source:
      (window.localStorage.getItem(SOURCE_KEY) as CommunityLocationPreference["source"]) ||
      undefined,
  };
}

export function saveCommunityLocationPreference(
  preference: CommunityLocationPreference,
) {
  if (typeof window === "undefined") return;

  if (preference.zip) {
    window.localStorage.setItem(ZIP_KEY, preference.zip);
  }

  if (preference.county !== undefined) {
    if (preference.county) {
      window.localStorage.setItem(COUNTY_KEY, preference.county);
    } else {
      window.localStorage.removeItem(COUNTY_KEY);
    }
  }

  if (preference.city !== undefined) {
    if (preference.city) {
      window.localStorage.setItem(CITY_KEY, preference.city);
    } else {
      window.localStorage.removeItem(CITY_KEY);
    }
  }

  if (preference.state !== undefined) {
    if (preference.state) {
      window.localStorage.setItem(STATE_KEY, preference.state);
    } else {
      window.localStorage.removeItem(STATE_KEY);
    }
  }

  if (preference.source) {
    window.localStorage.setItem(SOURCE_KEY, preference.source);
  }

  if (preference.latitude !== undefined) {
    if (Number.isFinite(preference.latitude)) {
      window.localStorage.setItem(LAT_KEY, String(preference.latitude));
    } else {
      window.localStorage.removeItem(LAT_KEY);
    }
  }

  if (preference.longitude !== undefined) {
    if (Number.isFinite(preference.longitude)) {
      window.localStorage.setItem(LNG_KEY, String(preference.longitude));
    } else {
      window.localStorage.removeItem(LNG_KEY);
    }
  }
}

export function formatCommunityLocationLabel(
  preference: CommunityLocationPreference,
) {
  if (preference.county && preference.state) {
    return `${preference.county}, ${preference.state}`;
  }

  if (preference.city && preference.state) {
    return `${preference.city}, ${preference.state}`;
  }

  return (
    preference.county ||
    preference.city ||
    preference.state ||
    preference.zip ||
    undefined
  );
}

export async function resolveCommunityLocationFromZip(zip: string) {
  try {
    const response = await fetch(
      `/api/search/resolve?zip=${encodeURIComponent(zip)}`,
    );
    const payload = await response.json();

    if (response.ok && payload.ok) {
      return {
        zip: String(payload.zip || zip),
        county: payload.county ? String(payload.county) : undefined,
        city: String(payload.city || ""),
        state: String(payload.state || ""),
        source: "search" as const,
      };
    }
  } catch {
    // fall through to ZIP-only lookup
  }

  const response = await fetch(`/api/location/zip?zip=${encodeURIComponent(zip)}`);
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    return null;
  }

  return {
    zip: String(payload.zip || zip),
    city: String(payload.city || ""),
    state: String(payload.state || ""),
    source: "search" as const,
  };
}
