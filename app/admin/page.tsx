"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarDays,
  Cat,
  ChevronRight,
  CreditCard,
  Dog,
  Flag,
  Globe2,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  PawPrint,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UserSquare2,
  Wallet,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  state?: string | null;
  approval_status?: string | null;
  is_active?: boolean | null;
  pet_types?: string[] | string | null;
  created_at?: string | null;
};

type GuruRow = {
  id: string;
  profile_id?: string | null;
  full_name?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

type BookingRow = {
  id: string;
  price?: number | null;
  status?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
  city?: string | null;
  state?: string | null;
  pet_type?: string | null;
  pet_name?: string | null;
  service?: string | null;
  customer_id?: string | null;
  sitter_id?: string | null;
};

type ActivityItem = {
  id: string;
  label: string;
  timeLabel: string;
  tone: "good" | "neutral" | "alert";
  sortTime: number;
  href?: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

const BREAKEVEN_TARGETS = {
  daily: 250,
  weekly: 1750,
  monthly: 7500,
  yearly: 90000,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Premium Glassmorphism Card
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/20 bg-white/75 backdrop-blur-2xl shadow-2xl shadow-black/10 transition-all duration-300 hover:shadow-[0_30px_70px_-15px_rgb(0,0,0,0.2)] hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.125em] text-emerald-600">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-black tracking-tighter text-slate-900">{title}</h2>
      {description && <p className="mt-3 text-slate-600">{description}</p>}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", active ? "text-white" : "text-slate-400")} />
    </Link>
  );
}

function StatCard({
  label,
  value,
  subtext,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  subtext: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : tone === "info"
      ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
      : "bg-slate-100 text-slate-700 border border-slate-200";

  const content = (
    <GlassCard className="h-full p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-4 text-4xl font-black tracking-tighter text-slate-900">{value}</p>
          <p className="mt-3 text-sm text-slate-600">{subtext}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-2xl border p-4", toneClasses)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </GlassCard>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ActionCard({
  title,
  body,
  href,
  icon: Icon,
}: {
  title: string;
  body: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const content = (
    <GlassCard className="h-full p-7">
      <div className="flex items-start gap-5">
        <div className="rounded-2xl bg-white/70 p-4 text-slate-700 shadow-inner">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-3 text-slate-600 leading-relaxed">{body}</p>
          {href && <p className="mt-5 text-sm font-semibold text-emerald-600">Open section →</p>}
        </div>
      </div>
    </GlassCard>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function BarList({
  items,
  colorClass = "bg-emerald-500",
}: {
  items: ChartPoint[];
  colorClass?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-5">
      {items.map((item) => {
        const width = `${(item.value / max) * 100}%`;
        return (
          <div key={item.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={cn("h-full rounded-full shadow-sm", colorClass)} style={{ width }} />
            </div>
          </div>
        );
      })}
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
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className={leftColor} style={{ width: `${leftPercent}%` }} />
          <div className={rightColor} style={{ width: `${rightPercent}%` }} />
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm font-medium">
        <span>{leftLabel}: {leftPercent}%</span>
        <span>{rightLabel}: {rightPercent}%</span>
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  if (tone === "good") return "bg-green-100 text-green-700 border border-green-200";
  if (tone === "alert") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function normalizePetTypes(value: ProfileRow["pet_types"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).toLowerCase());
  return [String(value).toLowerCase()];
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "Unknown user";
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  return profile.role ? `${profile.role} account` : "User";
}

function getDateValue(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getPeriodRevenue(bookings: BookingRow[], period: "daily" | "weekly" | "monthly" | "yearly") {
  const now = new Date();
  return bookings.reduce((sum, booking) => {
    const rawDate = booking.booking_date || booking.created_at;
    if (!rawDate) return sum;
    const bookingDate = new Date(rawDate);
    if (Number.isNaN(bookingDate.getTime())) return sum;

    let include = false;
    if (period === "daily") {
      include = bookingDate.getFullYear() === now.getFullYear() &&
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getDate() === now.getDate();
    } else if (period === "weekly") {
      const diffDays = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
      include = diffDays >= 0 && diffDays <= 7;
    } else if (period === "monthly") {
      include = bookingDate.getFullYear() === now.getFullYear() && bookingDate.getMonth() === now.getMonth();
    } else if (period === "yearly") {
      include = bookingDate.getFullYear() === now.getFullYear();
    }
    return include ? sum + Number(booking.price || 0) : sum;
  }, 0);
}

function getBreakevenPercent(value: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/admin/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile || String(profile.role || "").toLowerCase() !== "admin") {
          await supabase.auth.signOut();
          router.push("/admin/login");
          return;
        }

        setAdminProfile(profile as AdminProfile);

        const [{ data: profileRows, error: profilesError }, { data: guruRows, error: gurusError }, { data: bookingRows, error: bookingsError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, role, account_type, first_name, last_name, city, state, approval_status, is_active, pet_types, created_at")
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("gurus")
            .select("id, profile_id, full_name, title, city, state, is_active, is_verified, created_at")
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("bookings")
            .select("id, price, status, booking_date, created_at, city, state, pet_type, pet_name, service, customer_id, sitter_id")
            .order("booking_date", { ascending: false })
            .limit(500),
        ]);

        if (profilesError) throw new Error(profilesError.message);
        if (gurusError) throw new Error(gurusError.message);
        if (bookingsError) throw new Error(bookingsError.message);

        const safeProfiles = (profileRows as ProfileRow[]) || [];
        const safeGurus = (guruRows as GuruRow[]) || [];
        const safeBookings = (bookingRows as BookingRow[]) || [];

        setProfiles(safeProfiles);
        setGurus(safeGurus);
        setBookings(safeBookings);

        const profileMap = new Map<string, ProfileRow>(safeProfiles.map((item) => [item.id, item]));
        const guruMap = new Map<string, GuruRow>(safeGurus.map((item) => [item.id, item]));

        const profileActivity: ActivityItem[] = safeProfiles.slice(0, 5).map((item) => ({
          id: `profile-${item.id}`,
          label: `${getProfileName(item)} created a ${String(item.role || "user").toLowerCase()} account`,
          timeLabel: timeAgo(item.created_at),
          tone: "good",
          sortTime: getDateValue(item.created_at),
        }));

        const guruActivity: ActivityItem[] = safeGurus.slice(0, 5).map((item) => ({
          id: `guru-${item.id}`,
          label: `${item.full_name || "New guru"} created a ${String(item.title || "").toLowerCase().includes("caretaker") ? "caretaker" : "guru"} profile`,
          timeLabel: timeAgo(item.created_at),
          tone: item.is_active === false ? "neutral" : "good",
          sortTime: getDateValue(item.created_at),
          href: "/admin/gurus",
        }));

        const bookingActivity: ActivityItem[] = safeBookings.slice(0, 10).map((item) => {
          const customer = item.customer_id ? profileMap.get(item.customer_id) : null;
          const guru = item.sitter_id ? guruMap.get(item.sitter_id) : null;
          const customerName = getProfileName(customer);
          const guruName = guru?.full_name || "Guru";
          const status = String(item.status || "updated").toLowerCase();
          const price = formatMoney(Number(item.price || 0));

          return {
            id: `booking-${item.id}`,
            label: `${customerName} booked ${guruName}${item.service ? ` for ${item.service}` : ""}${item.pet_name ? ` (${item.pet_name})` : ""} — ${status} — ${price}`,
            timeLabel: timeAgo(item.booking_date || item.created_at),
            tone: status === "pending" ? "alert" : status === "confirmed" || status === "completed" ? "good" : "neutral",
            sortTime: getDateValue(item.booking_date || item.created_at),
            href: "/admin/bookings",
          };
        });

        const mergedActivity = [...profileActivity, ...guruActivity, ...bookingActivity]
          .sort((a, b) => b.sortTime - a.sortTime)
          .slice(0, 12);

        setActivity(mergedActivity);
      } catch (err: any) {
        setError(err?.message || "Unable to load admin dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-hq-live-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadDashboard(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "gurus" }, () => void loadDashboard(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void loadDashboard(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id, loadDashboard]);

  const stats = useMemo(() => {
    // Your full original stats logic (kept 100% intact)
    const gurusFromProfiles = profiles.filter((p) =>
      ["sitter", "walker", "caretaker", "guru", "provider"].includes((p.role || "").toLowerCase())
    );

    const customers = profiles.filter((p) => (p.role || "").toLowerCase() === "customer");
    const admins = profiles.filter((p) => (p.role || "").toLowerCase() === "admin");
    const sittersOnly = gurusFromProfiles.filter((p) => (p.role || "").toLowerCase() === "sitter");
    const walkers = gurusFromProfiles.filter((p) => (p.role || "").toLowerCase() === "walker");
    const caretakers = gurusFromProfiles.filter((p) => (p.role || "").toLowerCase() === "caretaker");
    const directGurus = gurusFromProfiles.filter((p) => ["guru", "provider"].includes((p.role || "").toLowerCase()));

    const activeGurus = gurusFromProfiles.filter((p) => p.is_active !== false);
    const pendingApprovals = gurusFromProfiles.filter((p) => (p.approval_status || "").toLowerCase() === "pending");

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
    const dailyRevenue = getPeriodRevenue(bookings, "daily");
    const weeklyRevenue = getPeriodRevenue(bookings, "weekly");
    const monthlyRevenue = getPeriodRevenue(bookings, "monthly");
    const yearlyRevenue = getPeriodRevenue(bookings, "yearly");

    // Geography maps
    const guruCityMap = new Map<string, number>();
    const guruStateMap = new Map<string, number>();
    const salesCityMap = new Map<string, number>();
    const salesStateMap = new Map<string, number>();

    gurus.forEach((guru) => {
      const city = guru.city || "Unknown city";
      const state = guru.state || "Unknown state";
      guruCityMap.set(city, (guruCityMap.get(city) || 0) + 1);
      guruStateMap.set(state, (guruStateMap.get(state) || 0) + 1);
    });

    bookings.forEach((booking) => {
      const city = booking.city || "Unknown city";
      const state = booking.state || "Unknown state";
      const price = Number(booking.price || 0);
      salesCityMap.set(city, (salesCityMap.get(city) || 0) + price);
      salesStateMap.set(state, (salesStateMap.get(state) || 0) + price);
    });

    const topGuruCities = Array.from(guruCityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
    const topGuruStates = Array.from(guruStateMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
    const topSalesCities = Array.from(salesCityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value: Math.round(value) }));
    const topSalesStates = Array.from(salesStateMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value: Math.round(value) }));

    let dogGuruCount = 0, catGuruCount = 0;
    gurusFromProfiles.forEach((guru) => {
      const petTypes = normalizePetTypes(guru.pet_types);
      if (petTypes.some((p) => p.includes("dog"))) dogGuruCount += 1;
      if (petTypes.some((p) => p.includes("cat"))) catGuruCount += 1;
    });

    let dogBookingCount = 0, catBookingCount = 0;
    bookings.forEach((booking) => {
      const petType = String(booking.pet_type || "").toLowerCase();
      if (petType.includes("dog")) dogBookingCount += 1;
      if (petType.includes("cat")) catBookingCount += 1;
    });

    const totalKnownGuruPetTypes = dogGuruCount + catGuruCount;
    const totalKnownBookingPetTypes = dogBookingCount + catBookingCount;

    const dogGuruPercent = totalKnownGuruPetTypes ? Math.round((dogGuruCount / totalKnownGuruPetTypes) * 100) : 0;
    const catGuruPercent = totalKnownGuruPetTypes ? Math.round((catGuruCount / totalKnownGuruPetTypes) * 100) : 0;
    const dogBookingPercent = totalKnownBookingPetTypes ? Math.round((dogBookingCount / totalKnownBookingPetTypes) * 100) : 0;
    const catBookingPercent = totalKnownBookingPetTypes ? Math.round((catBookingCount / totalKnownBookingPetTypes) * 100) : 0;

    const completedBookings = bookings.filter((b) => String(b.status || "").toLowerCase() === "completed").length;
    const confirmedBookings = bookings.filter((b) => String(b.status || "").toLowerCase() === "confirmed").length;
    const pendingBookings = bookings.filter((b) => String(b.status || "").toLowerCase() === "pending").length;

    return {
      totalRevenue,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalBookings: bookings.length,
      totalGurus: gurus.length || gurusFromProfiles.length,
      totalCustomers: customers.length,
      totalAdmins: admins.length,
      totalSitters: sittersOnly.length,
      totalWalkers: walkers.length,
      totalCaretakers: caretakers.length,
      activeGurus: activeGurus.length,
      pendingApprovals: pendingApprovals.length,
      topGuruCities,
      topGuruStates,
      topSalesCities,
      topSalesStates,
      dogGuruCount,
      catGuruCount,
      dogBookingCount,
      catBookingCount,
      dogGuruPercent,
      catGuruPercent,
      dogBookingPercent,
      catBookingPercent,
      dailyBreakevenPercent: getBreakevenPercent(dailyRevenue, BREAKEVEN_TARGETS.daily),
      weeklyBreakevenPercent: getBreakevenPercent(weeklyRevenue, BREAKEVEN_TARGETS.weekly),
      monthlyBreakevenPercent: getBreakevenPercent(monthlyRevenue, BREAKEVEN_TARGETS.monthly),
      yearlyBreakevenPercent: getBreakevenPercent(yearlyRevenue, BREAKEVEN_TARGETS.yearly),
      hqStaffCount: admins.length,
      techOperationalAlerts: pendingBookings,
      completedBookings,
      confirmedBookings,
      pendingBookings,
    };
  }, [profiles, gurus, bookings]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-950 flex items-center justify-center">
        <GlassCard className="p-12 text-center">
          <RefreshCcw className="mx-auto h-9 w-9 animate-spin text-emerald-600" />
          <p className="mt-6 text-xl font-semibold text-slate-900">Loading SitGuru HQ...</p>
        </GlassCard>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-950 flex items-center justify-center p-6">
        <GlassCard className="max-w-md p-10 text-center">
          <AlertTriangle className="mx-auto h-14 w-14 text-red-500" />
          <h1 className="mt-6 text-2xl font-black">Dashboard Error</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <button onClick={() => void loadDashboard(true)} className="mt-8 w-full rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white hover:bg-emerald-700">
            Try Again
          </button>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-950">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        {/* Sidebar */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <GlassCard className="sticky top-8 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-9 text-white relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent)]" />
              <div className="relative flex items-center gap-4">
                <div className="rounded-2xl bg-white/20 p-3.5 backdrop-blur">
                  <PawPrint className="h-9 w-9" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[3px] text-white/70">SITGURU</p>
                  <h1 className="text-4xl font-black tracking-tighter">HQ</h1>
                </div>
              </div>
              <p className="mt-8 text-sm text-white/80">Executive Command Center</p>
            </div>

            <div className="p-6">
              <nav className="space-y-1">
                <SidebarLink href="/admin" label="Dashboard" icon={LayoutDashboard} active />
                <SidebarLink href="/admin/gurus" label="Gurus" icon={Users} />
                <SidebarLink href="/admin/bookings" label="Bookings" icon={CalendarDays} />
                <SidebarLink href="/admin/reviews" label="Reviews" icon={Star} />
                <SidebarLink href="/admin/disputes" label="Disputes" icon={Scale} />
                <SidebarLink href="/admin/referrals" label="Referrals" icon={Sparkles} />
                <SidebarLink href="/admin/support" label="Support" icon={LifeBuoy} />
                <SidebarLink href="/admin/settings" label="Settings" icon={Settings} />
              </nav>

              <button
                onClick={handleLogout}
                className="mt-12 w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-red-400 hover:bg-red-950/30 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </GlassCard>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-10">
          {/* Hero Header */}
          <GlassCard className="overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 px-10 py-16 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:50px_50px]" />
              <div className="relative">
                <div className="inline-flex rounded-full bg-white/10 px-5 py-1 text-xs font-medium tracking-widest">LIVE PLATFORM CONTROL</div>
                <h1 className="mt-6 text-6xl font-black tracking-tighter">SitGuru HQ</h1>
                <p className="mt-4 max-w-lg text-xl text-white/80">
                  Real-time oversight for revenue, operations, growth &amp; safety.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    onClick={() => void loadDashboard(true)}
                    disabled={refreshing}
                    className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 hover:bg-white/95 transition disabled:opacity-70"
                  >
                    <RefreshCcw className={cn("h-5 w-5", refreshing && "animate-spin")} />
                    Refresh Dashboard
                  </button>
                  <Link
                    href="/admin/bookings"
                    className="flex items-center gap-3 rounded-2xl border border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/10 transition"
                  >
                    <CalendarDays className="h-5 w-5" />
                    View All Bookings
                  </Link>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Revenue" value={formatMoney(stats.totalRevenue)} subtext="All-time platform earnings" icon={CreditCard} tone="success" />
            <StatCard label="Today’s Revenue" value={formatMoney(stats.dailyRevenue)} subtext={`${stats.dailyBreakevenPercent}% of target`} icon={Wallet} tone="success" />
            <StatCard label="Active Gurus" value={String(stats.activeGurus)} subtext={`${stats.totalGurus} total • ${stats.pendingApprovals} pending`} icon={PawPrint} tone="info" href="/admin/gurus" />
            <StatCard label="Pending Bookings" value={String(stats.pendingBookings)} subtext="Require immediate attention" icon={CalendarDays} tone="warning" href="/admin/bookings" />
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <ActionCard title="Guru Management" body="Review gurus, walkers, caretakers, approvals, and activity." href="/admin/gurus" icon={Users} />
            <ActionCard title="Booking Operations" body="Track pending, confirmed, completed, and problematic bookings." href="/admin/bookings" icon={CalendarDays} />
            <ActionCard title="Safety and Disputes" body="Handle escalations, policy issues, disputes, and trust workflows." href="/admin/disputes" icon={Scale} />
            <ActionCard title="Referral Growth" body="Monitor affiliate, referral, and growth incentive performance." href="/admin/referrals" icon={Sparkles} />
          </div>

          {/* Revenue & Breakeven */}
          <GlassCard className="p-8">
            <SectionHeader eyebrow="FINANCIAL COMMAND CENTER" title="Revenue and Breakeven" description="Daily, weekly, monthly, and yearly performance vs targets" />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Daily", value: stats.dailyRevenue, percent: stats.dailyBreakevenPercent },
                { label: "Weekly", value: stats.weeklyRevenue, percent: stats.weeklyBreakevenPercent },
                { label: "Monthly", value: stats.monthlyRevenue, percent: stats.monthlyBreakevenPercent },
                { label: "Yearly", value: stats.yearlyRevenue, percent: stats.yearlyBreakevenPercent },
              ].map((item) => (
                <GlassCard key={item.label} className="p-7">
                  <p className="text-sm text-slate-500">{item.label} Revenue</p>
                  <p className="mt-4 text-4xl font-black tracking-tighter">{formatMoney(item.value)}</p>
                  <p className="mt-2 text-emerald-600">{item.percent}% of target</p>
                </GlassCard>
              ))}
            </div>
          </GlassCard>

          {/* Pet Mix */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <GlassCard className="p-8">
              <SectionHeader eyebrow="GURU MIX" title="Dog vs Cat Gurus" />
              <div className="mt-8">
                <RatioBar leftLabel="Dog gurus" rightLabel="Cat gurus" leftPercent={stats.dogGuruPercent} rightPercent={stats.catGuruPercent} />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/60 p-6">
                  <div className="flex items-center gap-3 text-slate-500"><Dog className="h-5 w-5" /><p>Dog Gurus</p></div>
                  <p className="mt-4 text-4xl font-black">{stats.dogGuruCount}</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-6">
                  <div className="flex items-center gap-3 text-slate-500"><Cat className="h-5 w-5" /><p>Cat Gurus</p></div>
                  <p className="mt-4 text-4xl font-black">{stats.catGuruCount}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <SectionHeader eyebrow="BOOKING MIX" title="Dog vs Cat Bookings" />
              <div className="mt-8">
                <RatioBar leftLabel="Dog bookings" rightLabel="Cat bookings" leftPercent={stats.dogBookingPercent} rightPercent={stats.catBookingPercent} leftColor="bg-violet-500" rightColor="bg-cyan-500" />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/60 p-6">
                  <div className="flex items-center gap-3 text-slate-500"><Dog className="h-5 w-5" /><p>Dog Bookings</p></div>
                  <p className="mt-4 text-4xl font-black">{stats.dogBookingCount}</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-6">
                  <div className="flex items-center gap-3 text-slate-500"><Cat className="h-5 w-5" /><p>Cat Bookings</p></div>
                  <p className="mt-4 text-4xl font-black">{stats.catBookingCount}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Geography */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <GlassCard className="p-8">
              <SectionHeader eyebrow="GURU GEOGRAPHY" title="Top Cities by Guru Count" />
              <div className="mt-8"><BarList items={stats.topGuruCities.length ? stats.topGuruCities : [{ label: "No data", value: 0 }]} /></div>
            </GlassCard>
            <GlassCard className="p-8">
              <SectionHeader eyebrow="SALES GEOGRAPHY" title="Top Cities by Revenue" />
              <div className="mt-8"><BarList items={stats.topSalesCities.length ? stats.topSalesCities : [{ label: "No data", value: 0 }]} colorClass="bg-violet-500" /></div>
            </GlassCard>
          </div>

          {/* Live Activity Feed */}
          <GlassCard className="p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
              <SectionHeader eyebrow="LIVE ACTIVITY" title="Business Feed" description="Real-time updates across the platform" />
              <button
                onClick={() => void loadDashboard(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh Feed
              </button>
            </div>

            <div className="space-y-4">
              {activity.length > 0 ? (
                activity.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href || "#"}
                    className="block rounded-2xl border border-white/10 bg-white/60 p-6 backdrop-blur hover:bg-white/80 transition-all"
                  >
                    <div className="flex gap-5">
                      <span className={cn("mt-1 h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-sm", toneClasses(item.tone))}>
                        {item.tone === "good" ? "✓" : item.tone === "alert" ? "!" : "•"}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.timeLabel}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="py-16 text-center text-slate-500">No recent activity yet.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}