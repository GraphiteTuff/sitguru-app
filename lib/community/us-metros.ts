export type MetroChip = {
  id: string;
  label: string;
  city: string;
  county: string;
  state: string;
  latitude: number;
  longitude: number;
};

export const US_METRO_CHIPS: MetroChip[] = [
  { id: "new-york-ny", label: "New York, NY", city: "New York", county: "New York County", state: "NY", latitude: 40.7128, longitude: -74.006 },
  { id: "los-angeles-ca", label: "Los Angeles, CA", city: "Los Angeles", county: "Los Angeles County", state: "CA", latitude: 34.0522, longitude: -118.2437 },
  { id: "chicago-il", label: "Chicago, IL", city: "Chicago", county: "Cook County", state: "IL", latitude: 41.8781, longitude: -87.6298 },
  { id: "houston-tx", label: "Houston, TX", city: "Houston", county: "Harris County", state: "TX", latitude: 29.7604, longitude: -95.3698 },
  { id: "phoenix-az", label: "Phoenix, AZ", city: "Phoenix", county: "Maricopa County", state: "AZ", latitude: 33.4484, longitude: -112.074 },
  { id: "philadelphia-pa", label: "Philadelphia, PA", city: "Philadelphia", county: "Philadelphia County", state: "PA", latitude: 39.9526, longitude: -75.1652 },
  { id: "san-antonio-tx", label: "San Antonio, TX", city: "San Antonio", county: "Bexar County", state: "TX", latitude: 29.4252, longitude: -98.4946 },
  { id: "san-diego-ca", label: "San Diego, CA", city: "San Diego", county: "San Diego County", state: "CA", latitude: 32.7157, longitude: -117.1611 },
  { id: "dallas-tx", label: "Dallas, TX", city: "Dallas", county: "Dallas County", state: "TX", latitude: 32.7767, longitude: -96.797 },
  { id: "austin-tx", label: "Austin, TX", city: "Austin", county: "Travis County", state: "TX", latitude: 30.2672, longitude: -97.7431 },
  { id: "jacksonville-fl", label: "Jacksonville, FL", city: "Jacksonville", county: "Duval County", state: "FL", latitude: 30.3322, longitude: -81.6557 },
  { id: "fort-worth-tx", label: "Fort Worth, TX", city: "Fort Worth", county: "Tarrant County", state: "TX", latitude: 32.7555, longitude: -97.3308 },
  { id: "columbus-oh", label: "Columbus, OH", city: "Columbus", county: "Franklin County", state: "OH", latitude: 39.9612, longitude: -82.9988 },
  { id: "charlotte-nc", label: "Charlotte, NC", city: "Charlotte", county: "Mecklenburg County", state: "NC", latitude: 35.2271, longitude: -80.8431 },
  { id: "indianapolis-in", label: "Indianapolis, IN", city: "Indianapolis", county: "Marion County", state: "IN", latitude: 39.7684, longitude: -86.1581 },
  { id: "san-francisco-ca", label: "San Francisco, CA", city: "San Francisco", county: "San Francisco County", state: "CA", latitude: 37.7749, longitude: -122.4194 },
  { id: "seattle-wa", label: "Seattle, WA", city: "Seattle", county: "King County", state: "WA", latitude: 47.6062, longitude: -122.3321 },
  { id: "denver-co", label: "Denver, CO", city: "Denver", county: "Denver County", state: "CO", latitude: 39.7392, longitude: -104.9903 },
  { id: "nashville-tn", label: "Nashville, TN", city: "Nashville", county: "Davidson County", state: "TN", latitude: 36.1627, longitude: -86.7816 },
  { id: "washington-dc", label: "Washington, DC", city: "Washington", county: "District of Columbia", state: "DC", latitude: 38.9072, longitude: -77.0369 },
  { id: "boston-ma", label: "Boston, MA", city: "Boston", county: "Suffolk County", state: "MA", latitude: 42.3601, longitude: -71.0589 },
  { id: "el-paso-tx", label: "El Paso, TX", city: "El Paso", county: "El Paso County", state: "TX", latitude: 31.7619, longitude: -106.485 },
  { id: "detroit-mi", label: "Detroit, MI", city: "Detroit", county: "Wayne County", state: "MI", latitude: 42.3314, longitude: -83.0458 },
  { id: "oklahoma-city-ok", label: "Oklahoma City, OK", city: "Oklahoma City", county: "Oklahoma County", state: "OK", latitude: 35.4676, longitude: -97.5164 },
  { id: "portland-or", label: "Portland, OR", city: "Portland", county: "Multnomah County", state: "OR", latitude: 45.5152, longitude: -122.6784 },
  { id: "las-vegas-nv", label: "Las Vegas, NV", city: "Las Vegas", county: "Clark County", state: "NV", latitude: 36.1699, longitude: -115.1398 },
  { id: "memphis-tn", label: "Memphis, TN", city: "Memphis", county: "Shelby County", state: "TN", latitude: 35.1495, longitude: -90.049 },
  { id: "louisville-ky", label: "Louisville, KY", city: "Louisville", county: "Jefferson County", state: "KY", latitude: 38.2527, longitude: -85.7585 },
  { id: "baltimore-md", label: "Baltimore, MD", city: "Baltimore", county: "Baltimore City", state: "MD", latitude: 39.2904, longitude: -76.6122 },
  { id: "milwaukee-wi", label: "Milwaukee, WI", city: "Milwaukee", county: "Milwaukee County", state: "WI", latitude: 43.0389, longitude: -87.9065 },
  { id: "albuquerque-nm", label: "Albuquerque, NM", city: "Albuquerque", county: "Bernalillo County", state: "NM", latitude: 35.0844, longitude: -106.6504 },
  { id: "tucson-az", label: "Tucson, AZ", city: "Tucson", county: "Pima County", state: "AZ", latitude: 32.2226, longitude: -110.9747 },
  { id: "fresno-ca", label: "Fresno, CA", city: "Fresno", county: "Fresno County", state: "CA", latitude: 36.7378, longitude: -119.7871 },
  { id: "sacramento-ca", label: "Sacramento, CA", city: "Sacramento", county: "Sacramento County", state: "CA", latitude: 38.5816, longitude: -121.4944 },
  { id: "atlanta-ga", label: "Atlanta, GA", city: "Atlanta", county: "Fulton County", state: "GA", latitude: 33.749, longitude: -84.388 },
  { id: "miami-fl", label: "Miami, FL", city: "Miami", county: "Miami-Dade County", state: "FL", latitude: 25.7617, longitude: -80.1918 },
  { id: "minneapolis-mn", label: "Minneapolis, MN", city: "Minneapolis", county: "Hennepin County", state: "MN", latitude: 44.9778, longitude: -93.265 },
  { id: "raleigh-nc", label: "Raleigh, NC", city: "Raleigh", county: "Wake County", state: "NC", latitude: 35.7796, longitude: -78.6382 },
  { id: "tampa-fl", label: "Tampa, FL", city: "Tampa", county: "Hillsborough County", state: "FL", latitude: 27.9506, longitude: -82.4572 },
  { id: "new-orleans-la", label: "New Orleans, LA", city: "New Orleans", county: "Orleans Parish", state: "LA", latitude: 29.9511, longitude: -90.0715 },
  { id: "bucks-pa", label: "Bucks, PA", city: "Doylestown", county: "Bucks County", state: "PA", latitude: 40.3101, longitude: -75.131 },
  { id: "montgomery-pa", label: "Montgomery, PA", city: "Norristown", county: "Montgomery County", state: "PA", latitude: 40.1215, longitude: -75.3399 },
  { id: "chester-pa", label: "Chester, PA", city: "West Chester", county: "Chester County", state: "PA", latitude: 39.9607, longitude: -75.606 },
  { id: "delaware-pa", label: "Delaware, PA", city: "Media", county: "Delaware County", state: "PA", latitude: 39.9182, longitude: -75.388 },
  { id: "lehigh-pa", label: "Lehigh, PA", city: "Allentown", county: "Lehigh County", state: "PA", latitude: 40.6084, longitude: -75.4902 },
  { id: "northampton-pa", label: "Northampton, PA", city: "Easton", county: "Northampton County", state: "PA", latitude: 40.6884, longitude: -75.2207 },
];

const NATIONAL_DEFAULT_IDS = [
  "new-york-ny",
  "los-angeles-ca",
  "chicago-il",
  "houston-tx",
  "atlanta-ga",
  "denver-co",
  "seattle-wa",
  "miami-fl",
  "philadelphia-pa",
  "dallas-tx",
];

function milesBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function defaultMetroChips(limit = 8): MetroChip[] {
  return NATIONAL_DEFAULT_IDS
    .map((id) => US_METRO_CHIPS.find((metro) => metro.id === id))
    .filter((metro): metro is MetroChip => Boolean(metro))
    .slice(0, limit);
}

export function nearbyMetroChips(input: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  county?: string;
  state?: string;
  limit?: number;
}): MetroChip[] {
  const limit = input.limit ?? 8;
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude)
  ) {
    return defaultMetroChips(limit);
  }

  const origin = {
    latitude: input.latitude as number,
    longitude: input.longitude as number,
  };

  const here: MetroChip = {
    id: "here",
    label: [input.city || input.county?.replace(/ County$/i, ""), input.state]
      .filter(Boolean)
      .join(", ") || "Near me",
    city: input.city || "",
    county: input.county || "",
    state: input.state || "",
    latitude: origin.latitude,
    longitude: origin.longitude,
  };

  const nearest = [...US_METRO_CHIPS]
    .sort(
      (a, b) => milesBetween(origin, a) - milesBetween(origin, b),
    )
    .filter((metro) => {
      if (here.state && metro.state === here.state && metro.city === here.city) {
        return false;
      }
      if (
        here.county &&
        metro.county.toLowerCase() === here.county.toLowerCase() &&
        metro.state === here.state
      ) {
        return false;
      }
      return true;
    })
    .slice(0, Math.max(limit - 1, 1));

  return [here, ...nearest].slice(0, limit);
}
