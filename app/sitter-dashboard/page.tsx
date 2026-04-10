"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type DashboardSitter = {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  review_count?: number | null;
  response_time?: string | null;
  is_verified?: boolean | null;
  services?: string[] | null;
  referral_points?: number | null;
  total_referrals?: number | null;
};

type ReviewRow = {
  id: string;
  reviewer_name?: string | null;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

type BookingRow = {
  id: string;
  pet_name: string;
  service: string;
  booking_date: string;
  status: "Confirmed" | "Pending" | "Completed";
  price: number;
  pet_type?: string | null;
  city?: string | null;
  state?: string | null;
  customer_id?: string | null;
};

type ActivityItem = {
  id: string;
  label: string;
  time: string;
  tone: "good" | "neutral" | "alert";
};

type ChartPoint = {
  label: string;
  value: number;
};

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function formatRating(value?: number | null) {
  if (typeof value !== "number") return "New";
  return value.toFixed(1);
}

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateString?: string | null) {
  if (!dateString) return "Recently";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day ago`;
}

function toneClasses(tone: ActivityItem["tone"]) {
  if (tone === "good") return "bg-green-50 text-green-700 border border-green-200";
  if (tone === "alert") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function statusClasses(status: BookingRow["status"]) {
  if (status === "Confirmed") return "bg-green-50 text-green-700 border border-green-200";
  if (status === "Pending") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-blue-50 text-blue-700 border border-blue-200";
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string;
  subtext: string;
  accent?: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">{value}</p>
      <p className={`mt-2 text-sm ${accent || "text-slate-600"}`}>{subtext}</p>
    </Card>
  );
}

function LineChart({
  points,
  stroke = "#10b981",
}: {
  points: ChartPoint[];
  stroke?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const width = 100;
  const height = 50;

  const polyline = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point.value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <div className="h-52 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
          <polyline fill="none" stroke={stroke} strokeWidth="2.5" points={polyline} />
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  colorClass = "bg-emerald-500",
}: {
  data: ChartPoint[];
  colorClass?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = `${(item.value / max) * 100}%`;
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatioBar({
  dogPercent,
  catPercent,
}: {
  dogPercent: number;
  catPercent: number;
}) {
  return (
    <div>
      <div className="h-5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className="bg-emerald-500" style={{ width: `${dogPercent}%` }} />
          <div className="bg-cyan-500" style={{ width: `${catPercent}%` }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-emerald-700">Dogs: {dogPercent}%</span>
        <span className="font-medium text-cyan-700">Cats: {catPercent}%</span>
      </div>
    </div>
  );
}

export default function SitterDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sitter, setSitter] = useState<DashboardSitter | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard(authUserId?: string | null) {
    setLoading(true);
    setError("");

    const activeUserId = authUserId ?? userId;

    if (!activeUserId) {
      setError("You must be logged in to view the sitter dashboard.");
      setLoading(false);
      return;
    }

    const { data: sitterRows, error: sitterError } = await supabase
      .from("sitters")
      .select(`
        id,
        profile_id,
        slug,
        full_name,
        title,
        city,
        state,
        rating,
        review_count,
        response_time,
        is_verified,
        services,
        referral_points,
        total_referrals,
        is_active
      `)
      .eq("profile_id", activeUserId)
      .eq("is_active", true)
      .limit(1);

    if (sitterError) {
      setError(sitterError.message);
      setLoading(false);
      return;
    }

    const activeSitter = (sitterRows?.[0] as DashboardSitter | undefined) || null;
    setSitter(activeSitter);

    if (!activeSitter?.id) {
      setBookings([]);
      setReviews([]);
      setActivity([]);
      setLoading(false);
      return;
    }

    const [{ data: bookingRows, error: bookingError }, { data: reviewRows, error: reviewError }] =
      await Promise.all([
        supabase
          .from("bookings")
          .select("id, pet_name, service, booking_date, status, price, pet_type, city, state, customer_id")
          .eq("sitter_id", activeSitter.id)
          .order("booking_date", { ascending: true })
          .limit(50),
        supabase
          .from("reviews")
          .select("id, reviewer_name, rating, comment, created_at")
          .eq("sitter_id", activeSitter.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (bookingError) setError(bookingError.message);
    if (reviewError) setError(reviewError.message);

    const safeBookings = (bookingRows as BookingRow[]) || [];
    const safeReviews = (reviewRows as ReviewRow[]) || [];

    setBookings(safeBookings);
    setReviews(safeReviews);

    const reviewActivity: ActivityItem[] = safeReviews.slice(0, 4).map((review) => ({
      id: `review-${review.id}`,
      label: `${review.reviewer_name || "Client"} left a ${formatRating(review.rating)}★ review`,
      time: timeAgo(review.created_at),
      tone: "good",
    }));

    const bookingActivity: ActivityItem[] = safeBookings.slice(0, 4).map((booking) => ({
      id: `booking-${booking.id}`,
      label: `${booking.pet_name} booking is ${booking.status.toLowerCase()}`,
      time: formatDateLabel(booking.booking_date),
      tone: booking.status === "Pending" ? "alert" : "neutral",
    }));

    setActivity([...reviewActivity, ...bookingActivity].slice(0, 6));
    setLoading(false);
  }

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view the sitter dashboard.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadDashboard(user.id);
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!sitter?.id) return;

    const bookingsChannel = supabase
      .channel(`sitter-dashboard-bookings-${sitter.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `sitter_id=eq.${sitter.id}` },
        () => loadDashboard()
      )
      .subscribe();

    const reviewsChannel = supabase
      .channel(`sitter-dashboard-reviews-${sitter.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `sitter_id=eq.${sitter.id}` },
        () => loadDashboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, [sitter?.id]);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
    const totalBookings = bookings.length;

    const uniqueCustomers = new Set(
      bookings.map((b) => b.customer_id).filter(Boolean)
    ).size;

    const avgSale = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const revenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

    const rating =
      sitter?.rating ??
      (reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
        : 0);

    const reviewCount = sitter?.review_count ?? reviews.length;
    const pendingCount = bookings.filter((b) => b.status === "Pending").length;

    const revenueMap = new Map<string, number>();
    const bookingCountMap = new Map<string, number>();

    bookings.forEach((booking) => {
      const date = new Date(booking.booking_date);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      revenueMap.set(label, (revenueMap.get(label) || 0) + Number(booking.price || 0));
      bookingCountMap.set(label, (bookingCountMap.get(label) || 0) + 1);
    });

    const revenueTrend = Array.from(revenueMap.entries()).slice(-7).map(([label, value]) => ({
      label,
      value,
    }));

    const bookingTrend = Array.from(bookingCountMap.entries()).slice(-7).map(([label, value]) => ({
      label,
      value,
    }));

    let dogCount = 0;
    let catCount = 0;

    bookings.forEach((booking) => {
      const petType = (booking.pet_type || "").toLowerCase();
      if (petType.includes("dog")) dogCount += 1;
      if (petType.includes("cat")) catCount += 1;
    });

    const totalKnownPetTypes = dogCount + catCount;
    const dogPercent = totalKnownPetTypes ? Math.round((dogCount / totalKnownPetTypes) * 100) : 0;
    const catPercent = totalKnownPetTypes ? Math.round((catCount / totalKnownPetTypes) * 100) : 0;

    const cityRevenueMap = new Map<string, number>();
    const stateRevenueMap = new Map<string, number>();

    bookings.forEach((booking) => {
      const city = booking.city || "Unknown city";
      const state = booking.state || "Unknown state";
      const revenue = Number(booking.price || 0);

      cityRevenueMap.set(city, (cityRevenueMap.get(city) || 0) + revenue);
      stateRevenueMap.set(state, (stateRevenueMap.get(state) || 0) + revenue);
    });

    const topCities = Array.from(cityRevenueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    const topStates = Array.from(stateRevenueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    const referralPoints = sitter?.referral_points ?? 0;
    const totalReferrals = sitter?.total_referrals ?? 0;
    const referralTier =
      referralPoints >= 500 ? "Gold" : referralPoints >= 250 ? "Silver" : referralPoints >= 100 ? "Bronze" : "Starter";

    return {
      revenue: formatMoney(totalRevenue),
      bookings: String(totalBookings),
      rating: rating ? `${formatRating(rating)}★` : "New",
      reviews: `${reviewCount} reviews`,
      responseTime: sitter?.response_time || "Within 1 hour",
      profileCompletion: pendingCount > 0 ? `${pendingCount} pending` : "Up to date",
      avgSale: formatMoney(avgSale),
      revenuePerCustomer: formatMoney(revenuePerCustomer),
      uniqueCustomers: String(uniqueCustomers),
      dogPercent,
      catPercent,
      dogCount,
      catCount,
      topCities,
      topStates,
      revenueTrend: revenueTrend.length ? revenueTrend : [{ label: "Start", value: 0 }],
      bookingTrend: bookingTrend.length ? bookingTrend : [{ label: "Start", value: 0 }],
      referralPoints,
      totalReferrals,
      referralTier,
    };
  }, [sitter, bookings, reviews]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-slate-900 text-lg font-semibold">Loading sitter dashboard...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (error && !sitter) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <h1 className="text-3xl font-black text-slate-900">Sitter dashboard</h1>
            <p className="mt-4 text-slate-600">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Log in
              </Link>
              <Link
                href="/become-a-sitter"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Become a sitter
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!sitter) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <h1 className="text-3xl font-black text-slate-900">No sitter profile found</h1>
            <p className="mt-4 text-slate-600">
              Your account does not have an active sitter profile yet.
            </p>
            <div className="mt-6">
              <Link
                href="/become-a-sitter"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Complete sitter setup
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const sitterName = sitter.full_name || "Trusted Sitter";
  const sitterTitle = sitter.title || "Pet Care Provider";
  const sitterLocation = formatLocation(sitter.city, sitter.state);
  const services = sitter.services || [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-600">PawNecto Dashboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {sitterName}
          </h1>
          <p className="mt-2 text-slate-600">
            {sitterTitle} · {sitterLocation}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={stats.revenue}
            subtext="All booking sales"
            accent="text-emerald-600"
          />
          <StatCard
            label="Average sale"
            value={stats.avgSale}
            subtext="Revenue per booking"
            accent="text-cyan-600"
          />
          <StatCard
            label="Revenue per customer"
            value={stats.revenuePerCustomer}
            subtext={`${stats.uniqueCustomers} unique customers`}
            accent="text-violet-600"
          />
          <StatCard
            label="Average rating"
            value={stats.rating}
            subtext={stats.reviews}
            accent="text-amber-600"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-6">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Revenue trend</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Sales over time</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </div>
              <div className="mt-6">
                <LineChart points={stats.revenueTrend} stroke="#10b981" />
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Booking volume</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Bookings trend</h2>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200">
                  Tracked
                </span>
              </div>
              <div className="mt-6">
                <LineChart points={stats.bookingTrend} stroke="#06b6d4" />
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Upcoming bookings</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Today and next visits</h2>
                </div>
                <Link
                  href="/bookings"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View all bookings
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{booking.pet_name}</h3>
                          <p className="mt-1 text-sm font-semibold text-emerald-600">
                            {booking.service}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {booking.pet_type || "Pet type not listed"}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {formatDateLabel(booking.booking_date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatMoney(Number(booking.price || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No bookings yet. Once bookings are added, they will appear here automatically.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Pet type ratio</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Dogs vs cats</h3>
              <div className="mt-6">
                <RatioBar dogPercent={stats.dogPercent} catPercent={stats.catPercent} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Dog bookings</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{stats.dogCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Cat bookings</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{stats.catCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Best city potential</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Top cities by revenue</h3>
              <div className="mt-6">
                <SimpleBarChart
                  data={
                    stats.topCities.length
                      ? stats.topCities.map((item) => ({
                          label: item.label,
                          value: Number(item.value),
                        }))
                      : [{ label: "No city data", value: 0 }]
                  }
                  colorClass="bg-emerald-500"
                />
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Best state potential</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Top states by revenue</h3>
              <div className="mt-6">
                <SimpleBarChart
                  data={
                    stats.topStates.length
                      ? stats.topStates.map((item) => ({
                          label: item.label,
                          value: Number(item.value),
                        }))
                      : [{ label: "No state data", value: 0 }]
                  }
                  colorClass="bg-cyan-500"
                />
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Referral growth</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Partner referral points</h3>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Points</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{stats.referralPoints}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Referrals</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalReferrals}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">Current tier</p>
                <p className="mt-1 text-xl font-black text-slate-900">{stats.referralTier}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Suggested system: 100 points per sitter referral, 75 per walker referral, 50 per caretaker referral.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Live activity</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Recent updates</h3>

              <div className="mt-6 grid gap-3">
                {activity.length > 0 ? (
                  activity.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${toneClasses(
                            item.tone
                          )}`}
                        >
                          {item.tone === "good" ? "✓" : item.tone === "alert" ? "!" : "•"}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Activity will appear here when bookings and reviews change.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Profile overview</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Public sitter profile</h3>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Display name</p>
                  <p className="mt-1 text-sm text-slate-900">{sitterName}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Location</p>
                  <p className="mt-1 text-sm text-slate-900">{sitterLocation}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Services</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"
                        >
                          {service}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        Pet care available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/sitter/${sitter.slug || sitter.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  View public profile
                </Link>
                <Link
                  href="/become-a-sitter"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit sitter setup
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}