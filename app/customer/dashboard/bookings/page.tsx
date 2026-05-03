import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function firstString(row: DbRow | null | undefined, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = readString(row?.[key]);
    if (value) return value;
  }

  return fallback;
}

function firstNumber(row: DbRow | null | undefined, keys: string[], fallback = 0) {
  for (const key of keys) {
    const parsed = readNumber(row?.[key], Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function parseMoneyFromText(source: string | null | undefined, patterns: RegExp[]) {
  if (!source) return 0;

  for (const pattern of patterns) {
    const match = source.match(pattern);
    const rawValue = match?.[1]?.replace(/,/g, "");

    if (rawValue) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function getBestBookingTip(booking: DbRow) {
  const directTip = firstNumber(booking, ["tip_amount", "guru_tip_amount"], 0);
  if (directTip > 0) return directTip;

  const notes = firstString(booking, ["notes"], "");

  return parseMoneyFromText(notes, [
    /guru\s+tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestBookingFee(booking: DbRow) {
  const directFee = firstNumber(booking, ["marketplace_fee_amount", "sitguru_fee_amount"], 0);
  if (directFee > 0) return directFee;

  const notes = firstString(booking, ["notes"], "");

  return parseMoneyFromText(notes, [
    /marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /sitguru\s+marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestGuruPayout(booking: DbRow) {
  const directPayout = firstNumber(
    booking,
    ["guru_payout_amount", "guru_estimated_total_payout"],
    0,
  );

  if (directPayout > 0) return directPayout;

  const notes = firstString(booking, ["notes"], "");

  return parseMoneyFromText(notes, [
    /estimated\s+guru\s+payout[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestCustomerTotal(booking: DbRow) {
  const directTotal = firstNumber(
    booking,
    [
      "total_customer_paid",
      "customer_total_paid",
      "customer_paid_amount",
      "customer_total_amount",
      "total_amount",
      "amount_total",
      "checkout_amount",
      "stripe_amount_total",
      "payment_amount",
      "service_price",
      "subtotal_amount",
    ],
    0,
  );

  if (directTotal > 0) return directTotal;

  const notes = firstString(booking, ["notes"], "");
  const servicePrice = parseMoneyFromText(notes, [
    /service(?:\s+price|\s+amount)?[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /subtotal[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
  const fee = getBestBookingFee(booking);
  const tip = getBestBookingTip(booking);
  const payout = getBestGuruPayout(booking);

  if (servicePrice > 0 || fee > 0 || tip > 0) {
    return servicePrice + fee + tip;
  }

  if (payout > 0 || fee > 0) {
    return payout + fee;
  }

  return 0;
}

function formatStatus(value: string | null | undefined) {
  return (value || "pending").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Flexible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Flexible";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBookingDate(booking: DbRow) {
  return (
    firstString(booking, ["start_time", "booking_date", "requested_date", "created_at"], "") ||
    null
  );
}

function getBookingHref(booking: DbRow) {
  return `/customer/dashboard/bookings/${encodeURIComponent(String(booking.id))}`;
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = (status || "pending").toLowerCase();

  if (["pending", "requested", "checkout_started", "unpaid"].includes(normalized)) {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  if (["confirmed", "paid", "completed", "succeeded"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }

  if (["in_progress", "processing"].includes(normalized)) {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(normalized)) {
    return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

function getLocation(booking: DbRow) {
  return [booking.care_city, booking.care_state, booking.care_zip_code]
    .map(readString)
    .filter(Boolean)
    .join(", ");
}

function getBookingSortValue(booking: DbRow) {
  const date = new Date(getBookingDate(booking) || 0).getTime();
  return Number.isFinite(date) ? date : 0;
}

function getBookingAvatar(booking: DbRow) {
  return firstString(
    booking,
    [
      "guru_avatar_url",
      "guru_photo_url",
      "sitter_avatar_url",
      "sitter_photo_url",
      "provider_avatar_url",
      "provider_photo_url",
    ],
    "",
  );
}

function isGenericPetName(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  return (
    !normalized ||
    normalized === "pet" ||
    normalized === "your pet" ||
    normalized === "pet care" ||
    normalized === "booking"
  );
}

function getPersonAvatar(row: DbRow | null | undefined) {
  return firstString(
    row,
    [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "image_url",
      "headshot_url",
      "profile_image_url",
    ],
    "",
  );
}

function getInitials(name: string | null | undefined, fallback = "SG") {
  const clean = name?.trim();
  if (!clean) return fallback;

  const parts = clean.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");

  return initials || fallback;
}

function findPetForBooking(booking: DbRow, pets: DbRow[]) {
  const petId = firstString(booking, ["pet_id", "primary_pet_id", "customer_pet_id"], "");
  const petName = firstString(booking, ["pet_name"], "");
  const normalizedPetName = petName.toLowerCase();

  const matchedById = pets.find((pet) => (petId ? String(pet.id) === petId : false));

  if (matchedById) return matchedById;

  const matchedByName = pets.find((pet) =>
    normalizedPetName ? firstString(pet, ["name"], "").toLowerCase() === normalizedPetName : false,
  );

  if (matchedByName) return matchedByName;

  /*
    Do not blindly fall back to the customer's only pet when the booking has a
    real pet name like "Rex". That caused Rex bookings to display Kitty Girl's
    avatar. The single-pet fallback is only safe when the booking label is
    generic, such as "Pet" or "Your pet".
  */
  if (pets.length === 1 && isGenericPetName(petName)) {
    return pets[0];
  }

  return null;
}

function getPetAvatarForBooking(booking: DbRow, pets: DbRow[]) {
  const bookingAvatar = firstString(
    booking,
    ["pet_avatar_url", "pet_photo_url", "pet_image_url"],
    "",
  );

  if (bookingAvatar) return bookingAvatar;

  const pet = findPetForBooking(booking, pets);
  return firstString(pet, ["photo_url", "avatar_url", "image_url"], "");
}

function getGuruAvatarForBooking(booking: DbRow, guruAvatars: Map<string, string>) {
  const bookingAvatar = getBookingAvatar(booking);
  if (bookingAvatar) return bookingAvatar;

  const guruId = firstString(booking, ["guru_id", "sitter_id", "provider_id"], "");
  const guruName = firstString(booking, ["guru_name", "sitter_name", "provider_name"], "");

  return (
    (guruId ? guruAvatars.get(`id:${guruId}`) : "") ||
    (guruName ? guruAvatars.get(`name:${guruName.toLowerCase()}`) : "") ||
    ""
  );
}

async function fetchPetsForCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const attempts = [
    { column: "owner_id", value: userId },
    { column: "user_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "pet_owner_id", value: userId },
  ];

  const seen = new Set<string>();
  const pets: DbRow[] = [];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq(attempt.column, attempt.value);

    if (error) continue;

    for (const row of (data as DbRow[] | null) || []) {
      const id = String(row.id || "");
      if (!id || seen.has(id)) continue;

      seen.add(id);
      pets.push(row);
    }
  }

  return pets;
}

async function fetchGuruAvatarsForBookings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookings: DbRow[],
) {
  const avatarMap = new Map<string, string>();
  const guruIds = Array.from(
    new Set(
      bookings
        .map((booking) => firstString(booking, ["guru_id", "sitter_id", "provider_id"], ""))
        .filter(Boolean),
    ),
  );
  const guruNames = Array.from(
    new Set(
      bookings
        .map((booking) =>
          firstString(booking, ["guru_name", "sitter_name", "provider_name"], ""),
        )
        .filter((name) => name && name.toLowerCase() !== "sitguru"),
    ),
  );

  const tableAttempts = ["guru_profiles", "profiles", "gurus"];
  const idColumns = ["id", "user_id", "profile_id"];

  for (const table of tableAttempts) {
    for (const column of idColumns) {
      if (!guruIds.length) continue;

      const { data, error } = await supabase.from(table).select("*").in(column, guruIds);
      if (error) continue;

      for (const row of (data as DbRow[] | null) || []) {
        const avatar = getPersonAvatar(row);
        if (!avatar) continue;

        for (const idColumn of idColumns) {
          const id = firstString(row, [idColumn], "");
          if (id) avatarMap.set(`id:${id}`, avatar);
        }

        const name = firstString(row, ["full_name", "display_name", "name", "first_name"], "");
        if (name) avatarMap.set(`name:${name.toLowerCase()}`, avatar);
      }
    }
  }

  for (const table of tableAttempts) {
    for (const guruName of guruNames) {
      const nameColumns = ["full_name", "display_name", "name", "first_name"];

      for (const column of nameColumns) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .ilike(column, `%${guruName}%`)
          .limit(1)
          .maybeSingle();

        if (error || !data) continue;

        const row = data as DbRow;
        const avatar = getPersonAvatar(row);
        if (!avatar) continue;

        avatarMap.set(`name:${guruName.toLowerCase()}`, avatar);

        for (const idColumn of idColumns) {
          const id = firstString(row, [idColumn], "");
          if (id) avatarMap.set(`id:${id}`, avatar);
        }
      }
    }
  }

  return avatarMap;
}

async function fetchCustomerBookings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string | null | undefined,
) {
  const attempts = [
    { column: "pet_owner_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "user_id", value: userId },
    ...(userEmail ? [{ column: "customer_email", value: userEmail.toLowerCase() }] : []),
  ];

  const seen = new Set<string>();
  const results: DbRow[] = [];
  let firstSuccessfulEmpty = false;

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq(attempt.column, attempt.value)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) continue;

    firstSuccessfulEmpty = true;

    for (const row of (data as DbRow[] | null) || []) {
      const id = String(row.id || "");
      if (!id || seen.has(id)) continue;

      seen.add(id);
      results.push(row);
    }
  }

  if (!results.length && !firstSuccessfulEmpty) {
    return [];
  }

  return results.sort((a, b) => getBookingSortValue(b) - getBookingSortValue(a));
}

function BookingOverviewCard({
  booking,
  pets,
  guruAvatars,
}: {
  booking: DbRow;
  pets: DbRow[];
  guruAvatars: Map<string, string>;
}) {
  const date = getBookingDate(booking);
  const location = getLocation(booking);
  const total = getBestCustomerTotal(booking);
  const tip = getBestBookingTip(booking);
  const serviceType = firstString(booking, ["service_type", "service"], "Pet Care");
  const petName = firstString(booking, ["pet_name"], "your pet");
  const guruName = firstString(booking, ["guru_name", "sitter_name", "provider_name"], "your Guru");
  const petAvatar = getPetAvatarForBooking(booking, pets);
  const guruAvatar = getGuruAvatarForBooking(booking, guruAvatars);
  const status = firstString(booking, ["status"], "pending");
  const paymentStatus = firstString(booking, ["payment_status"], "unpaid");

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_230px]">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              {petAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={petAvatar} alt={petName} className="h-full w-full object-cover" />
              ) : isGenericPetName(petName) ? (
                <PawPrint className="h-7 w-7" />
              ) : (
                <span className="text-xl font-black text-emerald-700">
                  {getInitials(petName, "P").slice(0, 1)}
                </span>
              )}
            </div>

            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-[10px] font-black text-slate-900 shadow-sm ring-1 ring-emerald-200">
              {guruAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={guruAvatar} alt={guruName} className="h-full w-full object-cover" />
              ) : (
                getInitials(guruName, "G")
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                {serviceType} for {petName}
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(status)}`}>
                {formatStatus(status)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(paymentStatus)}`}>
                {formatStatus(paymentStatus)}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Booked with {guruName}. Open the full Trust & Care overview before making changes or canceling.
            </p>

            {!guruAvatar ? (
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Guru photo will appear here once the booking has a Guru avatar URL or a matched Guru profile.
              </p>
            ) : null}

            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                {formatDate(date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                {firstString(booking, ["time_window"], formatTime(date))}
              </span>
              <span className="truncate">{location || "Location in booking overview"}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
              Need to adjust care? Message your Guru or support first so SitGuru can help keep the visit on track.
            </div>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{formatMoney(total)}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>

          {tip > 0 ? (
            <p className="mt-2 text-xs font-black text-emerald-700">
              Includes {formatMoney(tip)} Guru tip
            </p>
          ) : null}

          <Link
            href={getBookingHref(booking)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Open Trust & Care Overview
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function CustomerBookingsOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookings = await fetchCustomerBookings(supabase, user.id, user.email);
  const [pets, guruAvatars] = await Promise.all([
    fetchPetsForCustomer(supabase, user.id),
    fetchGuruAvatarsForBookings(supabase, bookings),
  ]);

  const upcomingBookings = bookings.filter((booking) => {
    const date = getBookingSortValue(booking);
    const status = firstString(booking, ["status"], "").toLowerCase();
    const payment = firstString(booking, ["payment_status"], "").toLowerCase();

    return (
      date >= Date.now() - 24 * 60 * 60 * 1000 &&
      !["cancelled", "canceled", "completed"].includes(status) &&
      !["refunded", "failed"].includes(payment)
    );
  });

  const nextBooking = upcomingBookings[0] || bookings[0] || null;

  return (
    <main
      className="min-h-screen bg-[#eef7f2] pb-16 font-light text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
          >
            Book More Care
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#22c7a8] via-[#78d8d0] to-[#c6ecff] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/70">
              Trust & care booking overview
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Your SitGuru bookings, organized for peace of mind
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-800/80">
              Review upcoming care, payment status, support actions, and booking details in one warm customer-friendly place.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Total bookings</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{bookings.length}</p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Next booking</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{nextBooking ? formatDate(getBookingDate(nextBooking)) : "None"}</p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Support</p>
              <p className="mt-2 text-3xl font-black text-slate-950">Ready</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
                Why you can feel confident
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Every booking gets a clear next step
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                If a booking needs a change, customers are guided to message the Guru or support before canceling.
              </p>
            </div>
            <HeartHandshake className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-emerald-200 bg-white p-8 text-center shadow-sm">
            <Sparkles className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">No bookings yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Once you book care, this page will become your trust and care booking overview.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Find a Guru
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {bookings.map((booking) => (
              <BookingOverviewCard
                key={String(booking.id)}
                booking={booking}
                pets={pets}
                guruAvatars={guruAvatars}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
