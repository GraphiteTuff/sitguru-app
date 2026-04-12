"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProviderMap from "@/components/ProviderMap";
import { supabase } from "@/lib/supabase";

type GuruRow = {
  id: string;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  response_time?: string | null;
};

function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function getLocationLabel(guru: GuruRow) {
  return formatLocation(guru.city, guru.state);
}

function getStarFillPercent(index: number, rating?: number | null) {
  if (typeof rating !== "number") return 0;
  const safeRating = Math.max(0, Math.min(5, rating));
  const starStart = index;
  const fill = Math.max(0, Math.min(1, safeRating - starStart));
  return fill * 100;
}

function StarIcon({
  fillPercent,
  size = 16,
  uniqueId,
}: {
  fillPercent: number;
  size?: number;
  uniqueId: string;
}) {
  const starPath =
    "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={uniqueId}>
          <rect x="0" y="0" width={`${fillPercent}%`} height="24" />
        </clipPath>
      </defs>
      <path d={starPath} fill="#e2e8f0" />
      <path d={starPath} fill="#f59e0b" clipPath={`url(#${uniqueId})`} />
    </svg>
  );
}

function Stars({ rating, providerId }: { rating?: number | null; providerId: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <StarIcon
          key={index}
          fillPercent={getStarFillPercent(index, rating)}
          uniqueId={`star-${providerId}-${index}`}
        />
      ))}
    </div>
  );
}

function isTopRated(rating?: number | null) {
  return typeof rating === "number" && rating >= 4.8;
}

export default function SearchPage() {
  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [highlightedProviderId, setHighlightedProviderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGurus() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("gurus")                    // ← Fixed
        .select(`
          id,
          slug,
          full_name,
          title,
          bio,
          city,
          state,
          latitude,
          longitude,
          rate,
          experience_years,
          is_verified,
          is_active,
          services,
          image_url,
          rating,
          review_count,
          response_time
        `)
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("rating", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setGurus((data || []) as GuruRow[]);
      setLoading(false);
    }

    loadGurus();
  }, []);

  const locationOptions = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(
        gurus
          .map((guru) => getLocationLabel(guru))
          .filter((location) => location && location !== "Location not listed"),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return uniqueLocations;
  }, [gurus]);

  const filteredGurus = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return gurus.filter((guru) => {
      const matchesSearch = !q
        ? true
        : [
            guru.full_name,
            guru.title,
            guru.bio,
            guru.city,
            guru.state,
            ...(guru.services || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);

      const matchesLocation =
        selectedLocation === "all" ? true : getLocationLabel(guru) === selectedLocation;

      return matchesSearch && matchesLocation;
    });
  }, [gurus, searchTerm, selectedLocation]);

  const markers = useMemo(
    () =>
      filteredGurus
        .filter(
          (guru) =>
            typeof guru.latitude === "number" && typeof guru.longitude === "number",
        )
        .map((guru) => ({
          id: guru.id,
          lat: Number(guru.latitude),
          lng: Number(guru.longitude),
          title: guru.full_name || "Provider",
          subtitle: getLocationLabel(guru),
        })),
    [filteredGurus],
  );

  const mapCenter = useMemo(() => {
    const highlighted = markers.find((marker) => marker.id === highlightedProviderId);

    if (highlighted) {
      return { lat: highlighted.lat, lng: highlighted.lng };
    }

    if (markers.length > 0) {
      return { lat: markers[0].lat, lng: markers[0].lng };
    }

    return { lat: 40.6084, lng: -75.4902 }; // Default to your area
  }, [markers, highlightedProviderId]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-cyan-600 px-6 py-8 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
            SitGuru Search
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Find trusted pet care near you
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
            Browse active SitGuru providers and see where they are located on the map.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by provider, service, city, or state"
              className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-slate-900 outline-none focus:border-white"
            />

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-slate-900 outline-none focus:border-white"
            >
              <option value="all">All locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading providers...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Active providers</p>
                    <h2 className="text-2xl font-black text-slate-900">
                      {filteredGurus.length}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      Map synced
                    </div>
                    {selectedLocation !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedLocation("all")}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear location
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>

              {filteredGurus.length === 0 ? (
                <Card className="p-6">
                  <p className="text-sm text-slate-600">
                    No providers matched your current search or location filter.
                  </p>
                </Card>
              ) : (
                filteredGurus.map((guru) => {
                  const href = guru.slug ? `/guru/${guru.slug}` : `/guru/${guru.id}`;
                  const isHighlighted = highlightedProviderId === guru.id;

                  return (
                    <Link key={guru.id} href={href} className="block">
                      <Card
                        className={`overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${
                          isHighlighted ? "ring-2 ring-emerald-500" : ""
                        }`}
                        onMouseEnter={() => setHighlightedProviderId(guru.id)}
                        onMouseLeave={() => setHighlightedProviderId(null)}
                      >
                        <div className="p-5">
                          <div className="flex gap-4">
                            <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
                              {guru.image_url ? (
                                <img
                                  src={guru.image_url}
                                  alt={guru.full_name || "Provider"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-400">
                                  {(guru.full_name || "P").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-900">
                                      {guru.full_name || "Provider"}
                                    </h3>
                                    {isTopRated(guru.rating) ? (
                                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                                        Top Rated
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-sm font-semibold text-emerald-700">
                                    {guru.title || "Trusted pet caregiver"}
                                  </p>
                                </div>

                                {guru.is_verified ? (
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Verified
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 text-sm text-slate-500">
                                {formatLocation(guru.city, guru.state)}
                              </p>

                              <div className="mt-2 flex items-center gap-2">
                                <Stars rating={guru.rating} providerId={guru.id} />
                                <span className="text-sm font-semibold text-slate-700">
                                  {typeof guru.rating === "number"
                                    ? guru.rating.toFixed(1)
                                    : "--"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({typeof guru.review_count === "number" ? guru.review_count : 0})
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {(guru.services || []).slice(0, 3).map((service) => (
                                  <span
                                    key={service}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                <div className="rounded-2xl bg-slate-50 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    From
                                  </p>
                                  <p className="mt-1 font-black text-slate-900">
                                    {typeof guru.rate === "number" ? `$${guru.rate}` : "--"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-3">
                                  <p className="text-xs font-semibold text-slate-500">Rating</p>
                                  <p className="mt-1 font-black text-slate-900">
                                    {typeof guru.rating === "number"
                                      ? guru.rating.toFixed(1)
                                      : "--"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-3">
                                  <p className="text-xs font-semibold text-slate-500">Response</p>
                                  <p className="mt-1 truncate font-black text-slate-900">
                                    {guru.response_time || "--"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <Card className="overflow-hidden p-3">
                <ProviderMap
                  markers={markers}
                  center={mapCenter}
                  highlightedMarkerId={highlightedProviderId}
                />
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}