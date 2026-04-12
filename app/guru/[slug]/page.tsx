import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Guru = {
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

type Review = {
  id: string;
  customer_name?: string;
  rating: number;
  comment?: string;
  created_at: string;
};

async function getGuru(slug: string) {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("gurus")
    .select(`
      id, slug, full_name, title, bio, city, state, rate,
      experience_years, is_verified, is_active, services,
      image_url, rating, review_count, response_time
    `)
    .eq("is_active", true)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (error) {
    console.error("Error loading guru:", error.message);
    return null;
  }

  return data as Guru | null;
}

async function getReviews(guruId: string) {
  const { data } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, comment, created_at")
    .eq("guru_id", guruId)
    .order("created_at", { ascending: false })
    .limit(5);

  return data as Review[] || [];
}

export default async function GuruProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const guru = await getGuru(slug);
  const reviews = await getReviews(guru?.id || "");

  if (!guru) {
    notFound();
  }

  const displayName = guru.full_name || "Trusted Guru";
  const location = guru.city && guru.state 
    ? `${guru.city}, ${guru.state}` 
    : (guru.city || guru.state || "Location not listed");

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-6 mb-8">
              {guru.image_url ? (
                <img src={guru.image_url} alt={displayName} className="w-32 h-32 rounded-3xl object-cover shadow" />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-emerald-100 flex items-center justify-center text-7xl">🐾</div>
              )}
              <div>
                <h1 className="text-5xl font-bold tracking-tight">{displayName}</h1>
                <p className="text-2xl text-slate-600 mt-1">{guru.title}</p>
                <p className="text-slate-500">{location}</p>
              </div>
            </div>

            {/* Bio */}
            {guru.bio && (
              <div className="prose prose-slate max-w-none text-lg leading-relaxed mb-12">
                {guru.bio}
              </div>
            )}

            {/* Services */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-5">Services Offered</h2>
              <div className="flex flex-wrap gap-3">
                {(guru.services || []).map((service, i) => (
                  <span key={i} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-slate-700 font-medium">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Book Now */}
            <Link
              href={`/bookings/new?provider=${guru.id}`}
              className="block w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-semibold rounded-3xl text-center shadow-lg transition"
            >
              Book Now with {guru.full_name}
            </Link>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow sticky top-8">
              <div className="text-sm text-slate-500">Starting Rate</div>
              <div className="text-5xl font-bold text-emerald-600 mt-1">
                ${guru.rate || "Contact"}
              </div>

              {guru.rating && (
                <div className="mt-8 flex items-center gap-3">
                  <span className="text-4xl">⭐</span>
                  <div>
                    <span className="text-3xl font-semibold">{guru.rating.toFixed(1)}</span>
                    <span className="text-slate-500 ml-3">({guru.review_count || 0} reviews)</span>
                  </div>
                </div>
              )}

              {/* Recent Reviews */}
              {reviews.length > 0 && (
                <div className="mt-10 pt-8 border-t border-slate-200">
                  <h3 className="font-semibold mb-5">Recent Reviews</h3>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-l-2 border-emerald-200 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                          <span className="text-sm text-slate-500">{review.customer_name || "Customer"}</span>
                        </div>
                        {review.comment && <p className="text-slate-600 mt-2 italic">"{review.comment}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}