import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
  response_time?: string | null;
};

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

async function getSitter(slug: string) {
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
      review_count,
      response_time
    `
    )
    .eq("is_active", true)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (error) {
    console.error("Error loading sitter:", error.message);
    return null;
  }

  return (data as Sitter | null) || null;
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="muted-panel p-4">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{value}</p>
    </div>
  );
}

export default async function SitterProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const sitter = await getSitter(slug);

  if (!sitter) {
    notFound();
  }

  const displayName = sitter.full_name || "Trusted Sitter";
  const rating = sitter.rating ? sitter.rating.toFixed(1) : "New";
  const reviewCount = sitter.review_count ?? 0;
  const location = formatLocation(sitter.city, sitter.state);
  const price = formatPrice(sitter.rate);
  const services = sitter.services || [];

  return (
    <main className="page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_380px] lg:items-start">
            <div className="panel overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <div className="relative min-h-[280px] bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-50">
                  {sitter.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sitter.image_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center text-7xl">
                      🐶
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {sitter.is_verified && <span className="chip">Verified</span>}
                    <span className="badge">⭐ {rating}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  <div className="section-kicker">Trusted local caregiver</div>

                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-5xl">
                    {displayName}
                  </h1>

                  <p className="mt-2 text-base font-medium text-slate-500">
                    {location}
                  </p>

                  {sitter.title && (
                    <p className="mt-4 text-sm font-semibold text-emerald-700 sm:text-base">
                      {sitter.title}
                    </p>
                  )}

                  <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                    {sitter.bio ||
                      "Reliable pet care provider offering safe, attentive, and friendly support for walks, drop-in visits, boarding, and more."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <span key={service} className="chip">
                          {service}
                        </span>
                      ))
                    ) : (
                      <span className="badge">Pet care available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="panel p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Starting rate
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    {price}
                  </p>
                </div>
                <span className="badge">{reviewCount} reviews</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <InfoCard
                  label="Experience"
                  value={`${sitter.experience_years ?? 0}+ years caring for pets`}
                />
                <InfoCard
                  label="Response time"
                  value={sitter.response_time || "Usually replies quickly"}
                />
                <InfoCard
                  label="Availability"
                  value="Check availability before booking"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/bookings?sitterId=${sitter.id}`}
                  className="btn-primary w-full"
                >
                  Book now
                </Link>
                <Link href="/search" className="btn-secondary w-full">
                  Back to search
                </Link>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Compare services, check details, and confirm care needs before
                finalizing a booking request.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-6">
              <div className="panel p-6 sm:p-7">
                <div className="section-kicker">Services and details</div>
                <h2 className="mt-4">What this sitter offers</h2>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                  Review service types, profile details, and clear trust signals
                  before choosing the right caregiver for your pet.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard label="Location" value={location} />
                  <InfoCard label="Pricing" value={price} />
                  <InfoCard
                    label="Verified profile"
                    value={sitter.is_verified ? "Yes" : "Not listed"}
                  />
                  <InfoCard
                    label="Service count"
                    value={`${services.length || 1} available option${
                      services.length === 1 ? "" : "s"
                    }`}
                  />
                </div>
              </div>

              <div className="panel p-6 sm:p-7">
                <div className="section-kicker">About</div>
                <h2 className="mt-4">Care style and experience</h2>
                <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">
                  {sitter.bio ||
                    "This caregiver provides dependable pet care with a focus on communication, consistency, and making pets feel comfortable during every visit or stay."}
                </p>
              </div>
            </div>

            <aside className="grid gap-6">
              <div className="panel p-6">
                <div className="section-kicker">Booking tips</div>
                <h3 className="mt-4">Before you book</h3>
                <div className="mt-5 grid gap-3">
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Confirm pet needs
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Share feeding, medication, and routine details.
                    </p>
                  </div>
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Check availability
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Make sure dates and service times match your schedule.
                    </p>
                  </div>
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Review profile details
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Use reviews, services, and trust signals to compare care
                      options.
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel p-6">
                <div className="section-kicker">More options</div>
                <h3 className="mt-4">Keep exploring PawNecto</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Compare more local sitters, try another service type, or start
                  a booking request.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/search" className="btn-secondary w-full">
                    Browse more sitters
                  </Link>
                  <Link href="/become-a-sitter" className="btn-primary w-full">
                    Become a sitter
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}