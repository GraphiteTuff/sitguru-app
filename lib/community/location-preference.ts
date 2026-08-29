export type CommunityLocationPreference = {
  zip?: string;
  county?: string;
  city?: string;
  state?: string;
  source?: "search" | "profile" | "manual" | "default";
};

const ZIP_KEY = "sitguru_home_zip";
const COUNTY_KEY = "sitguru_home_county";
const CITY_KEY = "sitguru_home_city";
const STATE_KEY = "sitguru_home_state";
const SOURCE_KEY = "sitguru_home_location_source";

export function readCommunityLocationPreference(): CommunityLocationPreference {
  if (typeof window === "undefined") return {};

  return {
    zip: window.localStorage.getItem(ZIP_KEY) || undefined,
    county: window.localStorage.getItem(COUNTY_KEY) || undefined,
    city: window.localStorage.getItem(CITY_KEY) || undefined,
    state: window.localStorage.getItem(STATE_KEY) || undefined,
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

  if (preference.city) {
    window.localStorage.setItem(CITY_KEY, preference.city);
  }

  if (preference.state) {
    window.localStorage.setItem(STATE_KEY, preference.state);
  }

  if (preference.source) {
    window.localStorage.setItem(SOURCE_KEY, preference.source);
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
