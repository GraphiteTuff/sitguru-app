import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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

type PostRow = {
  id: string;
  author_profile_id: string;
  audience: "public" | "followers" | "booking_private";
  post_type: "photo" | "video" | "story" | "update" | "text";
  caption?: string | null;
  is_provider_post: boolean;
  is_pet_post: boolean;
  is_story: boolean;
  status: "draft" | "published" | "hidden" | "flagged";
  created_at: string;
  updated_at: string;
};

type PostMediaRow = {
  id: string;
  post_id: string;
  media_type: "image" | "video";
  file_url: string;
  thumbnail_url?: string | null;
  sort_order: number;
  created_at: string;
};

type PostWithMedia = PostRow & {
  media: PostMediaRow[];
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

function formatDateLabel(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Updated to use "gurus" table
async function getGuru(slug: string) {
  const { data, error } = await supabase
    .from("gurus")                    // ← Changed from "sitters"
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
    `,
    )
    .eq("is_active", true)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (error) {
    console.error("Error loading guru:", error.message);
    return null;
  }

  return (data as Guru | null) || null;
}

async function getPublicPosts(guruId: string): Promise<PostWithMedia[]> {
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("author_profile_id", guruId)
    .eq("is_provider_post", true)
    .eq("status", "published")
    .eq("audience", "public")
    .order("created_at", { ascending: false })
    .limit(12);

  if (postsError || !postsData?.length) {
    if (postsError) {
      console.error("Error loading public provider posts:", postsError.message);
    }
    return [];
  }

  const postIds = postsData.map((post) => post.id);

  const { data: mediaData, error: mediaError } = await supabase
    .from("post_media")
    .select("*")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error("Error loading provider post media:", mediaError.message);
    return (postsData as PostRow[]).map((post) => ({
      ...post,
      media: [],
    }));
  }

  const mediaMap = new Map<string, PostMediaRow[]>();

  ((mediaData as PostMediaRow[]) || []).forEach((item) => {
    const existing = mediaMap.get(item.post_id) || [];
    existing.push(item);
    mediaMap.set(item.post_id, existing);
  });

  return (postsData as PostRow[]).map((post) => ({
    ...post,
    media: mediaMap.get(post.id) || [],
  }));
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="muted-panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default async function GuruProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const guru = await getGuru(slug);     // ← Changed function name

  if (!guru) {
    notFound();
  }

  const posts = await getPublicPosts(guru.id);

  const displayName = guru.full_name || "Trusted Guru";
  const rating = guru.rating ? guru.rating.toFixed(1) : "New";
  const reviewCount = guru.review_count ?? 0;
  const location = formatLocation(guru.city, guru.state);
  const price = formatPrice(guru.rate);
  const services = guru.services || [];
  const photoPosts = posts.filter((post) => post.post_type === "photo").length;
  const videoPosts = posts.filter((post) => post.post_type === "video").length;
  const storyPosts = posts.filter((post) => post.is_story).length;

  return (
    <main className="page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_380px] lg:items-start">
            <div className="panel overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <div className="relative min-h-[280px] bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-50">
                  {guru.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={guru.image_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center text-7xl">
                      🐾
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {guru.is_verified && <span className="chip">Verified</span>}
                    <span className="badge">⭐ {rating}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  <div className="section-kicker">Trusted local caregiver</div>

                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-5xl">
                    {displayName}
                  </h1>

                  <p className="mt-2 text-base font-medium text-slate-500">{location}</p>

                  {guru.title ? (
                    <p className="mt-4 text-sm font-semibold text-emerald-700 sm:text-base">
                      {guru.title}
                    </p>
                  ) : null}

                  <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                    {guru.bio ||
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

                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Reviews" value={`${reviewCount}`} />
                    <StatCard label="Posts" value={`${posts.length}`} />
                    <StatCard label="Photos" value={`${photoPosts}`} />
                    <StatCard label="Videos" value={`${videoPosts}`} />
                  </div>
                </div>
              </div>
            </div>

            <aside className="panel p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Starting rate</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    {price}
                  </p>
                </div>
                <span className="badge">{reviewCount} reviews</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <InfoCard
                  label="Experience"
                  value={`${guru.experience_years ?? 0}+ years caring for pets`}
                />
                <InfoCard
                  label="Response time"
                  value={guru.response_time || "Usually replies quickly"}
                />
                <InfoCard
                  label="Availability"
                  value="Check availability before booking"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/bookings/new?provider=${guru.id}`}
                  className="btn-primary w-full"
                >
                  Book now
                </Link>
                <Link
                  href={`/app/messages/new?provider=${guru.id}`}
                  className="btn-secondary w-full"
                >
                  Message provider
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
                <h2 className="mt-4">What this guru offers</h2>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                  Review service types, profile details, and clear trust signals
                  before choosing the right caregiver for your pet.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard label="Location" value={location} />
                  <InfoCard label="Pricing" value={price} />
                  <InfoCard
                    label="Verified profile"
                    value={guru.is_verified ? "Yes" : "Not listed"}
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
                  {guru.bio ||
                    "This caregiver provides dependable pet care with a focus on communication, consistency, and making pets feel comfortable during every visit or stay."}
                </p>
              </div>

              <div className="panel p-6 sm:p-7">
                <div className="section-kicker">Social profile</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="mt-1">Recent posts and updates</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                      Public photos, videos, and updates help pet owners see care style,
                      consistency, and personality before booking.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{posts.length} posts</span>
                    <span className="badge">{storyPosts} stories</span>
                  </div>
                </div>

                {posts.length === 0 ? (
                  <div className="mt-6 muted-panel p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      No public posts yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      This provider has not shared public updates yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6">
                    {posts.map((post) => (
                      <div key={post.id} className="muted-panel overflow-hidden">
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="chip">{post.post_type}</span>
                            {post.is_story ? <span className="badge">Story</span> : null}
                            <span className="badge">{formatDateLabel(post.created_at)}</span>
                          </div>

                          {post.caption ? (
                            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                              {post.caption}
                            </p>
                          ) : null}
                        </div>

                        {post.media.length > 0 ? (
                          <div
                            className={`grid gap-2 px-5 pb-5 ${
                              post.media.length === 1
                                ? "grid-cols-1"
                                : post.media.length === 2
                                  ? "grid-cols-1 sm:grid-cols-2"
                                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            }`}
                          >
                            {post.media.map((item) => (
                              <div
                                key={item.id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                              >
                                {item.media_type === "image" ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.file_url}
                                    alt="Provider post"
                                    className="aspect-square h-full w-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={item.file_url}
                                    className="aspect-square h-full w-full object-cover"
                                    controls
                                    playsInline
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
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
                <h3 className="mt-4">Keep exploring SitGuru</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Compare more local gurus, try another service type, or start
                  a booking request.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/search" className="btn-secondary w-full">
                    Browse more gurus
                  </Link>
                  <Link href="/become-a-sitter" className="btn-primary w-full">
                    Become a sitter
                  </Link>
                </div>
              </div>

              <div className="panel p-6">
                <div className="section-kicker">Profile activity</div>
                <h3 className="mt-4">Why this profile feels stronger</h3>
                <div className="mt-5 grid gap-3">
                  <InfoCard label="Public updates" value={`${posts.length} visible posts`} />
                  <InfoCard label="Stories shared" value={`${storyPosts} story update${storyPosts === 1 ? "" : "s"}`} />
                  <InfoCard label="Visual content" value={`${photoPosts + videoPosts} photo/video post${photoPosts + videoPosts === 1 ? "" : "s"}`} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}