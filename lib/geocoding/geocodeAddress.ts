export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formatted_address?: string;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length < 5) {
    throw new Error("A valid address or ZIP code is required.");
  }

  const apiKey = process.env.GEOCODING_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEOCODING_API_KEY environment variable.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");

  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Failed to contact geocoding service.");
  }

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("Could not verify this location.");
  }

  const result = data.results[0];

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    formatted_address: result.formatted_address,
  };
}