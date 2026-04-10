"use client";

import CaregiverCarousel from "@/components/CaregiverCarousel";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Sitter = {
  id: string;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
};

type Suggestion = {
  label: string;
  value: string;
  type: "name" | "location" | "service";
};

const serviceOptions = [
  "All services",
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training",
  "Pet Taxi",
];

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function formatPrice(rate?: number | null) {
  if (typeof rate !== "number") return "Contact for pricing";
  return `$${rate}/service`;
}

function buildSitterHref(sitter: Sitter) {
  return `/sitter/${sitter.slug || sitter.id}`;
}

function getSearchableText(sitter: Sitter) {
  return [
    sitter.full_name || "",
    sitter.title || "",
    sitter.bio || "",
    sitter.city || "",
    sitter.state || "",
    ...(sitter.services || []),
  ]
    .join(" ")
    .toLowerCase();
}

function getSuggestionIcon(type: Suggestion["type"]) {
  if (type === "name") return "👤";
  if (type === "location") return "📍";
  return "🐾";
}

function SitterCard({ sitter }: { sitter: Sitter }) {
  const displayName = sitter.full_name || "Trusted Sitter";
  const location = formatLocation(sitter.city, sitter.state);
  const price = formatPrice(sitter.rate);
  const rating = sitter.rating ? sitter.rating.toFixed(1) : "New";
  const reviews = sitter.review_count ?? 0;
  const services = sitter.services || [];

  return (
    <article className="panel overflow-hidden p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-50">
          {sitter.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sitter.image_url}
              alt={displayName}
              className="h-[220px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[220px] items-center justify-center text-6xl">
              🐶
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {sitter.is_verified && <span className="chip">Verified</span>}
            <span className="badge">⭐ {rating}</span>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {displayName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{location}</p>

              {sitter.title && (
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  {sitter.title}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <div className="badge">{reviews} reviews</div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            {sitter.bio ||
              "Trusted pet care provider ready to help with walks, drop-in visits, boarding, and more."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.slice(0, 5).map((service) => (
                <span key={service} className="chip">
                  {service}
                </span>
              ))
            ) : (
              <span className="badge">Pet care available</span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Starting rate</p>
              <p className="text-xl font-bold text-slate-900">{price}</p>
              <p className="mt-1 text-sm text-slate-500">
                {sitter.experience_years ?? 0}+ years experience
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={buildSitterHref(sitter)} className="btn-secondary">
                View profile
              </Link>
              <Link
                href={`/bookings?sitterId=${sitter.id}`}
                className="btn-primary"
              >
                Book now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SearchPage() {
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All services");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function loadSitters() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("sitters")
        .select(
          `
          id,
          slug,
          full_name,
          title,
          bio,
          city,
          state,
          rate,
          experience_years,
          is_verified,
          is_active,
          services,
          image_url,
          rating,
          review_count
        `
        )
        .eq("is_active", true)
        .order("rating", { ascending: false, nullsFirst: false });

      if (error) {
        setError(error.message);
        setSitters([]);
        setLoading(false);
        return;
      }

      setSitters((data || []) as Sitter[]);
      setLoading(false);
    }

    loadSitters();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    const query = searchText.trim().toLowerCase();
    const results: Suggestion[] = [];

    sitters.forEach((sitter) => {
      if (sitter.full_name && sitter.full_name.toLowerCase().includes(query)) {
        results.push({
          label: `${getSuggestionIcon("name")} ${sitter.full_name}`,
          value: sitter.full_name,
          type: "name",
        });
      }

      const location = formatLocation(sitter.city, sitter.state);
      if (
        location !== "Location not listed" &&
        location.toLowerCase().includes(query)
      ) {
        results.push({
          label: `${getSuggestionIcon("location")} ${location}`,
          value: location,
          type: "location",
        });
      }

      (sitter.services || []).forEach((service) => {
        if (service.toLowerCase().includes(query)) {
          results.push({
            label: `${getSuggestionIcon("service")} ${service}`,
            value: service,
            type: "service",
          });
        }
      });
    });

    const unique = results.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (s) => s.label === item.label && s.value === item.value && s.type === item.type
        )
    );

    setSuggestions(unique.slice(0, 8));
  }, [searchText, sitters]);

  const filteredSitters = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return sitters.filter((sitter) => {
      const matchesText = query
        ? getSearchableText(sitter).includes(query)
        : true;

      const matchesService =
        serviceFilter === "All services"
          ? true
          : (sitter.services || []).includes(serviceFilter);

      return matchesText && matchesService;
    });
  }, [sitters, searchText, serviceFilter]);

  function handleSuggestionClick(suggestion: Suggestion) {
    setSearchText(suggestion.value);
    setShowSuggestions(false);

    if (suggestion.type === "service") {
      setServiceFilter(suggestion.value);
    }
  }

  return (
    <main className="page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <div className="section-kicker">Find Pet Care</div>
            <h1 className="mt-4">Search trusted sitters and walkers live</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Start typing to instantly search sitter names, cities, states,
              and services.
            </p>
          </div>

          <div className="panel mt-8 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
              <div className="relative">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Search sitters
                </label>

                <input
                  type="text"
                  className="input"
                  placeholder="Search by sitter name, city, state, or service"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((item) => (
                      <button
                        key={`${item.type}-${item.value}-${item.label}`}
                        type="button"
                        onClick={() => handleSuggestionClick(item)}
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 last:border-b-0"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service
                </label>
                <select
                  className="select"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="panel px-4 py-3">
              <p className="text-sm font-medium text-slate-700">
                {loading
                  ? "Loading sitters..."
                  : `${filteredSitters.length} sitter${
                      filteredSitters.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            {(searchText || serviceFilter !== "All services") && (
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setServiceFilter("All services");
                  setSuggestions([]);
                }}
                className="btn-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="grid gap-5">
              <div className="panel h-40 animate-pulse" />
              <div className="panel h-40 animate-pulse" />
              <div className="panel h-40 animate-pulse" />
            </div>
          ) : filteredSitters.length > 0 ? (
            <div className="grid gap-5">
              {filteredSitters.map((sitter) => (
                <SitterCard key={sitter.id} sitter={sitter} />
              ))}
            </div>
          ) : (
            <div className="panel p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                🐾
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                No sitters match your search
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Try a different sitter name, city, state, or service. You can
                also clear the filters to see all active sitters.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setServiceFilter("All services");
                    setSuggestions([]);
                  }}
                  className="btn-primary"
                >
                  Show all sitters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}