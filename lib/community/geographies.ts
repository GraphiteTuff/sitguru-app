export type CommunityGeographyRow = {
  id: string;
  geoid: string;
  fips: string;
  slug: string;
  name: string;
  county_name: string;
  state: string;
  state_fips: string | null;
  latitude: number | null;
  longitude: number | null;
  aliases: string[];
  searchable: boolean;
  discovery_enabled: boolean;
  homepage_eligible: boolean;
  market_id: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type CommunityGeographySuggestHit = {
  kind: "county" | "city" | "zip";
  id: string;
  slug: string;
  label: string;
  county_name: string;
  city?: string | null;
  state: string;
  zip?: string | null;
  geoid?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  market_id?: string | null;
  discovery_enabled?: boolean;
  homepage_eligible?: boolean;
};

export type CommunityGeographyResolveResult = {
  ok: true;
  kind: "county" | "zip" | "slug";
  geography: CommunityGeographySuggestHit;
  zip?: string | null;
  city?: string | null;
  state: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  market_id?: string | null;
};

/** Extra search aliases keyed by geography slug. */
export const COMMUNITY_GEOGRAPHY_ALIASES: Record<string, string[]> = {
  "philadelphia-county-pa": ["Philadelphia", "Philly", "Center City"],
  "new-york-county-ny": ["Manhattan", "NYC", "New York City"],
  "kings-county-ny": ["Brooklyn"],
  "queens-county-ny": ["Queens"],
  "bronx-county-ny": ["The Bronx", "Bronx"],
  "richmond-county-ny": ["Staten Island"],
  "cook-county-il": ["Chicago"],
  "los-angeles-county-ca": ["LA", "Los Angeles"],
  "harris-county-tx": ["Houston"],
  "maricopa-county-az": ["Phoenix"],
  "king-county-wa": ["Seattle"],
  "suffolk-county-ma": ["Boston"],
  "fulton-county-ga": ["Atlanta"],
  "miami-dade-county-fl": ["Miami"],
  "denver-county-co": ["Denver"],
  "district-of-columbia-dc": ["Washington", "Washington DC", "DC"],
};

/** Prefer these PA majors at the top of empty/short suggest results. */
export const COMMUNITY_GEOGRAPHY_MAJOR_SLUGS = [
  "montgomery-county-pa",
  "bucks-county-pa",
  "philadelphia-county-pa",
  "chester-county-pa",
  "delaware-county-pa",
  "lehigh-county-pa",
  "northampton-county-pa",
] as const;
