export type ReverseGeocodeResult = {
  latitude: number;
  longitude: number;
  city: string;
  county: string;
  state: string;
  formattedAddress: string;
};

function component(
  components: Array<{ long_name?: string; short_name?: string; types?: string[] }>,
  type: string,
  short = false,
) {
  const hit = components.find((item) => item.types?.includes(type));
  if (!hit) return "";
  return (short ? hit.short_name : hit.long_name) || hit.long_name || hit.short_name || "";
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("A valid map location is required.");
  }

  const apiKey = process.env.GEOCODING_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEOCODING_API_KEY environment variable.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to contact geocoding service.");
  }

  const data = (await response.json()) as {
    status?: string;
    results?: Array<{
      formatted_address?: string;
      address_components?: Array<{
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>;
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("Could not verify this location.");
  }

  const result =
    data.results.find((item) => {
      const types = item.address_components?.flatMap((part) => part.types || []) || [];
      return (
        types.includes("locality") ||
        types.includes("administrative_area_level_2")
      );
    }) || data.results[0];
  const parts = result.address_components || [];
  const city =
    component(parts, "locality") ||
    component(parts, "postal_town") ||
    component(parts, "sublocality");
  const county = component(parts, "administrative_area_level_2");
  const state = component(parts, "administrative_area_level_1", true).toUpperCase();

  return {
    latitude,
    longitude,
    city,
    county,
    state,
    formattedAddress: result.formatted_address || [city, county, state].filter(Boolean).join(", "),
  };
}
