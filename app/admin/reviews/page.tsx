import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

type BookingReviewRow = {
  id: string;
  booking_id: string | null;
  guru_id: string | null;
  customer_id: string | null;
  rating: number | null;
  review_text: string | null;
  would_rebook: boolean | null;
  is_public: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type GuruRow = {
  id: string;
  slug?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  rating_avg?: number | string | null;
  review_count?: number | string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type BookingRow = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  service_type?: string | null;
  service_key?: string | null;
  pet_name?: string | null;
  guru_name?: string | null;
  customer_name?: string | null;
  start_time?: string | null;
  booking_date?: string | null;
  requested_date?: string | null;
  created_at?: string | null;
};

type CountResult = {
  value: number | null;
  available: boolean;
};

const statusFilters = [
  { label: "All Reviews", href: "/admin/reviews" },
  { label: "Published Public", href: "/admin/reviews?status=published" },
  { label: "Private", href: "/admin/reviews?status=private" },
  { label: "Moderation", href: "/admin/reviews?status=moderation" },
];

const statusClassNames: Record<string, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-900",
  pending_review: "border-amber-200 bg-amber-50 text-amber-900",
  hidden: "border-slate-300 bg-slate-100 text-slate-900",
  removed: "border-rose-200 bg-rose-50 text-rose-900",
};

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function formatCount(result: CountResult, fallback = "Review") {
  return result.available && result.value !== null
    ? result.value.toLocaleString()
    : fallback;
}

async function safeCount(table: string, applyFilter?: (query: any) => any) {
  try {
    let query = supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (applyFilter) query = applyFilter(query);

    const { count, error } = await query;
    if (error) return { value: null, available: false };
    return { value: count ?? 0, available: true };
  } catch {
    return { value: null, available: false };
  }
}

function getPersonName(profile?: ProfileRow | null) {
  if (!profile) return "Pet Parent";

  const firstLast = [profile.first_name, profile.last_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

  return (
    String(
      profile.full_name || profile.display_name || profile.name || firstLast,
    ).trim() ||
    String(profile.email || "").split("@")[0] ||
    "Pet Parent"
  );
}

function getGuruName(guru?: GuruRow | null) {
  if (!guru) return "Guru";

  return (
    String(guru.display_name || guru.full_name || guru.name).trim() ||
    String(guru.email || "").split("@")[0] ||
    "Guru"
  );
}

function getGuruLocation(guru?: GuruRow | null) {
  if (!guru) return "Location not listed";
  const city = String(guru.city || "").trim();
  const state = String(guru.state || "").trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function getGuruPublicHref(guru?: GuruRow | null, fallbackId?: string | null) {
  const identifier = String(guru?.slug || guru?.id || fallbackId || "").trim();
  return identifier ? `/guru/${encodeURIComponent(identifier)}` : "/admin/gurus";
}

function getBookingDate(booking?: BookingRow | null) {
  const value =
    booking?.start_time ||
    booking?.booking_date ||
    booking?.requested_date ||
    booking?.created_at ||
    null;

  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date pending";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(value?: string | null) {
  return String(value || "published")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < rating ? "text-amber-500" : "text-slate-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
        {helper}
      </p>
    </div>
  );
}

async function fetchReviews(status?: string) {
  let query = supabaseAdmin
    .from("booking_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "published") {
    query = query.eq("status", "published").eq("is_public", true);
  }

  if (status === "private") {
    query = query.eq("is_public", false);
  }

  if (status === "moderation") {
    query = query.in("status", ["pending_review", "hidden", "removed"]);
  }

  const { data, error } = await query;

  if (error || !data) return [] as BookingReviewRow[];
  return data as BookingReviewRow[];
}

async function fetchRelatedRows(reviews: BookingReviewRow[]) {
  const guruIds = Array.from(
    new Set(reviews.map((review) => review.guru_id).filter(Boolean) as string[]),
  );
  const customerIds = Array.from(
    new Set(
      reviews.map((review) => review.customer_id).filter(Boolean) as string[],
    ),
  );
  const bookingIds = Array.from(
    new Set(
      reviews.map((review) => review.booking_id).filter(Boolean) as string[],
    ),
  );

  const [gurusResult, profilesResult, bookingsResult] = await Promise.all([
    guruIds.length
      ? supabaseAdmin
          .from("gurus")
          .select(
            "id,slug,full_name,display_name,name,email,city,state,rating_avg,review_count",
          )
          .in("id", guruIds)
      : Promise.resolve({ data: [] as GuruRow[] }),
    customerIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("id,full_name,display_name,name,first_name,last_name,email")
          .in("id", customerIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    bookingIds.length
      ? supabaseAdmin
          .from("bookings")
          .select(
            "id,status,payment_status,service_type,service_key,pet_name,guru_name,customer_name,start_time,booking_date,requested_date,created_at",
          )
          .in("id", bookingIds)
      : Promise.resolve({ data: [] as BookingRow[] }),
  ]);

  const guruMap = new Map<string, GuruRow>();
  ((gurusResult.data || []) as GuruRow[]).forEach((guru) => {
    guruMap.set(String(guru.id), guru);
  });

  const profileMap = new Map<string, ProfileRow>();
  ((profilesResult.data || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(String(profile.id), profile);
  });

  const bookingMap = new Map<string, BookingRow>();
  ((bookingsResult.data || []) as BookingRow[]).forEach((booking) => {
    bookingMap.set(String(booking.id), booking);
  });

  return { guruMap, profileMap, bookingMap };
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  await createClient();

  const resolvedSearchParams = await searchParams;
  const activeStatus = String(resolvedSearchParams?.status || "all");

  const [
    totalReviews,
    publicPublishedReviews,
    privateReviews,
    moderationReviews,
    wouldRebookReviews,
    reviews,
  ] = await Promise.all([
    safeCount("booking_reviews"),
    safeCount("booking_reviews", (query) =>
      query.eq("status", "published").eq("is_public", true),
    ),
    safeCount("booking_reviews", (query) => query.eq("is_public", false)),
    safeCount("booking_reviews", (query) =>
      query.in("status", ["pending_review", "hidden", "removed"]),
    ),
    safeCount("booking_reviews", (query) => query.eq("would_rebook", true)),
    fetchReviews(activeStatus),
  ]);

  const { guruMap, profileMap, bookingMap } = await fetchRelatedRows(reviews);

  const averageRating = reviews.length
    ? (
        reviews.reduce(
          (sum, review) => sum + readNumber(review.rating, 0),
          0,
        ) / reviews.length
      ).toFixed(1)
    : "New";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Admin Reviews
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                Reviews & Trust Signals
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-emerald-50 sm:text-base">
                Review Guru ratings, Pet Parent feedback, public/private status,
                would-book-again signals, and booking-level trust details.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total Reviews"
            value={formatCount(totalReviews, "0")}
            helper="All booking reviews in SitGuru"
          />
          <MetricCard
            label="Public Published"
            value={formatCount(publicPublishedReviews, "0")}
            helper="Reviews visible as public Guru trust signals"
          />
          <MetricCard
            label="Private Reviews"
            value={formatCount(privateReviews, "0")}
            helper="Feedback saved but not publicly displayed"
          />
          <MetricCard
            label="Moderation"
            value={formatCount(moderationReviews, "0")}
            helper="Pending, hidden, or removed review items"
          />
          <MetricCard
            label="Would Book Again"
            value={formatCount(wouldRebookReviews, "0")}
            helper={`Current list average rating: ${averageRating}`}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                Review Queue
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-700">
                Use this page to monitor review quality, verify real booking
                feedback, and confirm public trust signals are accurate.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive =
                  activeStatus === "all"
                    ? filter.href === "/admin/reviews"
                    : filter.href.includes(`status=${activeStatus}`);

                return (
                  <Link
                    key={filter.href}
                    href={filter.href}
                    className={`rounded-full border px-4 py-2 text-sm font-black shadow-sm transition ${
                      isActive
                        ? "border-emerald-300 bg-emerald-700 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-xl font-black text-slate-950">
                No reviews found
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                Reviews will appear here after Pet Parents submit feedback from a
                completed booking.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {reviews.map((review) => {
                const guru = review.guru_id ? guruMap.get(review.guru_id) : null;
                const customer = review.customer_id
                  ? profileMap.get(review.customer_id)
                  : null;
                const booking = review.booking_id
                  ? bookingMap.get(review.booking_id)
                  : null;
                const rating = Math.max(0, Math.min(5, readNumber(review.rating, 0)));
                const status = String(review.status || "published").toLowerCase();
                const statusClassName =
                  statusClassNames[status] ||
                  "border-slate-200 bg-slate-50 text-slate-900";

                return (
                  <article
                    key={review.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClassName}`}
                          >
                            {formatStatus(status)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                              review.is_public
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-slate-300 bg-slate-100 text-slate-900"
                            }`}
                          >
                            {review.is_public ? "Public" : "Private"}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                              review.would_rebook
                                ? "border-sky-200 bg-sky-50 text-sky-900"
                                : "border-amber-200 bg-amber-50 text-amber-900"
                            }`}
                          >
                            {review.would_rebook
                              ? "Would book again"
                              : "Would-book-again not selected"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Stars rating={rating} />
                          <p className="text-sm font-black text-slate-950">
                            {rating}/5 stars
                          </p>
                        </div>

                        <p className="mt-4 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-bold leading-7 text-slate-900">
                          {review.review_text || "No written review provided."}
                        </p>

                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                          Submitted {formatDateTime(review.created_at)}
                        </p>
                      </div>

                      <aside className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="grid gap-3">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                              Guru Reviewed
                            </p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {getGuruName(guru)}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {getGuruLocation(guru)}
                            </p>
                            <p className="mt-2 text-xs font-bold text-slate-600">
                              Current Guru rating: {readNumber(guru?.rating_avg, 0) > 0 ? readNumber(guru?.rating_avg, 0).toFixed(1) : "New"} · {readNumber(guru?.review_count, 0)} reviews
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                              Pet Parent
                            </p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {getPersonName(customer)}
                            </p>
                            {customer?.email ? (
                              <p className="mt-1 break-all text-sm font-bold text-slate-700">
                                {customer.email}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                              Booking
                            </p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {booking?.pet_name || "Pet care booking"}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {booking?.service_type || booking?.service_key || "Pet care"} · {getBookingDate(booking)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-600">
                              Status: {formatStatus(booking?.status || "unknown")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          <Link
                            href={getGuruPublicHref(guru, review.guru_id)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
                          >
                            View Guru
                          </Link>
                          <Link
                            href={
                              review.booking_id
                                ? `/admin/bookings?booking=${encodeURIComponent(review.booking_id)}`
                                : "/admin/bookings"
                            }
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-900 transition hover:bg-slate-100"
                          >
                            View Booking
                          </Link>
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
