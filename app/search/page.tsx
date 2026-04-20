"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import ProviderMap from "@/components/ProviderMap";
import { supabase } from "@/lib/supabase";

type GuruRow = {
  id: number;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hourly_rate?: number | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  rating_avg?: number | null;
  rating?: number | null;
  review_count?: number | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
};

type Marker = {
  id: string;
  lat: number;
  lng: number;
};

const SERVICE_OPTIONS = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training Support",
  "Medication Help",
  "Custom Care",
];

function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}
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

function formatRate(rate?: number | null) {
  if (typeof rate !== "number") return "Rate not listed";
  return `$${rate}/hr`;
}

function getGuruName(guru: GuruRow) {
  return guru.display_name || guru.full_name || "Guru";
}

function getGuruPhotoUrl(guru: GuruRow) {
  return guru.profile_photo_url || guru.image_url || "";
}

function getGuruHref(guru: GuruRow) {
  if (guru.slug) return `/guru/${guru.slug}`;
  return `/guru/${guru.id}`;
}

function getGuruRating(guru: GuruRow) {
  if (typeof guru.rating_avg === "number") return guru.rating_avg;
  if (typeof guru.rating === "number") return guru.rating;
  return 0;
}

function getGuruRate(guru: GuruRow) {
  if (typeof guru.hourly_rate === "number") return guru.hourly_rate;
  if (typeof guru.rate === "number") return guru.rate;
  return null;
}

function matchesService(guru: GuruRow, selectedService: string) {
  if (!selectedService) return true;

  const services = guru.services || [];
  if (!services.length) return false;

  return services.some(
    (service) => service.toLowerCase() === selectedService.toLowerCase()
  );
}

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

export default function SearchPage() {
  const searchParams = useSearchParams();

  const initialService = searchParams.get("service") || "";
  const initialCity = searchParams.get("city") || "";
  const initialState = searchParams.get("state") || "";

  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceFilter, setServiceFilter] = useState(initialService);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [stateFilter, setStateFilter] = useState(initialState);
  const [searchTerm, setSearchTerm] = useState("");

  const [highlightedGuruId, setHighlightedGuruId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setServiceFilter(initialService);
    setCityFilter(initialCity);
    setStateFilter(initialState);
  }, [initialService, initialCity, initialState]);

  useEffect(() => {
    async function loadGurus() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("gurus")
        .select(
          `
            id,
            user_id,
            slug,
            display_name,
            full_name,
            title,
            bio,
            city,
            state,
            latitude,
            longitude,
            hourly_rate,
            rate,
            experience_years,
            is_verified,
            rating_avg,
            rating,
            review_count,
            profile_photo_url,
            image_url,
            is_public,
            is_active,
            services
          `
        )
        .or("is_public.eq.true,is_active.eq.true")
        .order("is_verified", { ascending: false })
        .order("rating_avg", { ascending: false, nullsFirst: false });

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

  const filteredGurus = useMemo(() => {
    const query = normalizeText(searchTerm);
    const city = normalizeText(cityFilter);
    const state = normalizeText(stateFilter);

    return gurus.filter((guru) => {
      const guruName = normalizeText(getGuruName(guru));
      const guruCity = normalizeText(guru.city);
      const guruState = normalizeText(guru.state);
      const guruBio = normalizeText(guru.bio);
      const guruTitle = normalizeText(guru.title);
      const guruServices = (guru.services || []).join(" ").toLowerCase();

      const matchesText =
        !query ||
        [guruName, guruCity, guruState, guruBio, guruTitle, guruServices]
          .join(" ")
          .includes(query);

      const matchesCityFilter = !city || guruCity.includes(city);
      const matchesStateFilter = !state || guruState.includes(state);
      const matchesSelectedService = matchesService(guru, serviceFilter);

      return (
        matchesText &&
        matchesCityFilter &&
        matchesStateFilter &&
        matchesSelectedService
      );
    });
  }, [gurus, searchTerm, cityFilter, stateFilter, serviceFilter]);

  const markers: Marker[] = filteredGurus
    .filter(
      (guru) =>
        typeof guru.latitude === "number" && typeof guru.longitude === "number"
    )
    .map((guru) => ({
      id: String(guru.id),
      lat: guru.latitude as number,
      lng: guru.longitude as number,
    }));

  const mapCenter =
    markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: 39.9526, lng: -75.1652 };

  const activeFilterCount = [
    serviceFilter,
    cityFilter.trim(),
    stateFilter.trim(),
    searchTerm.trim(),
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Find a Guru
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Search trusted local pet care with more confidence
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
              Browse SitGuru providers by service, city, state, and profile
              details. Compare Gurus in a cleaner, more modern search experience
              built for pet parents.
            </p>
          </div>

          <Card className="mt-8 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_1fr_1.25fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Service
                </label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                >
                  <option value="">All services</option>
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  City
                </label>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Quakertown"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  State
                </label>
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  placeholder="Pennsylvania"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Search profile details
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, bio, title, services"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setServiceFilter("");
                    setCityFilter("");
                    setStateFilter("");
                    setSearchTerm("");
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 xl:w-auto"
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                {filteredGurus.length} Guru{filteredGurus.length === 1 ? "" : "s"} found
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                Mobile-friendly search
              </span>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
        {error ? (
          <Card className="p-6">
            <p className="font-medium text-red-600">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <Card className="p-6">
            <p className="text-slate-600">Loading Gurus...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              {filteredGurus.length === 0 ? (
                <Card className="p-7">
                  <h2 className="text-xl font-bold text-slate-900">
                    No Gurus found
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Try changing the service, city, state, or profile search.
                    You can also clear the filters and browse all available
                    Gurus.
                  </p>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceFilter("");
                        setCityFilter("");
                        setStateFilter("");
                        setSearchTerm("");
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Reset Search
                    </button>
                  </div>
                </Card>
              ) : (
                filteredGurus.map((guru) => {
                  const photoUrl = getGuruPhotoUrl(guru);
                  const guruName = getGuruName(guru);
                  const guruRate = getGuruRate(guru);
                  const guruRating = getGuruRating(guru);
                  const services = guru.services || [];

                  return (
                    <Card
                      key={guru.id}
                      className="overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      onMouseEnter={() => setHighlightedGuruId(String(guru.id))}
                      onMouseLeave={() => setHighlightedGuruId(undefined)}
                    >
                      <div className="flex h-full flex-col md:flex-row">
                        <div className="h-64 w-full shrink-0 overflow-hidden bg-slate-100 md:h-[320px] md:w-72">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={guruName}
                              className="h-full w-full object-cover object-center"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between p-6">
                          <div>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                                    {guruName}
                                  </h2>

                                  {guru.is_verified ? (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                      Trusted
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-base text-slate-600">
                                  {guru.title || "Pet Care Guru"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {formatLocation(guru.city, guru.state)}
                                </p>
                              </div>

                              <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[180px]">
                                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Rating
                                  </div>
                                  <div className="mt-1 text-lg font-bold text-slate-900">
                                    {guruRating > 0 ? guruRating.toFixed(1) : "New"}
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Reviews
                                  </div>
                                  <div className="mt-1 text-lg font-bold text-slate-900">
                                    {guru.review_count || 0}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium">
                                {formatRate(guruRate)}
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium">
                                {guru.experience_years
                                  ? `${guru.experience_years}+ years experience`
                                  : "Experience not listed"}
                              </span>
                            </div>

                            {services.length > 0 ? (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {services.slice(0, 5).map((service) => (
                                  <span
                                    key={service}
                                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-5">
                              {guru.bio ? (
                                <p className="line-clamp-4 text-sm leading-7 text-slate-600 sm:text-base">
                                  {guru.bio}
                                </p>
                              ) : (
                                <p className="text-sm leading-7 text-slate-500 sm:text-base">
                                  This Guru has not added a bio yet.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                              href={getGuruHref(guru)}
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              View Guru Profile
                            </Link>

                            <Link
                              href={getGuruHref(guru)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                            >
                              Book or Learn More
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-bold text-slate-900">Map view</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Hover over a Guru card to highlight their location.
                  </p>
                </div>

                <div className="min-h-[420px] sm:min-h-[520px] xl:min-h-[900px]">
                  <ProviderMap
                    markers={markers}
                    center={[mapCenter.lat, mapCenter.lng]}
                    highlightedMarkerId={highlightedGuruId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}