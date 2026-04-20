import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  sitter_id: string | null;
  customer_id: string | null;
  pet_name: string | null;
  service: string | null;
  booking_date: string | null;
  status: string | null;
  payment_status?: string | null;
  price?: number | null;
  city?: string | null;
  state?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusClasses(status?: string | null) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "confirmed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "canceled") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default async function CustomerBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, sitter_id, customer_id, pet_name, service, booking_date, status, payment_status, price, city, state, created_at"
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (bookings as BookingRow[] | null) ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Customer Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Your bookings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Review your booking requests, confirmed care, and payment
                progress in one place.
              </p>
            </div>

            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Book another Guru
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error.message}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-white">
                No bookings yet
              </p>
              <p className="mt-2 text-sm text-white/70">
                Once you request care, your bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[28px] border border-white/10 bg-slate-950/50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Booking ID
                      </p>
                      <p className="mt-1 break-all text-sm text-white/80">
                        {booking.id}
                      </p>

                      <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                        {booking.pet_name || "Pet booking"}
                      </h2>

                      <div className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-white">
                            Service:
                          </span>{" "}
                          {booking.service || "General care"}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Date:
                          </span>{" "}
                          {formatDate(booking.booking_date)}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Price:
                          </span>{" "}
                          {typeof booking.price === "number"
                            ? `$${booking.price}`
                            : "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Location:
                          </span>{" "}
                          {[booking.city, booking.state].filter(Boolean).join(", ") ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                          booking.status
                        )}`}
                      >
                        {booking.status || "unknown"}
                      </span>

                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        Payment: {booking.payment_status || "—"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}