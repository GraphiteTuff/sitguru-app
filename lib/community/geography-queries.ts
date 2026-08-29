import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  COMMUNITY_GEOGRAPHY_ALIASES,
  COMMUNITY_GEOGRAPHY_MAJOR_SLUGS,
  type CommunityGeographyResolveResult,
  type CommunityGeographyRow,
  type CommunityGeographySuggestHit,
} from "@/lib/community/geographies";
import { cleanZipCode, lookupZipLocation } from "@/lib/location/zip-lookup";

type CountySeed = {
  geoid: string;
  fips: string;
  slug: string;
  name: string;
  county_name: string;
  state: string;
  state_fips: string;
  latitude: number;
  longitude: number;
};

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

export function mapGeography(row: Record<string, unknown>): CommunityGeographyRow {
  return {
    id: String(row.id),
    geoid: String(row.geoid),
    fips: String(row.fips || row.geoid),
    slug: String(row.slug),
    name: String(row.name),
    county_name: String(row.county_name),
    state: String(row.state || "").toUpperCase(),
    state_fips: row.state_fips ? String(row.state_fips) : null,
    latitude:
      typeof row.latitude === "number"
        ? row.latitude
        : row.latitude != null
          ? Number(row.latitude)
          : null,
    longitude:
      typeof row.longitude === "number"
        ? row.longitude
        : row.longitude != null
          ? Number(row.longitude)
          : null,
    aliases: asStringArray(row.aliases),
    searchable: row.searchable !== false,
    discovery_enabled: Boolean(row.discovery_enabled),
    homepage_eligible: Boolean(row.homepage_eligible),
    market_id: row.market_id ? String(row.market_id) : null,
    sort_order: Number(row.sort_order ?? 1000),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function toSuggestHit(
  row: CommunityGeographyRow,
  kind: CommunityGeographySuggestHit["kind"] = "county",
  extras?: Partial<CommunityGeographySuggestHit>,
): CommunityGeographySuggestHit {
  return {
    kind,
    id: row.id,
    slug: row.slug,
    label: row.name,
    county_name: row.county_name,
    state: row.state,
    geoid: row.geoid,
    latitude: row.latitude,
    longitude: row.longitude,
    market_id: row.market_id,
    discovery_enabled: row.discovery_enabled,
    homepage_eligible: row.homepage_eligible,
    ...extras,
  };
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function loadCountySeeds(): Promise<CountySeed[]> {
  const data = (await import("@/lib/community/data/us-counties.json"))
    .default as CountySeed[];
  return data;
}

/**
 * Upsert nationwide counties for search. Merges PA/NJ community_markets by
 * county_name+state (and slug) without enabling SerpApi outside those markets.
 *
 * Default (forceCatalogSync false): no-op unless the table is empty AND
 * `seedIfEmpty` is true. Prefer admin restore / markets page for full seed.
 */
export async function ensureCommunityGeographiesSeeded(opts?: {
  forceCatalogSync?: boolean;
  seedIfEmpty?: boolean;
}) {
  const force = opts?.forceCatalogSync === true;
  const seedIfEmpty = opts?.seedIfEmpty === true || force;

  const { count, error: countError } = await supabaseAdmin
    .from("community_geographies")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.warn("ensureCommunityGeographiesSeeded count:", countError.message);
    return {
      ok: false as const,
      seeded: 0,
      linked: 0,
      total: 0,
      error: countError.message,
    };
  }

  if (!force && (count || 0) > 0) {
    return {
      ok: true as const,
      seeded: 0,
      linked: 0,
      total: count || 0,
      error: null,
    };
  }

  if (!seedIfEmpty) {
    return {
      ok: true as const,
      seeded: 0,
      linked: 0,
      total: count || 0,
      error: null,
    };
  }

  const [seeds, markets] = await Promise.all([
    loadCountySeeds(),
    supabaseAdmin
      .from("community_markets")
      .select("id, slug, county_name, state, enabled, market_tier, city, city_anchors"),
  ]);

  if (markets.error) {
    console.warn(
      "ensureCommunityGeographiesSeeded markets:",
      markets.error.message,
    );
  }

  type MarketLink = {
    id: string;
    slug: string;
    county_name: string | null;
    state: string;
    enabled: boolean;
    market_tier: string | null;
    city: string | null;
    city_anchors: string[] | null;
  };

  const marketRows = (markets.data || []) as MarketLink[];
  const byCountyState = new Map<string, MarketLink>();
  const bySlug = new Map<string, MarketLink>();

  for (const market of marketRows) {
    bySlug.set(market.slug, market);
    const county = (market.county_name || "").trim().toLowerCase();
    const state = (market.state || "").trim().toUpperCase();
    if (county && state) {
      byCountyState.set(`${county}|${state}`, market);
    }
  }

  const now = new Date().toISOString();
  const majorRank = new Map<string, number>(
    COMMUNITY_GEOGRAPHY_MAJOR_SLUGS.map((slug, index) => [slug, index + 1]),
  );

  const rows = seeds.map((seed) => {
    const linked =
      bySlug.get(seed.slug) ||
      byCountyState.get(
        `${seed.county_name.trim().toLowerCase()}|${seed.state.toUpperCase()}`,
      ) ||
      null;

    // Only intentional markets get discovery / homepage flags.
    const discoveryOn =
      Boolean(linked?.enabled) &&
      String(linked?.market_tier || "") !== "paused";
    const aliases = [
      ...(COMMUNITY_GEOGRAPHY_ALIASES[seed.slug] || []),
      ...(linked?.city ? [linked.city] : []),
      ...asStringArray(linked?.city_anchors),
    ];
    const uniqueAliases = Array.from(
      new Set(
        aliases
          .map((a) => a.trim())
          .filter(Boolean)
          .filter(
            (a) =>
              a.toLowerCase() !== seed.county_name.toLowerCase() &&
              a.toLowerCase() !== seed.name.toLowerCase(),
          ),
      ),
    );

    return {
      geoid: seed.geoid,
      fips: seed.fips,
      slug: seed.slug,
      name: seed.name,
      county_name: seed.county_name,
      state: seed.state.toUpperCase(),
      state_fips: seed.state_fips,
      latitude: seed.latitude,
      longitude: seed.longitude,
      aliases: uniqueAliases,
      searchable: true,
      discovery_enabled: discoveryOn,
      homepage_eligible: discoveryOn,
      market_id: linked?.id || null,
      sort_order: majorRank.get(seed.slug) ?? 1000,
      updated_at: now,
    };
  });

  let seeded = 0;
  const chunkSize = 400;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin
      .from("community_geographies")
      .upsert(chunk, { onConflict: "geoid" });
    if (error) {
      console.warn("ensureCommunityGeographiesSeeded upsert:", error.message);
      return {
        ok: false as const,
        seeded,
        linked: rows.filter((r) => r.market_id).length,
        total: count || 0,
        error: error.message,
      };
    }
    seeded += chunk.length;
  }

  const linked = rows.filter((r) => r.market_id).length;
  return {
    ok: true as const,
    seeded,
    linked,
    total: rows.length,
    error: null,
  };
}

export async function listHomepageEligibleMarketIds() {
  const { count, error: countError } = await supabaseAdmin
    .from("community_geographies")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.warn("listHomepageEligibleMarketIds count:", countError.message);
    return { ready: false as const, marketIds: [] as string[] };
  }

  // Catalog not seeded yet — callers should keep legacy discovery behavior.
  if ((count || 0) === 0) {
    return { ready: false as const, marketIds: [] as string[] };
  }

  const { data, error } = await supabaseAdmin
    .from("community_geographies")
    .select("market_id")
    .eq("homepage_eligible", true)
    .not("market_id", "is", null);

  if (error) {
    console.warn("listHomepageEligibleMarketIds:", error.message);
    return { ready: false as const, marketIds: [] as string[] };
  }

  return {
    ready: true as const,
    marketIds: Array.from(
      new Set(
        (data || [])
          .map((row) => (row.market_id ? String(row.market_id) : ""))
          .filter(Boolean),
      ),
    ),
  };
}

export async function getGeographyBySlug(slug: string) {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  const { data, error } = await supabaseAdmin
    .from("community_geographies")
    .select("*")
    .eq("slug", clean)
    .maybeSingle();

  if (error) {
    console.warn("getGeographyBySlug:", error.message);
    return null;
  }

  return data ? mapGeography(data as Record<string, unknown>) : null;
}

export async function suggestCommunityGeographies(opts: {
  q: string;
  limit?: number;
  state?: string;
}) {
  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 20);
  const q = opts.q.trim();
  const stateFilter = opts.state?.trim().toUpperCase() || "";

  // Prefer DB catalog; if missing/unseeded, fall back to bundled Census JSON
  // so suggest works before admin restore / migration apply.
  const seeded = await ensureCommunityGeographiesSeeded({
    forceCatalogSync: false,
  });
  const useDb = seeded.ok && seeded.total > 0;

  // Exact ZIP suggest
  const zip = cleanZipCode(q);
  if (zip.length === 5) {
    const resolved = await resolveCommunityGeography({ zip });
    if (resolved?.ok) {
      return [resolved.geography];
    }
  }

  if (!useDb) {
    return suggestFromBundledJson({ q, limit, state: stateFilter });
  }

  if (q.length < 2) {
    // Short query: surface major PA counties (and optional state filter).
    let query = supabaseAdmin
      .from("community_geographies")
      .select("*")
      .eq("searchable", true)
      .in("slug", [...COMMUNITY_GEOGRAPHY_MAJOR_SLUGS])
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (stateFilter.length === 2) {
      query = query.eq("state", stateFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("suggestCommunityGeographies majors:", error.message);
      return suggestFromBundledJson({ q, limit, state: stateFilter });
    }

    return (data || []).map((row) =>
      toSuggestHit(mapGeography(row as Record<string, unknown>)),
    );
  }

  const safe = q.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
  const pattern = `%${safe}%`;
  // Quote filter values so spaces / special chars don't break PostgREST `.or()`.
  const quoted = `"${pattern.replace(/"/g, "")}"`;
  let query = supabaseAdmin
    .from("community_geographies")
    .select("*")
    .eq("searchable", true)
    .or(
      `county_name.ilike.${quoted},name.ilike.${quoted},slug.ilike.${quoted}`,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(limit * 3);

  if (stateFilter.length === 2) {
    query = query.eq("state", stateFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("suggestCommunityGeographies:", error.message);
    return suggestFromBundledJson({ q, limit, state: stateFilter });
  }

  const qLower = q.toLowerCase();
  const mapped = (data || []).map((row) =>
    mapGeography(row as Record<string, unknown>),
  );

  // Also match aliases client-side (array contains not ideal for prefix search).
  const aliasMatches =
    mapped.length < limit
      ? await suggestByAlias(qLower, stateFilter, limit)
      : [];

  const byId = new Map<string, CommunityGeographyRow>();
  for (const row of [...mapped, ...aliasMatches]) {
    byId.set(row.id, row);
  }

  const scored = Array.from(byId.values())
    .map((row) => {
      const county = row.county_name.toLowerCase();
      const name = row.name.toLowerCase();
      const aliasHit = row.aliases.some((a) =>
        a.toLowerCase().includes(qLower),
      );
      let score = 100;
      if (county.startsWith(qLower) || name.startsWith(qLower)) score = 0;
      else if (county.includes(qLower) || name.includes(qLower)) score = 10;
      else if (aliasHit) score = 20;
      score += Math.min(row.sort_order, 999);
      return { row, score };
    })
    .sort((a, b) => a.score - b.score || a.row.name.localeCompare(b.row.name))
    .slice(0, limit)
    .map(({ row }) => toSuggestHit(row));

  // City-style hits from aliases (e.g. "Philly" → Philadelphia County)
  return scored.map((hit) => {
    const geo = byId.get(hit.id);
    if (!geo) return hit;
    const alias = geo.aliases.find((a) =>
      a.toLowerCase().includes(qLower),
    );
    if (alias && !geo.county_name.toLowerCase().includes(qLower)) {
      return {
        ...hit,
        kind: "city" as const,
        city: alias,
        label: `${alias} · ${geo.county_name}, ${geo.state}`,
      };
    }
    return hit;
  });
}

async function suggestFromBundledJson(opts: {
  q: string;
  limit: number;
  state: string;
}): Promise<CommunityGeographySuggestHit[]> {
  const seeds = await loadCountySeeds();
  const qLower = opts.q.trim().toLowerCase();
  const majorSet = new Set<string>(COMMUNITY_GEOGRAPHY_MAJOR_SLUGS);

  let filtered = seeds;
  if (opts.state.length === 2) {
    filtered = filtered.filter(
      (seed) => seed.state.toUpperCase() === opts.state,
    );
  }

  if (qLower.length < 2) {
    const majorOrder = COMMUNITY_GEOGRAPHY_MAJOR_SLUGS as readonly string[];
    filtered = filtered
      .filter((seed) => majorSet.has(seed.slug))
      .sort(
        (a, b) => majorOrder.indexOf(a.slug) - majorOrder.indexOf(b.slug),
      );
  } else {
    filtered = filtered
      .map((seed) => {
        const aliases = COMMUNITY_GEOGRAPHY_ALIASES[seed.slug] || [];
        const county = seed.county_name.toLowerCase();
        const name = seed.name.toLowerCase();
        let score = 100;
        if (county.startsWith(qLower) || name.startsWith(qLower)) score = 0;
        else if (county.includes(qLower) || name.includes(qLower)) score = 10;
        else if (aliases.some((a) => a.toLowerCase().includes(qLower)))
          score = 20;
        else score = 999;
        if (majorSet.has(seed.slug)) score -= 5;
        return { seed, score };
      })
      .filter((item) => item.score < 900)
      .sort(
        (a, b) =>
          a.score - b.score || a.seed.name.localeCompare(b.seed.name),
      )
      .map((item) => item.seed);
  }

  return filtered.slice(0, opts.limit).map((seed) => {
    const aliases = COMMUNITY_GEOGRAPHY_ALIASES[seed.slug] || [];
    const alias = aliases.find((a) => a.toLowerCase().includes(qLower));
    return {
      kind: alias && qLower.length >= 2 ? ("city" as const) : ("county" as const),
      id: `geoid:${seed.geoid}`,
      slug: seed.slug,
      label: alias
        ? `${alias} · ${seed.county_name}, ${seed.state}`
        : seed.name,
      county_name: seed.county_name,
      city: alias || null,
      state: seed.state,
      geoid: seed.geoid,
      latitude: seed.latitude,
      longitude: seed.longitude,
      market_id: null,
      discovery_enabled: false,
      homepage_eligible: false,
    };
  });
}

async function suggestByAlias(
  qLower: string,
  stateFilter: string,
  limit: number,
) {
  // Bound alias scan: prefer known alias map + PA/NJ linked markets.
  const aliasSlugs = Object.entries(COMMUNITY_GEOGRAPHY_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((a) => a.toLowerCase().includes(qLower)),
    )
    .map(([slug]) => slug);

  if (aliasSlugs.length === 0) return [] as CommunityGeographyRow[];

  let query = supabaseAdmin
    .from("community_geographies")
    .select("*")
    .eq("searchable", true)
    .in("slug", aliasSlugs)
    .limit(limit);

  if (stateFilter.length === 2) {
    query = query.eq("state", stateFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("suggestByAlias:", error.message);
    return [] as CommunityGeographyRow[];
  }

  return (data || []).map((row) =>
    mapGeography(row as Record<string, unknown>),
  );
}

export async function resolveCommunityGeography(opts: {
  zip?: string | null;
  slug?: string | null;
  geoid?: string | null;
  county?: string | null;
  state?: string | null;
}): Promise<CommunityGeographyResolveResult | null> {
  const seeded = await ensureCommunityGeographiesSeeded({
    forceCatalogSync: false,
  });
  const useDb = seeded.ok && seeded.total > 0;

  const slug = opts.slug?.trim().toLowerCase();
  if (slug) {
    if (useDb) {
      const geo = await getGeographyBySlug(slug);
      if (geo) {
        return {
          ok: true,
          kind: "slug",
          geography: toSuggestHit(geo),
          city: null,
          state: geo.state,
          county: geo.county_name,
          latitude: geo.latitude,
          longitude: geo.longitude,
          market_id: geo.market_id,
        };
      }
    }
    const fromJson = await geographyFromBundledSlug(slug);
    if (fromJson) return fromJson;
  }

  const geoid = opts.geoid?.trim();
  if (geoid) {
    if (useDb) {
      const { data, error } = await supabaseAdmin
        .from("community_geographies")
        .select("*")
        .eq("geoid", geoid)
        .maybeSingle();
      if (!error && data) {
        const geo = mapGeography(data as Record<string, unknown>);
        return {
          ok: true,
          kind: "county",
          geography: toSuggestHit(geo),
          city: null,
          state: geo.state,
          county: geo.county_name,
          latitude: geo.latitude,
          longitude: geo.longitude,
          market_id: geo.market_id,
        };
      }
    }
    const seeds = await loadCountySeeds();
    const seed = seeds.find((row) => row.geoid === geoid);
    if (seed) {
      return bundledSeedToResolve(seed, "county");
    }
  }

  const zip = cleanZipCode(opts.zip);
  if (zip.length === 5) {
    const location = await lookupZipLocation(zip);
    if (
      !location?.city ||
      !location?.state ||
      location.latitude == null ||
      location.longitude == null
    ) {
      return null;
    }

    const nearest = useDb
      ? await findNearestCountyInState(
          location.state,
          location.latitude,
          location.longitude,
        )
      : await findNearestCountyFromBundled(
          location.state,
          location.latitude,
          location.longitude,
        );

    if (!nearest) {
      return {
        ok: true,
        kind: "zip",
        geography: {
          kind: "zip",
          id: `zip:${zip}`,
          slug: `zip-${zip}`,
          label: `${location.city}, ${location.state} ${zip}`,
          county_name: "",
          city: location.city,
          state: location.state,
          zip,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        zip,
        city: location.city,
        state: location.state,
        county: null,
        latitude: location.latitude,
        longitude: location.longitude,
        market_id: null,
      };
    }

    return {
      ok: true,
      kind: "zip",
      geography: toSuggestHit(nearest, "zip", {
        city: location.city,
        zip,
        label: `${location.city}, ${nearest.county_name}, ${nearest.state}`,
      }),
      zip,
      city: location.city,
      state: nearest.state,
      county: nearest.county_name,
      latitude: location.latitude,
      longitude: location.longitude,
      market_id: nearest.market_id,
    };
  }

  const county = opts.county?.trim();
  const state = opts.state?.trim().toUpperCase();
  if (county && state) {
    if (useDb) {
      const { data, error } = await supabaseAdmin
        .from("community_geographies")
        .select("*")
        .eq("searchable", true)
        .eq("state", state)
        .ilike("county_name", county)
        .maybeSingle();

      if (!error && data) {
        const geo = mapGeography(data as Record<string, unknown>);
        return {
          ok: true,
          kind: "county",
          geography: toSuggestHit(geo),
          city: null,
          state: geo.state,
          county: geo.county_name,
          latitude: geo.latitude,
          longitude: geo.longitude,
          market_id: geo.market_id,
        };
      }
    }

    const seeds = await loadCountySeeds();
    const seed = seeds.find(
      (row) =>
        row.state.toUpperCase() === state &&
        row.county_name.toLowerCase() === county.toLowerCase(),
    );
    if (seed) return bundledSeedToResolve(seed, "county");
  }

  return null;
}

function bundledSeedToResolve(
  seed: CountySeed,
  kind: CommunityGeographyResolveResult["kind"],
): CommunityGeographyResolveResult {
  const hit: CommunityGeographySuggestHit = {
    kind: "county",
    id: `geoid:${seed.geoid}`,
    slug: seed.slug,
    label: seed.name,
    county_name: seed.county_name,
    state: seed.state,
    geoid: seed.geoid,
    latitude: seed.latitude,
    longitude: seed.longitude,
    market_id: null,
    discovery_enabled: false,
    homepage_eligible: false,
  };
  return {
    ok: true,
    kind,
    geography: hit,
    city: null,
    state: seed.state,
    county: seed.county_name,
    latitude: seed.latitude,
    longitude: seed.longitude,
    market_id: null,
  };
}

async function geographyFromBundledSlug(slug: string) {
  const seeds = await loadCountySeeds();
  const seed = seeds.find((row) => row.slug === slug);
  return seed ? bundledSeedToResolve(seed, "slug") : null;
}

async function findNearestCountyFromBundled(
  state: string,
  latitude: number,
  longitude: number,
) {
  const seeds = await loadCountySeeds();
  const inState = seeds.filter(
    (seed) => seed.state.toUpperCase() === state.toUpperCase(),
  );
  let best: CommunityGeographyRow | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const seed of inState) {
    const dist = haversineMiles(
      latitude,
      longitude,
      seed.latitude,
      seed.longitude,
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = {
        id: `geoid:${seed.geoid}`,
        geoid: seed.geoid,
        fips: seed.fips,
        slug: seed.slug,
        name: seed.name,
        county_name: seed.county_name,
        state: seed.state,
        state_fips: seed.state_fips,
        latitude: seed.latitude,
        longitude: seed.longitude,
        aliases: COMMUNITY_GEOGRAPHY_ALIASES[seed.slug] || [],
        searchable: true,
        discovery_enabled: false,
        homepage_eligible: false,
        market_id: null,
        sort_order: 1000,
      };
    }
  }
  return best;
}

async function findNearestCountyInState(
  state: string,
  latitude: number,
  longitude: number,
) {
  const { data, error } = await supabaseAdmin
    .from("community_geographies")
    .select("*")
    .eq("state", state.toUpperCase())
    .eq("searchable", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(400);

  if (error) {
    console.warn("findNearestCountyInState:", error.message);
    return null;
  }

  const rows = (data || []).map((row) =>
    mapGeography(row as Record<string, unknown>),
  );
  if (rows.length === 0) return null;

  let best: CommunityGeographyRow | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    if (row.latitude == null || row.longitude == null) continue;
    const dist = haversineMiles(
      latitude,
      longitude,
      row.latitude,
      row.longitude,
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = row;
    }
  }

  return best;
}
