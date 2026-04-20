import Link from "next/link";
import { redirect } from "next/navigation";
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
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  status?: string | null;
  payment_status?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  address?: string | null;
  price?: number | null;
  total_amount?: number | null;
  sitter_id?: string | number | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
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

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("complete")) return "Completed";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("pending")) return "Pending";

  return status;
}

function normalizePayment(payment?: string | null) {
  if (!payment) return "unpaid";
  return payment.toLowerCase();
}

function statusClasses(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "Confirmed") {
    return "border border-emerald-400/20 bg-emerald-400/15 text-emerald-200";
  }

  if (normalized === "Completed") {
    return "border border-sky-400/20 bg-sky-400/15 text-sky-200";
  }

  if (normalized === "Pending") {
    return "border border-amber-400/20 bg-amber-400/15 text-amber-200";
  }

  if (normalized === "Canceled") {
    return "border border-red-400/20 bg-red-400/15 text-red-200";
  }

  return "border border-slate-600 bg-slate-800/80 text-slate-200";
}

function paymentClasses(payment?: string | null) {
  const normalized = normalizePayment(payment);

  if (normalized === "paid") {
    return "border border-emerald-400/20 bg-emerald-400/15 text-emerald-200";
  }

  if (normalized.includes("checkout")) {
    return "border border-sky-400/20 bg-sky-400/15 text-sky-200";
  }

  if (normalized === "expired") {
    return "border border-red-400/20 bg-red-400/15 text-red-200";
  }

  return "border border-amber-400/20 bg-amber-400/15 text-amber-200";
}

function sectionKicker(text: string) {
  return (
    <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
      {text}
    </div>
  );
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
    .eq("sitter_id", guruId)
    .order("created_at", { ascending: false });

  if (!byCreatedAt.error && byCreatedAt.data) {
    return byCreatedAt.data as BookingRow[];
  }

  const byBookingDate = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
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

export default async function GuruBookingsPage() {
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

  const bookings = await getGuruBookings(guru.id);

  const pendingBookings = bookings.filter(
    (booking) => normalizeStatus(booking.status) === "Pending"
  );

  const confirmedBookings = bookings.filter(
    (booking) => normalizeStatus(booking.status) === "Confirmed"
  );

  const completedBookings = bookings.filter(
    (booking) => normalizeStatus(booking.status) === "Completed"
  );

  const guruName =
    guru?.display_name ||
    guru?.full_name ||
    "Your Guru Account";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {sectionKicker("Guru Dashboard")}
              <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-6xl">
                Incoming bookings
              </h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-white/80">
                Review pending requests, confirmed care, completed services, and
                payment activity for your own bookings only.
              </p>
              <p className="mt-3 text-sm font-bold text-emerald-200/90">
                Viewing bookings for {guruName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                Back to Guru dashboard
              </Link>

              <Link
                href="/guru/bookings"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-emerald-400"
              >
                Refresh bookings
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-amber-200">
              Pending
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {pendingBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-amber-100/90">
              New requests waiting on review
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-emerald-200">
              Confirmed
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {confirmedBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-emerald-100/90">
              Upcoming confirmed care
            </div>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-sky-200">
              Completed
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {completedBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-sky-100/90">
              Finished service activity
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {sectionKicker("Bookings")}
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                  Your booking activity
                </h2>
                <p className="mt-2 text-base font-semibold text-white/75">
                  Only bookings assigned to your guru account appear here.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-black text-white">
                {bookings.length} total booking{bookings.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="p-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-10 text-center">
                <div className="text-3xl font-black text-white">No bookings yet</div>
                <p className="mt-3 text-base font-medium text-white/70">
                  New customer requests assigned to you will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-black text-white">
                          {booking.pet_name?.trim() || "Pet booking"}
                        </div>
                        <div className="mt-1 text-base font-bold text-white/75">
                          {booking.service?.trim() ||
                            booking.service_type?.trim() ||
                            booking.booking_type?.trim() ||
                            "Service not set"}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Customer
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_name || "Customer"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Service date
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatDate(booking.booking_date)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Value
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatCurrency(booking.total_amount ?? booking.price)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Created
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatDateTime(booking.created_at)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Email
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_email || "Not set"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Phone
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_phone || "Not set"}
                          </div>
                        </div>
                      </div>

                      {booking.address?.trim() ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Address
                          </div>
                          <div className="mt-2 text-sm font-medium leading-7 text-white/85">
                            {booking.address}
                          </div>
                        </div>
                      ) : null}

                      {booking.notes?.trim() ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Notes
                          </div>
                          <div className="mt-2 text-sm font-medium leading-7 text-white/85">
                            {booking.notes}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${statusClasses(
                          booking.status
                        )}`}
                      >
                        {normalizeStatus(booking.status)}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${paymentClasses(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status || "unpaid"}
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