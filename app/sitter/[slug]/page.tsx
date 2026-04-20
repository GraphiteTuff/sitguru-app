import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Guru = {
  id: number;
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
    console.error(error.message);
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

  const bookingHref = guru.slug
    ? `/bookings/new?guru_slug=${encodeURIComponent(guru.slug)}`
    : `/bookings/new?guru_slug=${encodeURIComponent(String(guru.id))}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold">{displayName}</h1>
          <p className="mt-2 text-slate-500">{location}</p>

          {guru.is_verified && (
            <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
              Verified Guru
            </span>
          )}

          <p className="mt-6 text-slate-600">
            {guru.bio || "This Guru has not added a bio yet."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 text-center">
            <p className="text-sm text-slate-500">Rating</p>
            <p className="text-2xl font-bold">{guru.rating_avg || 0}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 text-center">
            <p className="text-sm text-slate-500">Reviews</p>
            <p className="text-2xl font-bold">{guru.review_count || 0}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 text-center">
            <p className="text-sm text-slate-500">Experience</p>
            <p className="text-2xl font-bold">
              {guru.experience_years || 0} yrs
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Starting Rate</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{price}</p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={bookingHref}
              className="w-full rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
            >
              Book this Guru
            </Link>

            <Link
              href="/search"
              className="w-full rounded-xl border py-3 text-center font-semibold"
            >
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}