export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formatted_address?: string;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length < 5) {
    throw new Error("A valid address or ZIP code is required.");
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SitGuru/1.0 support@sitguru.com",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to contact geocoding service.");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Could not verify this location.");
  }

  const result = data[0];

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    formatted_address: result.display_name,
  };
}