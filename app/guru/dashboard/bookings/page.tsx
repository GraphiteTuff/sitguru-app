import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronRightCircle,
  CircleAlert,
  CircleDashed,
  Clock3,
  DollarSign,
  Filter,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  Search,
  Star,
  UserRound,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type BookingRow = {
  id: string;
  pet_name?: string | null;
  pet_type?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  stripe_payment_status?: string | null;
  booking_date?: string | null;
  booking_start?: string | null;
  booking_end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  timezone?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_id?: string | number | null;
  customer_user_id?: string | number | null;
  pet_owner_id?: string | number | null;
  owner_id?: string | number | null;
  pet_parent_id?: string | number | null;
  user_id?: string | number | null;
  notes?: string | null;
  care_notes?: string | null;
  address?: string | null;
  care_area?: string | null;
  care_city?: string | null;
  care_state?: string | null;
  care_zip_code?: string | null;
  price?: number | null;
  total_amount?: number | null;
  service_fee?: number | null;
  platform_fee?: number | null;
  sitter_id?: string | number | null;
  guru_id?: string | number | null;
  guru_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

type FilterKey =
  | "all"
  | "upcoming"
  | "pending"
  | "in-progress"
  | "completed"
  | "canceled";

function getParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Date not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDateTime(value?: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthParam(value?: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!year || month < 1 || month > 12) return null;

  return new Date(year, month - 1, 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isFutureOrToday(value?: string | null) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();

  const bookingDay = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return bookingDay.getTime() >= currentDay.getTime();
}

function canonicalStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase().trim();

  if (clean.includes("in progress") || clean.includes("in-progress")) {
    return "In Progress";
  }

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("complete")) return "Completed";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("pending")) return "Pending";

  return "Pending";
}

function displayStatus(booking: BookingRow) {
  const status = canonicalStatus(booking.booking_status || booking.status);

  if (status === "Confirmed") {
    return "Upcoming";
  }

  return status;
}

function statusPillClasses(label: string) {
  if (label === "Upcoming") {
    return "border border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (label === "Pending") {
    return "border border-amber-200 bg-amber-50 !text-amber-700";
  }

  if (label === "In Progress") {
    return "border border-orange-200 bg-orange-50 !text-orange-700";
  }

  if (label === "Completed") {
    return "border border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (label === "Canceled") {
    return "border border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border border-slate-200 bg-slate-50 !text-slate-700";
}

function getBookingValue(booking: BookingRow) {
  return booking.total_amount ?? booking.service_fee ?? booking.price ?? 0;
}

function getBookingDateValue(booking: BookingRow) {
  return booking.booking_start || booking.booking_date || booking.created_at || null;
}

function getBookingNotes(booking: BookingRow) {
  return booking.care_notes || booking.notes || "";
}

function getBookingLocation(booking: BookingRow) {
  const parts = [
    booking.address,
    booking.care_area,
    booking.care_city,
    booking.care_state,
    booking.care_zip_code,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "Address not provided";
  }

  return parts.join(", ");
}

function getPetInitial(name?: string | null) {
  const clean = name?.trim();
  if (!clean) return "P";
  return clean.charAt(0).toUpperCase();
}

function getPetGradient(name?: string | null) {
  const seed = (name || "").length % 4;

  if (seed === 0) return "from-[#d9f8ea] to-[#f2fffa]";
  if (seed === 1) return "from-[#e4f4ff] to-[#f9fcff]";
  if (seed === 2) return "from-[#fff0db] to-[#fffaf0]";
  return "from-[#ede9ff] to-[#faf8ff]";
}

function getMonthGrid(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

function buildBookingsHref(options: {
  booking?: string | null;
  filter?: string | null;
  q?: string | null;
  month?: string | null;
}) {
  const search = new URLSearchParams();

  if (options.booking) {
    search.set("booking", options.booking);
  }

  if (options.filter && options.filter !== "all") {
    search.set("filter", options.filter);
  }

  if (options.q?.trim()) {
    search.set("q", options.q.trim());
  }

  if (options.month?.trim()) {
    search.set("month", options.month.trim());
  }

  const query = search.toString();

  return query
    ? `/guru/dashboard/bookings?${query}`
    : "/guru/dashboard/bookings";
}

function getBookingPetParentId(booking: BookingRow) {
  return (
    booking.customer_id ||
    booking.customer_user_id ||
    booking.pet_owner_id ||
    booking.owner_id ||
    booking.pet_parent_id ||
    booking.user_id ||
    null
  );
}

function buildMessagePetParentHref(booking: BookingRow) {
  const search = new URLSearchParams();

  search.set("booking", booking.id);

  const petParentId = getBookingPetParentId(booking);

  if (petParentId) {
    search.set("recipient", String(petParentId));
  }

  if (booking.customer_email?.trim()) {
    search.set("email", booking.customer_email.trim());
  }

  if (booking.customer_name?.trim()) {
    search.set("name", booking.customer_name.trim());
  }

  return `/guru/dashboard/messages?${search.toString()}`;
}

function bookingMatchesFilter(booking: BookingRow, filter: FilterKey) {
  const status = canonicalStatus(booking.booking_status || booking.status);
  const isUpcoming = status === "Confirmed" && isFutureOrToday(getBookingDateValue(booking));

  if (filter === "all") return true;
  if (filter === "upcoming") return isUpcoming;
  if (filter === "pending") return status === "Pending";
  if (filter === "in-progress") return status === "In Progress";
  if (filter === "completed") return status === "Completed";
  if (filter === "canceled") return status === "Canceled";

  return true;
}

function bookingMatchesSearch(booking: BookingRow, query: string) {
  if (!query.trim()) return true;

  const haystack = [
    booking.pet_name,
    booking.pet_type,
    booking.service,
    booking.service_type,
    booking.booking_type,
    booking.customer_name,
    booking.customer_email,
    booking.address,
    booking.care_area,
    booking.care_city,
    booking.care_state,
    booking.care_zip_code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

async function getGuruProfile(userId: string, email?: string | null) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruRow;
    }
  }

  return null;
}

async function getGuruBookings(guruId: string | number) {
  const byCreatedAt = await supabaseAdmin
    .from("bookings")
    .select("*")
    .or(`sitter_id.eq.${guruId},guru_id.eq.${guruId}`)
    .order("created_at", { ascending: false });

  if (!byCreatedAt.error && byCreatedAt.data) {
    return byCreatedAt.data as BookingRow[];
  }

  const byBookingDate = await supabaseAdmin
    .from("bookings")
    .select("*")
    .or(`sitter_id.eq.${guruId},guru_id.eq.${guruId}`)
    .order("booking_date", { ascending: false });

  if (!byBookingDate.error && byBookingDate.data) {
    return byBookingDate.data as BookingRow[];
  }

  console.error(
    "Guru bookings fetch error:",
    byCreatedAt.error?.message || byBookingDate.error?.message || "Unknown error"
  );

  return [];
}

export default async function GuruBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedBookingId = getParam(resolvedSearchParams, "booking");
  const searchQuery = getParam(resolvedSearchParams, "q") || "";
  const requestedFilter = (getParam(resolvedSearchParams, "filter") ||
    "all") as FilterKey;
  const requestedMonth = getParam(resolvedSearchParams, "month");

  const activeFilter: FilterKey = [
    "all",
    "upcoming",
    "pending",
    "in-progress",
    "completed",
    "canceled",
  ].includes(requestedFilter)
    ? requestedFilter
    : "all";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const guru = await getGuruProfile(user.id, user.email);

  if (!guru?.id) {
    redirect("/guru/login");
  }

  const allBookings = await getGuruBookings(guru.id);

  const filteredBookings = allBookings
    .filter((booking) => bookingMatchesFilter(booking, activeFilter))
    .filter((booking) => bookingMatchesSearch(booking, searchQuery));

  const selectedBooking =
    filteredBookings.find((booking) => booking.id === selectedBookingId) ||
    filteredBookings[0] ||
    allBookings[0] ||
    null;

  const guruName = guru.display_name || guru.full_name || "Your Guru Account";

  const upcomingCount = allBookings.filter((booking) => {
    return (
      canonicalStatus(booking.booking_status || booking.status) === "Confirmed" &&
      isFutureOrToday(getBookingDateValue(booking))
    );
  }).length;

  const inProgressCount = allBookings.filter(
    (booking) =>
      canonicalStatus(booking.booking_status || booking.status) === "In Progress"
  ).length;

  const completedCount = allBookings.filter(
    (booking) =>
      canonicalStatus(booking.booking_status || booking.status) === "Completed"
  ).length;

  const totalEarnings = allBookings
    .filter(
      (booking) =>
        canonicalStatus(booking.booking_status || booking.status) !== "Canceled"
    )
    .reduce((sum, booking) => sum + getBookingValue(booking), 0);

  const paidBookingsCount = allBookings.filter((booking) => {
    return (
      (booking.payment_status || "").toLowerCase().includes("paid") ||
      (booking.stripe_payment_status || "").toLowerCase().includes("paid")
    );
  }).length;

  const pendingCount = allBookings.filter(
    (booking) =>
      canonicalStatus(booking.booking_status || booking.status) === "Pending"
  ).length;

  const selectedBookingDate = selectedBooking
    ? getBookingDateValue(selectedBooking)
    : null;

  const selectedCalendarDate = selectedBookingDate
    ? new Date(selectedBookingDate)
    : new Date();

  const parsedRequestedMonth = parseMonthParam(requestedMonth);

  const safeCalendarDate =
    parsedRequestedMonth ||
    (Number.isNaN(selectedCalendarDate.getTime())
      ? new Date()
      : selectedCalendarDate);

  const activeMonthValue = formatMonthParam(safeCalendarDate);
  const monthGrid = getMonthGrid(safeCalendarDate);

  const previousMonthHref = buildBookingsHref({
    booking: selectedBooking?.id ?? null,
    filter: activeFilter,
    q: searchQuery,
    month: formatMonthParam(addMonths(safeCalendarDate, -1)),
  });

  const nextMonthHref = buildBookingsHref({
    booking: selectedBooking?.id ?? null,
    filter: activeFilter,
    q: searchQuery,
    month: formatMonthParam(addMonths(safeCalendarDate, 1)),
  });

  const todayMonthHref = buildBookingsHref({
    booking: selectedBooking?.id ?? null,
    filter: activeFilter,
    q: searchQuery,
    month: formatMonthParam(new Date()),
  });

  const bookingDatesThisMonth = new Set(
    allBookings
      .map((booking) => getBookingDateValue(booking))
      .filter(Boolean)
      .map((value) => {
        const parsed = new Date(value as string);
        if (Number.isNaN(parsed.getTime())) return null;
        return `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
      })
      .filter(Boolean) as string[]
  );

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: allBookings.length },
    { key: "upcoming", label: "Upcoming", count: upcomingCount },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "in-progress", label: "In Progress", count: inProgressCount },
    { key: "completed", label: "Completed", count: completedCount },
    {
      key: "canceled",
      label: "Canceled",
      count: allBookings.filter(
        (booking) =>
          canonicalStatus(booking.booking_status || booking.status) === "Canceled"
      ).length,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6fffb] px-4 py-6 !text-[#061638] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-[#dfeee7] bg-white p-8 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
            <p className="text-sm font-black uppercase tracking-[0.24em] !text-emerald-600">
              Guru Workspace
            </p>

            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight !text-[#061638] sm:text-6xl">
              Bookings Hub
            </h1>

            <p className="mt-4 max-w-sm text-lg leading-8 !text-slate-600">
              Manage your confirmed, upcoming, and past bookings all in one
              place.
            </p>

            <p className="mt-3 text-sm font-semibold !text-slate-600">
              Viewing activity for{" "}
              <span className="font-black !text-emerald-700">{guruName}</span>
            </p>
          </div>

          <div className="self-start rounded-[28px] border border-[#dfeee7] bg-white p-4 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-[#e7f3ed] bg-[#fbfffd] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-600">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold !text-slate-600">
                      Total Bookings
                    </div>
                    <div className="mt-1 text-4xl font-black !text-[#061638]">
                      {allBookings.length}
                    </div>
                    <div className="text-sm !text-slate-500">All time</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e7f3ed] bg-[#fbfffd] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 !text-sky-600">
                    <Clock3 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold !text-slate-600">
                      Upcoming
                    </div>
                    <div className="mt-1 text-4xl font-black !text-[#061638]">
                      {upcomingCount}
                    </div>
                    <div className="text-sm !text-slate-500">Next visits</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e7f3ed] bg-[#fbfffd] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 !text-amber-600">
                    <CircleDashed className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold !text-slate-600">
                      In Progress
                    </div>
                    <div className="mt-1 text-4xl font-black !text-[#061638]">
                      {inProgressCount}
                    </div>
                    <div className="text-sm !text-slate-500">Right now</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e7f3ed] bg-[#fbfffd] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold !text-slate-600">
                      Completed
                    </div>
                    <div className="mt-1 text-4xl font-black !text-[#061638]">
                      {completedCount}
                    </div>
                    <div className="text-sm !text-slate-500">Finished</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e7f3ed] bg-[#fbfffd] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold !text-slate-600">
                      Earnings
                    </div>
                    <div className="mt-1 text-4xl font-black !text-[#061638]">
                      {formatCurrency(totalEarnings)}
                    </div>
                    <div className="text-sm !text-slate-500">Booking value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <aside className="self-start rounded-[28px] border border-[#dfeee7] bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight !text-[#061638]">
                All Bookings
              </h2>

              <div className="rounded-full bg-[#f4fbf7] px-3 py-1 text-sm font-black !text-emerald-700">
                {filteredBookings.length}
              </div>
            </div>

            <form
              method="get"
              action="/guru/dashboard/bookings"
              className="mt-5 flex items-center gap-3"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search bookings..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold !text-[#061638] placeholder:!text-slate-400 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
                {activeFilter !== "all" ? (
                  <input type="hidden" name="filter" value={activeFilter} />
                ) : null}
                <input type="hidden" name="month" value={activeMonthValue} />
              </div>

              <button
                type="submit"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white !text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:!text-emerald-700"
                aria-label="Search bookings"
              >
                <Filter className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;

                return (
                  <Link
                    key={tab.key}
                    href={buildBookingsHref({
                      filter: tab.key,
                      q: searchQuery,
                      booking:
                        tab.key === activeFilter
                          ? selectedBooking?.id ?? null
                          : null,
                      month: activeMonthValue,
                    })}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition ${
                      isActive
                        ? "bg-emerald-500 !text-white"
                        : "bg-slate-100 !text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        isActive
                          ? "bg-white/20 !text-white"
                          : "bg-white !text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                  <div className="text-xl font-black !text-[#061638]">
                    No bookings found
                  </div>
                  <p className="mt-2 text-sm leading-6 !text-slate-600">
                    New customer bookings assigned to you will appear here.
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const isSelected = selectedBooking?.id === booking.id;
                  const petName = booking.pet_name?.trim() || "Pet booking";
                  const serviceName =
                    booking.service?.trim() ||
                    booking.service_type?.trim() ||
                    booking.booking_type?.trim() ||
                    "Service not set";
                  const bookingStatus = displayStatus(booking);

                  return (
                    <Link
                      key={booking.id}
                      href={buildBookingsHref({
                        booking: booking.id,
                        filter: activeFilter,
                        q: searchQuery,
                        month: activeMonthValue,
                      })}
                      className={`block rounded-[24px] border p-4 transition ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50/50 shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getPetGradient(
                            petName
                          )} text-lg font-black !text-[#061638]`}
                        >
                          {getPetInitial(petName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-xl font-black !text-[#061638]">
                                {petName}
                              </div>
                              <div className="truncate text-sm font-semibold !text-slate-600">
                                {serviceName}
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusPillClasses(
                                bookingStatus
                              )}`}
                            >
                              {bookingStatus}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 text-sm !text-slate-600">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-slate-400" />
                              <span>
                                {formatShortDate(getBookingDateValue(booking))}
                              </span>
                            </div>

                            <ChevronRightCircle className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {filteredBookings.length > 0 ? (
              <div className="mt-5 text-sm font-semibold !text-slate-600">
                Showing {filteredBookings.length} of {allBookings.length} booking
                {allBookings.length === 1 ? "" : "s"}
              </div>
            ) : null}
          </aside>

          <section className="self-start rounded-[28px] border border-[#dfeee7] bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <h2 className="text-3xl font-black tracking-tight !text-[#061638]">
                Selected booking
              </h2>

              <Link
                href={buildBookingsHref({
                  booking: selectedBooking?.id ?? null,
                  filter: activeFilter,
                  q: searchQuery,
                  month: activeMonthValue,
                })}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black !text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:!text-emerald-700"
              >
                Refresh
              </Link>
            </div>

            {!selectedBooking ? (
              <div className="mt-5 flex min-h-[440px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-center">
                <div className="max-w-md px-6">
                  <div className="text-2xl font-black !text-[#061638]">
                    No booking selected
                  </div>
                  <p className="mt-3 text-base leading-7 !text-slate-600">
                    Once customers book you, select a booking from the left panel
                    to view the full details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-5">
                <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div
                    className={`flex aspect-square items-center justify-center rounded-[28px] bg-gradient-to-br ${getPetGradient(
                      selectedBooking.pet_name
                    )} text-6xl font-black !text-[#061638]`}
                  >
                    {getPetInitial(selectedBooking.pet_name)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-5xl font-black tracking-tight !text-[#061638]">
                          {selectedBooking.pet_name?.trim() || "Pet booking"}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-base font-semibold !text-slate-600">
                          <span>
                            {selectedBooking.service?.trim() ||
                              selectedBooking.service_type?.trim() ||
                              selectedBooking.booking_type?.trim() ||
                              "Service not set"}
                          </span>
                          <span>•</span>
                          <span>
                            {selectedBooking.customer_name?.trim() || "Customer"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${statusPillClasses(
                          displayStatus(selectedBooking)
                        )}`}
                      >
                        {displayStatus(selectedBooking)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-[24px] border border-slate-200 bg-[#fbfffd] p-5">
                        <div className="flex items-start gap-3">
                          <PawPrint className="mt-0.5 h-5 w-5 text-emerald-600" />
                          <div>
                            <div className="text-sm font-semibold !text-slate-600">
                              Service
                            </div>
                            <div className="mt-1 text-xl font-black !text-[#061638]">
                              {selectedBooking.service?.trim() ||
                                selectedBooking.service_type?.trim() ||
                                selectedBooking.booking_type?.trim() ||
                                "Service not set"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-[#fbfffd] p-5">
                        <div className="flex items-start gap-3">
                          <CircleAlert className="mt-0.5 h-5 w-5 text-sky-600" />
                          <div>
                            <div className="text-sm font-semibold !text-slate-600">
                              Booking ID
                            </div>
                            <div className="mt-1 break-all text-lg font-black !text-[#061638]">
                              #{selectedBooking.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 text-slate-500" />
                      <div>
                        <div className="text-sm font-semibold !text-slate-600">
                          Date & Time
                        </div>
                        <div className="mt-1 text-xl font-black !text-[#061638]">
                          {formatDate(getBookingDateValue(selectedBooking))}
                        </div>
                        <div className="mt-1 text-sm font-semibold !text-slate-600">
                          {selectedBooking.start_time && selectedBooking.end_time
                            ? `${selectedBooking.start_time} – ${selectedBooking.end_time}`
                            : formatShortDateTime(getBookingDateValue(selectedBooking))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-slate-500" />
                      <div>
                        <div className="text-sm font-semibold !text-slate-600">
                          Location
                        </div>
                        <div className="mt-1 text-xl font-black !text-[#061638]">
                          {getBookingLocation(selectedBooking)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <UserRound className="mt-0.5 h-5 w-5 text-slate-500" />
                      <div>
                        <div className="text-sm font-semibold !text-slate-600">
                          Customer
                        </div>
                        <div className="mt-1 text-xl font-black !text-[#061638]">
                          {selectedBooking.customer_name || "Customer"}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold !text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedBooking.customer_email || "No email"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {selectedBooking.customer_phone || "No phone"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <DollarSign className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="text-sm font-semibold !text-slate-600">
                          Payout
                        </div>
                        <div className="mt-1 text-3xl font-black !text-[#061638]">
                          {formatCurrency(getBookingValue(selectedBooking))}
                        </div>
                        <div className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">
                          Booking value
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <div className="text-sm font-semibold !text-slate-600">
                        Notes from Pet Parent
                      </div>
                      <div className="mt-2 text-base leading-8 !text-slate-700">
                        {getBookingNotes(selectedBooking)
                          ? getBookingNotes(selectedBooking)
                          : "No Pet Parent notes were included for this booking."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={buildMessagePetParentHref(selectedBooking)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black !text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:!text-emerald-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Pet Parent
                  </Link>

                  <Link
                    href={buildBookingsHref({
                      booking: selectedBooking.id,
                      filter: activeFilter,
                      q: searchQuery,
                      month: activeMonthValue,
                    })}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black !text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Search className="h-4 w-4" />
                    View Details
                  </Link>

                  <Link
                    href="/guru/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black !text-white transition hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="self-start space-y-6">
            <div className="rounded-[28px] border border-[#dfeee7] bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  <div className="text-3xl font-black tracking-tight !text-[#061638]">
                    Calendar
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={previousMonthHref}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                  <Link
                    href={nextMonthHref}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-2xl font-black !text-[#061638]">
                  {formatMonthLabel(safeCalendarDate)}
                </div>

                <Link
                  href={todayMonthHref}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700 transition hover:bg-emerald-100"
                >
                  Today
                </Link>
              </div>

              <div className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">
                {allBookings.length} booking{allBookings.length === 1 ? "" : "s"}
              </div>

              <div className="mt-5 rounded-[22px] border border-slate-100 bg-[#fbfffd] p-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-wide !text-slate-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="py-2">
                        {day}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1 text-center">
                  {monthGrid.map((cell) => {
                    const dateKey = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
                    const hasBooking = bookingDatesThisMonth.has(dateKey);
                    const isToday = isSameCalendarDay(cell.date, new Date());
                    const isSelected =
                      selectedBookingDate &&
                      isSameCalendarDay(cell.date, new Date(selectedBookingDate));

                    return (
                      <div
                        key={dateKey}
                        className="flex min-h-[38px] flex-col items-center justify-center gap-0.5"
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition ${
                            isSelected && cell.inCurrentMonth
                              ? "bg-emerald-500 !text-white shadow-sm"
                              : hasBooking && cell.inCurrentMonth
                              ? "bg-emerald-100 !text-emerald-800"
                              : isToday
                              ? "bg-sky-50 !text-sky-700"
                              : cell.inCurrentMonth
                              ? "bg-white !text-slate-700"
                              : "bg-slate-50 !text-slate-300"
                          }`}
                        >
                          {cell.day}
                        </div>

                        <div className="h-1.5">
                          {hasBooking && cell.inCurrentMonth ? (
                            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs font-bold !text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Booking scheduled
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-100 ring-1 ring-sky-200" />
                  Today
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                  No booking
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dfeee7] bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-black tracking-tight !text-[#061638]">
                  Profile Performance
                </div>
                <div className="text-sm font-black !text-slate-500">Live</div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-base font-semibold !text-slate-600">
                    Pending Requests
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black !text-[#061638]">
                    <span>{pendingCount}</span>
                    <CircleAlert className="h-5 w-5 text-amber-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-base font-semibold !text-slate-600">
                    Paid Bookings
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black !text-[#061638]">
                    <span>{paidBookingsCount}</span>
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="text-base font-semibold !text-slate-600">
                    Completed Visits
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black !text-[#061638]">
                    <span>{completedCount}</span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold !text-slate-600">
                    Booking Rating
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black !text-[#061638]">
                    <span>{allBookings.length > 0 ? "4.9" : "—"}</span>
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dfeee7] bg-[#f7fffb] p-5 shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
              <div className="text-3xl font-black tracking-tight !text-[#061638]">
                Need Help?
              </div>

              <p className="mt-3 text-base leading-7 !text-slate-600">
                Need support with a booking, a customer message, or schedule
                issue?
              </p>

              <div className="mt-5 flex items-center gap-4 rounded-[24px] bg-white p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 !text-emerald-600">
                  <HelpCircle className="h-8 w-8" />
                </div>

                <div className="flex-1">
                  <div className="text-lg font-black !text-[#061638]">
                    Guru support
                  </div>
                  <div className="text-sm font-semibold !text-slate-600">
                    Open your messages to contact support.
                  </div>
                </div>
              </div>

              <Link
                href="/guru/dashboard/messages"
                className="mt-5 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black !text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:!text-emerald-700"
              >
                <span>Go to Messages</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
