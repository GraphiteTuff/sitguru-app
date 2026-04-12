"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type BookingRow = {
  id: string;
  provider_profile_id?: string | null;
  sitter_id?: string | null;
  pet_name?: string | null;
  service?: string | null;
  booking_date?: string | null;
  status?: string | null;
  price?: number | null;
  pet_type?: string | null;
  city?: string | null;
  state?: string | null;
};

type ProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
};

function normalizeStatus(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed") return "Confirmed";
  if (value === "pending") return "Pending";
  if (value === "completed") return "Completed";
  if (value === "approved") return "Approved";
  if (value === "paid") return "Paid";

  return status || "Pending";
}

function formatMoney(value?: number | null) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateLabel(value?: string | null, status?: string | null) {
  if (!value) return "Date not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "completed") {
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} · Completed`;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not provided";
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "Confirmed"
      ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
      : status === "Pending"
        ? "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
        : status === "Completed"
          ? "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";

  return <span className={classes}>{status}</span>;
}

function BookingCard({
  booking,
  primaryAction,
  secondaryAction,
}: {
  booking: {
    id: string;
    sitter: string;
    service: string;
    date: string;
    location: string;
    status: string;
    price: string;
  };
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
}) {
  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">{booking.service}</h3>
            <StatusBadge status={booking.status} />
          </div>

          <p className="mt-2 text-sm font-medium text-slate-500">
            With {booking.sitter}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="muted-panel p-4">
              <p className="text-sm font-semibold text-slate-900">Date</p>
              <p className="mt-1 text-sm text-slate-500">{booking.date}</p>
            </div>
            <div className="muted-panel p-4">
              <p className="text-sm font-semibold text-slate-900">Location</p>
              <p className="mt-1 text-sm text-slate-500">{booking.location}</p>
            </div>
            <div className="muted-panel p-4">
              <p className="text-sm font-semibold text-slate-900">Price</p>
              <p className="mt-1 text-sm text-slate-500">{booking.price}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <Link href={primaryAction.href} className="btn-primary w-full sm:w-auto">
            {primaryAction.label}
          </Link>
          <Link href={secondaryAction.href} className="btn-secondary w-full sm:w-auto">
            {secondaryAction.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providerMap, setProviderMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setError("");

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(
          "id, provider_profile_id, sitter_id, pet_name, service, booking_date, status, price, pet_type, city, state"
        )
        .order("booking_date", { ascending: true });

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      const safeBookings = (bookingData as BookingRow[]) || [];
      setBookings(safeBookings);

      const providerIds = Array.from(
        new Set(
          safeBookings
            .map((item) => item.provider_profile_id)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (providerIds.length > 0) {
        const { data: providerData, error: providerError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", providerIds);

        if (!providerError && providerData) {
          const map: Record<string, string> = {};

          (providerData as ProfileRow[]).forEach((provider) => {
            const fullName = `${provider.first_name || ""} ${provider.last_name || ""}`.trim();
            map[provider.id] = fullName || "Provider";
          });

          setProviderMap(map);
        }
      }

      setLoading(false);
    }

    loadBookings();
  }, []);

  const summary = useMemo(() => {
    const upcomingStatuses = new Set(["confirmed", "pending"]);
    const completedStatuses = new Set(["completed"]);
    const pendingStatuses = new Set(["pending"]);

    const upcoming = bookings.filter((item) =>
      upcomingStatuses.has(String(item.status || "").toLowerCase())
    ).length;

    const completed = bookings.filter((item) =>
      completedStatuses.has(String(item.status || "").toLowerCase())
    ).length;

    const pending = bookings.filter((item) =>
      pendingStatuses.has(String(item.status || "").toLowerCase())
    ).length;

    return [
      {
        label: "Upcoming",
        value: String(upcoming),
        note: "Confirmed and pending reservations",
      },
      {
        label: "Completed",
        value: String(completed),
        note: "Past care services and stays",
      },
      {
        label: "Pending",
        value: String(pending),
        note: "Waiting on confirmation",
      },
    ];
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((item) => {
        const status = String(item.status || "").toLowerCase();
        return status === "confirmed" || status === "pending";
      })
      .map((item) => ({
        id: item.id,
        sitter:
          (item.provider_profile_id && providerMap[item.provider_profile_id]) ||
          "Provider",
        service: item.service || "Pet Care",
        date: formatDateLabel(item.booking_date, item.status),
        location: buildLocation(item.city, item.state),
        status: normalizeStatus(item.status),
        price: formatMoney(item.price),
      }));
  }, [bookings, providerMap]);

  const bookingHistory = useMemo(() => {
    return bookings
      .filter((item) => String(item.status || "").toLowerCase() === "completed")
      .map((item) => ({
        id: item.id,
        sitter:
          (item.provider_profile_id && providerMap[item.provider_profile_id]) ||
          "Provider",
        service: item.service || "Pet Care",
        date: formatDateLabel(item.booking_date, item.status),
        location: buildLocation(item.city, item.state),
        status: normalizeStatus(item.status),
        price: formatMoney(item.price),
      }));
  }, [bookings, providerMap]);

  return (
    <main className="page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <div className="section-kicker">Bookings</div>
            <h1 className="mt-4">Review upcoming and past pet care bookings</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Keep reservations clear and easy to manage with consistent status
              badges, readable booking cards, and quick actions on every screen size.
            </p>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="card-grid-3">
            {summary.map((item) => (
              <div key={item.label} className="panel p-5 sm:p-6">
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="page-container">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_380px]">
            <div className="grid gap-6">
              <div className="panel p-6 sm:p-7">
                <div className="section-kicker">Upcoming bookings</div>
                <h2 className="mt-4">What’s coming up next</h2>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                  See your next scheduled services, compare status, and take quick action when needed.
                </p>

                <div className="mt-6 grid gap-4">
                  {loading ? (
                    <div className="muted-panel p-4 text-sm text-slate-500">
                      Loading bookings...
                    </div>
                  ) : upcomingBookings.length > 0 ? (
                    upcomingBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        primaryAction={{ href: "/dashboard", label: "View details" }}
                        secondaryAction={{ href: "/search", label: "Find more care" }}
                      />
                    ))
                  ) : (
                    <div className="muted-panel p-4 text-sm text-slate-500">
                      No upcoming bookings yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="panel p-6 sm:p-7">
                <div className="section-kicker">Booking history</div>
                <h2 className="mt-4">Past services and completed stays</h2>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                  Review your previous care history in the same simple, readable card format.
                </p>

                <div className="mt-6 grid gap-4">
                  {loading ? (
                    <div className="muted-panel p-4 text-sm text-slate-500">
                      Loading history...
                    </div>
                  ) : bookingHistory.length > 0 ? (
                    bookingHistory.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        primaryAction={{ href: "/search", label: "Book again" }}
                        secondaryAction={{ href: "/dashboard", label: "Account details" }}
                      />
                    ))
                  ) : (
                    <div className="muted-panel p-4 text-sm text-slate-500">
                      No completed bookings yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="grid gap-6">
              <div className="panel p-6">
                <div className="section-kicker">Quick actions</div>
                <h3 className="mt-4">Stay on top of your schedule</h3>
                <div className="mt-5 flex flex-col gap-3">
                  <Link href="/search" className="btn-primary w-full">
                    Book new care
                  </Link>
                  <Link href="/dashboard" className="btn-secondary w-full">
                    Go to dashboard
                  </Link>
                </div>
              </div>

              <div className="panel p-6">
                <div className="section-kicker">Helpful reminders</div>
                <h3 className="mt-4">Before each booking</h3>
                <div className="mt-5 grid gap-3">
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">Confirm service time</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Double-check dates, times, and pickup or drop-off details.
                    </p>
                  </div>
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">Share care instructions</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Include feeding, medication, routine, and emergency contact details.
                    </p>
                  </div>
                  <div className="muted-panel p-4">
                    <p className="text-sm font-semibold text-slate-900">Review status updates</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Make sure pending reservations are confirmed before the service date.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="rounded-[2rem] bg-slate-900 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-12 lg:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                Keep booking management simple
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Consistent booking UI makes the whole app easier to trust and use.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Standardized cards, status badges, and actions help SitGuru feel organized and user-friendly across every flow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Find pet care
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-500 px-5 text-sm font-semibold text-white transition hover:border-white"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}