"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MediaUpload from "@/components/MediaUpload";

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  state?: string | null;
  referral_code?: string | null;
  referral_points?: number | null;
  total_referrals?: number | null;
};

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
  referral_code?: string | null;
  referral_points?: number | null;
  total_referrals?: number | null;
  is_active?: boolean | null;
};

type BookingRow = {
  id: string;
  pet_name?: string | null;
  service?: string | null;
  booking_date?: string | null;
  status?: string | null;
  price?: number | null;
  pet_type?: string | null;
  city?: string | null;
  state?: string | null;
  customer_id?: string | null;
  sitter_id?: string | null;
};

type ReviewRow = {
  id: string;
  reviewer_name?: string | null;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

type ProviderMediaRow = {
  id: string;
  profile_id?: string | null;
  file_url: string;
  file_type?: string | null;
  caption?: string | null;
  created_at?: string | null;
};

type PetRow = {
  id: string;
  owner_profile_id?: string | null;
  name?: string | null;
  breed?: string | null;
  age?: string | null;
  size?: string | null;
  temperament?: string | null;
  medical_notes?: string | null;
  care_instructions?: string | null;
  story?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
};

type PetMediaRow = {
  id: string;
  pet_id?: string | null;
  owner_profile_id?: string | null;
  file_url: string;
  file_type?: string | null;
  caption?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

type PetStoryRow = {
  id: string;
  pet_id?: string | null;
  owner_profile_id?: string | null;
  title?: string | null;
  content?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

type ReferralCommission = {
  id: string;
  status?: "pending" | "approved" | "paid" | "rejected" | "canceled" | null;
  calculated_payout?: number | null;
  approved_payout?: number | null;
  created_at?: string | null;
};

type MessageRow = {
  id: string;
  sender_id?: string | null;
  recipient_id?: string | null;
  created_at?: string | null;
  is_read?: boolean | null;
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

function DashboardStatCard({
  label,
  value,
  subtext,
  accent,
  href,
  alert = false,
  alertText,
}: {
  label: string;
  value: string;
  subtext: string;
  accent?: string;
  href?: string;
  alert?: boolean;
  alertText?: string;
}) {
  const wrapperClass = alert
    ? "rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-white shadow-sm ring-1 ring-red-100"
    : "rounded-3xl border border-slate-200 bg-white shadow-sm";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {alert ? (
          <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        {value}
      </p>

      <p className={`mt-2 text-sm ${accent || "text-slate-600"}`}>{subtext}</p>

      {alert && alertText ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {alertText}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:-translate-y-0.5">
        <div className={`${wrapperClass} p-5 sm:p-6 hover:shadow-md`}>{body}</div>
      </Link>
    );
  }

  return <div className={`${wrapperClass} p-5 sm:p-6`}>{body}</div>;
}

function GuruActionButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
      : variant === "ghost"
        ? "inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
        : "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function formatMoney(value?: number | null) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRating(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "New";
  return value.toFixed(1);
}

function tierLabel(points: number) {
  if (points >= 500) return "Gold";
  if (points >= 250) return "Silver";
  if (points >= 100) return "Bronze";
  return "Starter";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLabel(dateString?: string | null) {
  if (!dateString) return "Date not set";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
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
  if (tone === "good") return "border border-green-200 bg-green-50 text-green-700";
  if (tone === "alert") return "border border-amber-200 bg-amber-50 text-amber-700";
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function bookingStatusClasses(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "confirmed") return "border border-green-200 bg-green-50 text-green-700";
  if (normalized === "pending") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "completed") return "border border-blue-200 bg-blue-50 text-blue-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function LineChart({
  points,
  stroke = "#10b981",
  dark = false,
}: {
  points: ChartPoint[];
  stroke?: string;
  dark?: boolean;
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
      <div
        className={`h-48 rounded-3xl border p-4 ${
          dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
        }`}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
          <polyline fill="none" stroke={stroke} strokeWidth="2.5" points={polyline} />
        </svg>
      </div>
      <div className={`mt-3 flex justify-between text-xs font-medium ${dark ? "text-white/60" : "text-slate-500"}`}>
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function RatioBar({
  leftLabel,
  rightLabel,
  leftPercent,
  rightPercent,
  leftColor = "bg-emerald-500",
  rightColor = "bg-cyan-500",
}: {
  leftLabel: string;
  rightLabel: string;
  leftPercent: number;
  rightPercent: number;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <div>
      <div className="h-5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className={leftColor} style={{ width: `${leftPercent}%` }} />
          <div className={rightColor} style={{ width: `${rightPercent}%` }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {leftLabel}: {leftPercent}%
        </span>
        <span className="font-medium text-slate-700">
          {rightLabel}: {rightPercent}%
        </span>
      </div>
    </div>
  );
}

async function safeSelect<T>(query: Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const result = await query;
  if (result.error || !result.data) return [];
  return result.data;
}

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sitter, setSitter] = useState<DashboardSitter | null>(null);

  const [providerBookings, setProviderBookings] = useState<BookingRow[]>([]);
  const [providerReviews, setProviderReviews] = useState<ReviewRow[]>([]);
  const [providerMedia, setProviderMedia] = useState<ProviderMediaRow[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);

  const [customerBookings, setCustomerBookings] = useState<BookingRow[]>([]);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [petMedia, setPetMedia] = useState<PetMediaRow[]>([]);
  const [petStories, setPetStories] = useState<PetStoryRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");

  const role = String(profile?.role || "").toLowerCase();
  const accountType = String(profile?.account_type || "").toLowerCase();

  const isAdmin = role === "admin";
  const isProvider =
    ["sitter", "walker", "caretaker", "guru", "provider"].includes(role) ||
    accountType.includes("sitter") ||
    accountType.includes("walker") ||
    accountType.includes("caretaker") ||
    accountType.includes("provider") ||
    accountType.includes("guru");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      setUploadMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, role, account_type, first_name, last_name, city, state, referral_code, referral_points, total_referrals",
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profileData) {
          setError(profileError?.message || "Unable to load your dashboard.");
          setLoading(false);
          return;
        }

        const typedProfile = profileData as ProfileRow;
        setProfile(typedProfile);

        if (String(typedProfile.role || "").toLowerCase() === "admin") {
          router.push("/admin");
          return;
        }

        const typedIsProvider =
          ["sitter", "walker", "caretaker", "guru", "provider"].includes(
            String(typedProfile.role || "").toLowerCase(),
          ) ||
          String(typedProfile.account_type || "").toLowerCase().includes("sitter") ||
          String(typedProfile.account_type || "").toLowerCase().includes("walker") ||
          String(typedProfile.account_type || "").toLowerCase().includes("caretaker") ||
          String(typedProfile.account_type || "").toLowerCase().includes("provider") ||
          String(typedProfile.account_type || "").toLowerCase().includes("guru");

        if (typedIsProvider) {
          const { data: sitterData } = await supabase
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
              referral_code,
              referral_points,
              total_referrals,
              is_active
            `)
            .eq("profile_id", user.id)
            .maybeSingle();

          if (sitterData) {
            setSitter(sitterData as DashboardSitter);
          }

          const providerId = sitterData?.id || "00000000-0000-0000-0000-000000000000";

          const [bookingRows, reviewRows, mediaRows, commissionRows] = await Promise.all([
            safeSelect<BookingRow>(
              supabase
                .from("bookings")
                .select(
                  "id, pet_name, service, booking_date, status, price, pet_type, city, state, customer_id, sitter_id",
                )
                .eq("sitter_id", providerId)
                .order("booking_date", { ascending: false })
                .limit(50),
            ),
            safeSelect<ReviewRow>(
              supabase
                .from("reviews")
                .select("id, reviewer_name, rating, comment, created_at")
                .eq("sitter_id", providerId)
                .order("created_at", { ascending: false })
                .limit(20),
            ),
            safeSelect<ProviderMediaRow>(
              supabase
                .from("provider_media")
                .select("id, profile_id, file_url, file_type, caption, created_at")
                .eq("profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20),
            ),
            safeSelect<ReferralCommission>(
              supabase
                .from("referral_commissions")
                .select("id, status, calculated_payout, approved_payout, created_at")
                .eq("referrer_profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20),
            ),
          ]);

          setProviderBookings(bookingRows);
          setProviderReviews(reviewRows);
          setProviderMedia(mediaRows);
          setCommissions(commissionRows);

          const reviewActivity: ActivityItem[] = reviewRows.slice(0, 4).map((review) => ({
            id: `review-${review.id}`,
            label: `${review.reviewer_name || "Client"} left a ${formatRating(review.rating)}★ review`,
            time: timeAgo(review.created_at),
            tone: "good",
          }));

          const bookingActivity: ActivityItem[] = bookingRows.slice(0, 4).map((booking) => ({
            id: `booking-${booking.id}`,
            label: `${booking.pet_name || "A pet"} booking is ${String(booking.status || "updated").toLowerCase()}`,
            time: formatDateLabel(booking.booking_date),
            tone: String(booking.status || "").toLowerCase() === "pending" ? "alert" : "neutral",
          }));

          setActivity([...reviewActivity, ...bookingActivity].slice(0, 8));
        } else {
          const [petRows, petMediaRows, bookingRows, storyRows, messageRows] = await Promise.all([
            safeSelect<PetRow>(
              supabase
                .from("pets")
                .select(
                  "id, owner_profile_id, name, breed, age, size, temperament, medical_notes, care_instructions, story, is_public, created_at",
                )
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false }),
            ),
            safeSelect<PetMediaRow>(
              supabase
                .from("pet_media")
                .select("id, pet_id, owner_profile_id, file_url, file_type, caption, visibility, created_at")
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(30),
            ),
            safeSelect<BookingRow>(
              supabase
                .from("bookings")
                .select(
                  "id, pet_name, service, booking_date, status, price, pet_type, city, state, customer_id, sitter_id",
                )
                .eq("customer_id", user.id)
                .order("booking_date", { ascending: false })
                .limit(30),
            ),
            safeSelect<PetStoryRow>(
              supabase
                .from("pet_stories")
                .select("id, pet_id, owner_profile_id, title, content, visibility, created_at")
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20),
            ),
            safeSelect<MessageRow>(
              supabase
                .from("messages")
                .select("id, sender_id, recipient_id, created_at, is_read")
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order("created_at", { ascending: false })
                .limit(100),
            ),
          ]);

          setPets(petRows);
          setPetMedia(petMediaRows);
          setCustomerBookings(bookingRows);
          setPetStories(storyRows);
          setMessages(messageRows);

          const storyActivity: ActivityItem[] = storyRows.slice(0, 4).map((story) => ({
            id: `story-${story.id}`,
            label: `You shared: ${story.title || "Pet update"}`,
            time: timeAgo(story.created_at),
            tone: "good",
          }));

          const mediaActivity: ActivityItem[] = petMediaRows.slice(0, 4).map((media) => ({
            id: `media-${media.id}`,
            label: `New ${String(media.file_type || "").toLowerCase() === "video" ? "video" : "photo"} added to your pet profile`,
            time: timeAgo(media.created_at),
            tone: "neutral",
          }));

          const bookingActivity: ActivityItem[] = bookingRows.slice(0, 4).map((booking) => ({
            id: `booking-${booking.id}`,
            label: `${booking.pet_name || "Your pet"} booking is ${String(booking.status || "updated").toLowerCase()}`,
            time: formatDateLabel(booking.booking_date),
            tone: String(booking.status || "").toLowerCase() === "pending" ? "alert" : "neutral",
          }));

          setActivity([...storyActivity, ...mediaActivity, ...bookingActivity].slice(0, 10));
        }
      } catch (err: any) {
        setError(err?.message || "Unable to load your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (!profile?.id || isProvider || isAdmin) return;

    const channel = supabase
      .channel(`dashboard-messages-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newRow = payload.new as MessageRow | undefined;
          const oldRow = payload.old as MessageRow | undefined;

          const isRelevant =
            newRow?.recipient_id === profile.id ||
            newRow?.sender_id === profile.id ||
            oldRow?.recipient_id === profile.id ||
            oldRow?.sender_id === profile.id;

          if (!isRelevant) return;

          setMessages((prev) => {
            if (payload.eventType === "INSERT" && newRow) {
              const exists = prev.some((msg) => msg.id === newRow.id);
              if (exists) return prev;
              return [newRow, ...prev];
            }

            if (payload.eventType === "UPDATE" && newRow) {
              return prev.map((msg) => (msg.id === newRow.id ? newRow : msg));
            }

            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, isProvider, isAdmin]);

  async function handleCopyCode() {
    const code = sitter?.referral_code || profile?.referral_code;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function saveProviderMedia(publicUrl: string) {
    if (!profile?.id) return;

    const { error: insertError } = await supabase.from("provider_media").insert({
      profile_id: profile.id,
      file_url: publicUrl,
      file_type: "image",
      caption: "Guru profile image",
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setProviderMedia((prev) => [
      {
        id: crypto.randomUUID(),
        profile_id: profile.id,
        file_url: publicUrl,
        file_type: "image",
        caption: "Guru profile image",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    setUploadMessage("Guru photo uploaded successfully.");
  }

  const providerStats = useMemo(() => {
    const points = Number(sitter?.referral_points ?? profile?.referral_points ?? 0);
    const totalReferrals = Number(sitter?.total_referrals ?? profile?.total_referrals ?? 0);

    const pending = commissions
      .filter((c) => c.status === "pending" || c.status === "approved")
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.approved_payout !== null && item.approved_payout !== undefined
              ? item.approved_payout
              : item.calculated_payout || 0,
          ),
        0,
      );

    const totalRevenue = providerBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
    const totalBookings = providerBookings.length;
    const avgSale = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const rating =
      sitter?.rating ??
      (providerReviews.length
        ? providerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          providerReviews.length
        : 0);

    const revenueMap = new Map<string, number>();
    const bookingCountMap = new Map<string, number>();
    let dogCount = 0;
    let catCount = 0;

    providerBookings.forEach((booking) => {
      const date = new Date(String(booking.booking_date || new Date().toISOString()));
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      revenueMap.set(label, (revenueMap.get(label) || 0) + Number(booking.price || 0));
      bookingCountMap.set(label, (bookingCountMap.get(label) || 0) + 1);

      const petType = String(booking.pet_type || "").toLowerCase();
      if (petType.includes("dog")) dogCount += 1;
      if (petType.includes("cat")) catCount += 1;
    });

    const totalKnownPetTypes = dogCount + catCount;
    const dogPercent = totalKnownPetTypes ? Math.round((dogCount / totalKnownPetTypes) * 100) : 0;
    const catPercent = totalKnownPetTypes ? Math.round((catCount / totalKnownPetTypes) * 100) : 0;

    return {
      points,
      totalReferrals,
      tier: tierLabel(points),
      pending,
      totalRevenue,
      totalBookings,
      avgSale,
      rating,
      dogCount,
      catCount,
      dogPercent,
      catPercent,
      revenueTrend: Array.from(revenueMap.entries())
        .slice(-7)
        .map(([label, value]) => ({ label, value })),
      bookingTrend: Array.from(bookingCountMap.entries())
        .slice(-7)
        .map(([label, value]) => ({ label, value })),
    };
  }, [profile, sitter, providerBookings, providerReviews, commissions]);

  const customerStats = useMemo(() => {
    const totalBookings = customerBookings.length;
    const confirmed = customerBookings.filter(
      (booking) => String(booking.status || "").toLowerCase() === "confirmed",
    ).length;
    const spent = customerBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
    const videos = petMedia.filter((item) => String(item.file_type || "").toLowerCase() === "video").length;
    const photos = petMedia.filter((item) => String(item.file_type || "").toLowerCase() !== "video").length;

    const unreadMessages = messages.filter(
      (message) => message.recipient_id === profile?.id && message.is_read === false,
    ).length;

    return {
      totalPets: pets.length,
      totalBookings,
      confirmed,
      spent,
      totalStories: petStories.length,
      totalPhotos: photos,
      totalVideos: videos,
      unreadMessages,
    };
  }, [pets, petMedia, petStories, messages, customerBookings, profile?.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading your dashboard...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <h1 className="text-3xl font-black text-slate-900">Dashboard error</h1>
            <p className="mt-4 text-slate-600">{error}</p>
          </Card>
        </div>
      </main>
    );
  }

  if (isAdmin) return null;

  const personName =
    (profile?.first_name || "").trim() ||
    (sitter?.full_name ? sitter.full_name.trim().split(/\s+/)[0] : "") ||
    "SitGuru";

  const personLocation = formatLocation(sitter?.city || profile?.city, sitter?.state || profile?.state);
  const hasMessageAlert = customerStats.unreadMessages > 0;
  const publicProfileHref = sitter?.slug ? `/sitter/${sitter.slug}` : sitter?.id ? `/sitter/${sitter.id}` : "/search";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {isProvider ? (
          <>
            <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                    SitGuru Guru Dashboard
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    Welcome back, {personName}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80">
                    {sitter?.title || "Trusted local pet caregiver"} • {personLocation}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                    Manage bookings, profile media, reviews, referral growth, and the public page your customers see.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <GuruActionButton href={publicProfileHref} variant="primary">
                    View Public Profile
                  </GuruActionButton>
                  <GuruActionButton href="/sitter-app/profile/edit" variant="ghost">
                    Edit Profile
                  </GuruActionButton>
                  <GuruActionButton href="/sitter-app/posts" variant="ghost">
                    Manage Posts
                  </GuruActionButton>
                  <GuruActionButton href="/sitter-app/availability" variant="ghost">
                    Set Availability
                  </GuruActionButton>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!isProvider ? (
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru Dashboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Welcome back, {personName}
            </h1>
            <p className="mt-2 text-slate-600">
              Manage pet profiles, social-style updates, bookings, media, and care details in one place.
            </p>
            <p className="mt-1 text-sm text-slate-500">{personLocation}</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isProvider ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                label="Total revenue"
                value={formatMoney(providerStats.totalRevenue)}
                subtext="All booking sales"
                accent="text-emerald-600"
              />
              <DashboardStatCard
                label="Average sale"
                value={formatMoney(providerStats.avgSale)}
                subtext={`${providerStats.totalBookings} total bookings`}
                accent="text-cyan-600"
              />
              <DashboardStatCard
                label="Referral points"
                value={String(providerStats.points)}
                subtext={`${providerStats.totalReferrals} total referrals`}
                accent="text-violet-600"
              />
              <DashboardStatCard
                label="Average rating"
                value={providerStats.rating ? `${formatRating(providerStats.rating)}★` : "New"}
                subtext={`${providerReviews.length} reviews`}
                accent="text-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6">
                <Card className="p-6 sm:p-7 hover:-translate-y-0.5 transition hover:shadow-md">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Guru storefront</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">Manage what customers see</h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Your dashboard is private. Use the tools below to update the public-facing profile,
                        posts, services, and availability that current and potential customers see.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Link
                        href={publicProfileHref}
                        className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Preview Public Page
                      </Link>
                      <Link
                        href="/sitter-app/profile/edit"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/sitter-app/posts"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Create / Manage Posts
                      </Link>
                      <Link
                        href="/sitter-app/services"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Services
                      </Link>
                    </div>
                  </div>
                </Card>

                <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white/60">Revenue trend</p>
                      <h2 className="mt-2 text-2xl font-black">Sales over time</h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Live
                    </span>
                  </div>
                  <div className="mt-6">
                    <LineChart
                      dark
                      points={
                        providerStats.revenueTrend.length
                          ? providerStats.revenueTrend
                          : [{ label: "Start", value: 0 }]
                      }
                    />
                  </div>
                </div>

                <Card className="p-6 sm:p-7 hover:-translate-y-0.5 transition hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Booking trend</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">Visits over time</h2>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      Tracked
                    </span>
                  </div>
                  <div className="mt-6">
                    <LineChart
                      points={
                        providerStats.bookingTrend.length
                          ? providerStats.bookingTrend
                          : [{ label: "Start", value: 0 }]
                      }
                      stroke="#06b6d4"
                    />
                  </div>
                </Card>

                <Card className="p-6 hover:-translate-y-0.5 transition hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
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
                    {providerBookings.length > 0 ? (
                      providerBookings.slice(0, 8).map((booking) => (
                        <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {booking.pet_name || "Pet booking"}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-emerald-600">
                                {booking.service || "Service"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {booking.pet_type || "Pet type not listed"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {booking.city || "Unknown city"}, {booking.state || "Unknown state"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {formatDateLabel(booking.booking_date)}
                              </p>
                            </div>

                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusClasses(
                                  booking.status,
                                )}`}
                              >
                                {booking.status || "Status pending"}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{formatMoney(booking.price)}</span>
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

              <div className="space-y-6">
                <Card className="p-6 hover:-translate-y-0.5 transition hover:shadow-md">
                  <p className="text-sm font-semibold text-slate-500">Pet type ratio</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Dogs vs cats</h3>
                  <div className="mt-6">
                    <RatioBar
                      leftLabel="Dogs"
                      rightLabel="Cats"
                      leftPercent={providerStats.dogPercent}
                      rightPercent={providerStats.catPercent}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-500">Dog bookings</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{providerStats.dogCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-500">Cat bookings</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{providerStats.catCount}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:-translate-y-0.5 transition hover:shadow-md">
                  <p className="text-sm font-semibold text-slate-500">Referral program</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Grow your SitGuru business</h3>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-500">Your referral code</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <p className="text-2xl font-black tracking-wider text-slate-900">
                        {sitter?.referral_code || profile?.referral_code || "No code yet"}
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        {copied ? "Copied" : "Copy code"}
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Share this code with gurus or customers you refer to SitGuru.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-500">Tier</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{providerStats.tier}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-500">Pending earnings</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">
                        {formatMoney(providerStats.pending)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:-translate-y-0.5 transition hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Profile media</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">Photos and gallery</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Add profile images to make your guru page feel more personal and trusted.
                      </p>
                    </div>

                    <Link
                      href="/sitter-app/posts"
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Manage posts
                    </Link>
                  </div>

                  <div className="mt-6">
                    <MediaUpload
                      bucket="provider-media"
                      folder={`provider-profile/${profile?.id || "provider"}`}
                      label="Upload Guru Photo"
                      accept="image/*"
                      onUploaded={saveProviderMedia}
                    />
                  </div>

                  {uploadMessage ? (
                    <p className="mt-3 text-sm font-medium text-emerald-600">{uploadMessage}</p>
                  ) : null}

                  <div className="mt-6">
                    {providerMedia.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {providerMedia.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={item.file_url}
                              alt={item.caption || "Guru photo"}
                              className="h-32 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No guru photos uploaded yet.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                label="My pets"
                value={String(customerStats.totalPets)}
                subtext="Pet profiles with care context"
                accent="text-emerald-600"
              />
              <DashboardStatCard
                label="Bookings"
                value={String(customerStats.totalBookings)}
                subtext={`${customerStats.confirmed} confirmed visits`}
                accent="text-cyan-600"
              />
              <DashboardStatCard
                label="Pet updates"
                value={String(customerStats.totalStories)}
                subtext={`${customerStats.totalPhotos} photos · ${customerStats.totalVideos} videos`}
                accent="text-violet-600"
              />
              <DashboardStatCard
                label="Messages"
                value={String(customerStats.unreadMessages)}
                subtext={hasMessageAlert ? "Unread messages in your inbox" : "No unread messages"}
                accent={hasMessageAlert ? "text-red-600" : "text-slate-600"}
                href="/dashboard/messages"
                alert={hasMessageAlert}
                alertText={hasMessageAlert ? "You have a new unread message." : undefined}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Pet profiles</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">Your pets</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Create the kind of rich pet profile that feels personal, memorable, and easy for gurus to understand.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/search"
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Book Care
                      </Link>
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Add Pet / Update Profile
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {pets.length > 0 ? (
                      pets.map((pet) => {
                        const mainMedia = petMedia.find((item) => item.pet_id === pet.id);

                        return (
                          <div key={pet.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                            <div className="h-52 bg-slate-200">
                              {mainMedia?.file_url ? (
                                <img
                                  src={mainMedia.file_url}
                                  alt={pet.name || "Pet"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                                  No pet photo yet
                                </div>
                              )}
                            </div>

                            <div className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-xl font-black text-slate-900">
                                    {pet.name || "Unnamed Pet"}
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {[pet.breed, pet.age, pet.size].filter(Boolean).join(" · ") ||
                                      "Profile details coming soon"}
                                  </p>
                                </div>

                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  {pet.is_public ? "Public" : "Private"}
                                </span>
                              </div>

                              <p className="mt-4 line-clamp-3 text-sm text-slate-600">
                                {pet.story ||
                                  "Add your pet’s personality, routine, favorite activities, and care notes to make bookings feel more personal."}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                        No pet profiles yet. Start by adding a pet profile with a photo, story, care instructions, and personality details.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Social-style updates</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">Pet stories and moments</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Use this area like a pet timeline for milestones, funny moments, care updates, and personality posts.
                      </p>
                    </div>

                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Add Update
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {petStories.length > 0 ? (
                      petStories.map((story) => (
                        <div key={story.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {story.title || "Pet update"}
                              </h3>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {story.visibility || "private"} · {formatDateTime(story.created_at)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                            {story.content || "No story content yet."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        No pet updates yet. This section is designed to become the social heart of the customer dashboard.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Bookings</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">Upcoming and recent visits</h2>
                    </div>

                    <Link
                      href="/bookings"
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View all bookings
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {customerBookings.length > 0 ? (
                      customerBookings.map((booking) => (
                        <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {booking.pet_name || "Pet booking"}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-emerald-600">
                                {booking.service || "Service"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {booking.pet_type || "Pet type not listed"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {booking.city || "Unknown city"}, {booking.state || "Unknown state"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {formatDateLabel(booking.booking_date)}
                              </p>
                            </div>

                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusClasses(
                                  booking.status,
                                )}`}
                              >
                                {booking.status || "Status pending"}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{formatMoney(booking.price)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        No bookings yet. Search gurus and start your first SitGuru booking.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <p className="text-sm font-semibold text-slate-500">Pet media</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Photos and videos</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Create a richer profile with pet photos, short videos, and updates that gurus can understand quickly.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {petMedia.length > 0 ? (
                      petMedia.slice(0, 10).map((item) => (
                        <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {String(item.file_type || "").toLowerCase() === "video" ? (
                            <div className="flex h-28 items-center justify-center bg-slate-200 text-xs font-semibold text-slate-600">
                              Video
                            </div>
                          ) : (
                            <img
                              src={item.file_url}
                              alt={item.caption || "Pet media"}
                              className="h-28 w-full object-cover"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No pet media uploaded yet.
                      </div>
                    )}
                  </div>
                </Card>

                <Card
                  className={`p-6 ${
                    hasMessageAlert
                      ? "border-red-200 bg-gradient-to-br from-red-50 via-white to-white ring-1 ring-red-100"
                      : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-500">Messaging</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Gurus and support</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Message gurus and support from your dedicated inbox.
                      </p>
                    </div>

                    {hasMessageAlert ? (
                      <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        Alert
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                      href="/dashboard/messages"
                      className={`rounded-2xl border p-4 transition ${
                        hasMessageAlert
                          ? "border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-500">Unread messages</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">
                        {customerStats.unreadMessages}
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          hasMessageAlert ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {hasMessageAlert ? "Open unread inbox" : "Open inbox"}
                      </p>
                    </Link>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-500">Quick support</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Customer, guru, and admin contact entry point
                      </p>
                    </div>
                  </div>

                  {hasMessageAlert ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      Hi! You have unread messages waiting in your inbox.
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3">
                    <Link
                      href="/dashboard/messages"
                      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white ${
                        hasMessageAlert ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {hasMessageAlert ? "Open messages now" : "Open messages"}
                    </Link>
                    <Link
                      href="/search"
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Find a guru to message/book
                    </Link>
                  </div>
                </Card>

                <Card className="p-6">
                  <p className="text-sm font-semibold text-slate-500">Recent activity</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Your pet timeline</h3>

                  <div className="mt-6 grid gap-3">
                    {activity.length > 0 ? (
                      activity.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${toneClasses(
                                item.tone,
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
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Activity will appear here as you add pet content and make bookings.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <p className="text-sm font-semibold text-slate-500">SitGuru advantage</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    More personal than a plain booking app
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p>Share pet stories, milestones, routines, and personality posts.</p>
                    <p>Use pet photos and videos to make care more informed and personal.</p>
                    <p>Support private, guru-only, and public-style profile sharing as the social layer grows.</p>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}