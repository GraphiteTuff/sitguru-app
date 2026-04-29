import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Guru = {
  id: string;
  slug?: string | null;
  display_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  hourly_rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  rating_avg?: number | null;
  review_count?: number | null;
};

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function formatPrice(rate?: number | null) {
  if (typeof rate !== "number") return "Contact";
  return `$${rate}/hr`;
}

async function getGuru(slug: string) {
  const { data, error } = await supabase
    .from("gurus")
    .select(
      "id, slug, display_name, bio, city, state, hourly_rate, experience_years, is_verified, rating_avg, review_count"
    )
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (error) {
    console.error("Guru public profile lookup error:", error.message);
    return null;
  }

  return data as Guru | null;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  const guru = await getGuru(slug);

  if (!guru) {
    notFound();
  }

  const displayName = guru.display_name || "Trusted Guru";
  const location = formatLocation(guru.city, guru.state);
  const price = formatPrice(guru.hourly_rate);

  const guruBookingSlug = guru.slug?.trim() || String(guru.id);

  /*
    Important:
    Do not send customers to /bookings/new from the public Guru page.
    /bookings/new is the general booking form and causes customers to re-enter
    booking details.

    This sends customers into the Guru-specific booking flow instead.
  */
  const bookingHref = `/book/${encodeURIComponent(guruBookingSlug)}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                SitGuru Profile
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                {displayName}
              </h1>

              <p className="mt-2 text-slate-500">{location}</p>
            </div>

            {guru.is_verified ? (
              <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Verified Guru
              </span>
            ) : null}
          </div>

          <p className="mt-6 leading-7 text-slate-600">
            {guru.bio || "This Guru has not added a bio yet."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Rating</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {guru.rating_avg || 0}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Reviews</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {guru.review_count || 0}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Experience</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {guru.experience_years || 0} yrs
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Starting Rate</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{price}</p>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Start a Guru-specific booking request for {displayName}. You will
            enter the care details once, review the request, and continue to
            secure checkout.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={bookingHref}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-center font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              Book this Guru
            </Link>

            <Link
              href="/search"
              className="inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-center font-bold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
            >
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}