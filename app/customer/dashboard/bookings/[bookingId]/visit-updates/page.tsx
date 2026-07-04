import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import VisitUpdateTimeline from "@/components/visit-updates/VisitUpdateTimeline";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

type BookingOwnershipRow = {
  id?: string | number | null;
};

async function customerOwnsBooking(
  bookingId: string,
  userId: string,
  email?: string | null,
) {
  const attempts: Array<{ column: string; value: string }> = [
    { column: "pet_owner_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "user_id", value: userId },
  ];

  const normalizedEmail = email?.trim().toLowerCase();

  if (normalizedEmail) {
    attempts.push(
      { column: "customer_email", value: normalizedEmail },
      { column: "email", value: normalizedEmail },
    );
  }

  for (const attempt of attempts) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .eq(attempt.column, attempt.value)
      .maybeSingle();

    if (!error && (data as BookingOwnershipRow | null)?.id) {
      return true;
    }
  }

  return false;
}

async function getVisitData(bookingId: string) {
  const { data: session } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  const { data: updates } = await supabaseAdmin
    .from("booking_visit_updates")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  return {
    session,
    updates: updates ?? [],
  };
}

export default async function CustomerVisitUpdatesPage({ params }: PageProps) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ownsBooking = await customerOwnsBooking(bookingId, user.id, user.email);

  if (!ownsBooking) {
    redirect("/customer/dashboard/bookings");
  }

  const { session, updates } = await getVisitData(bookingId);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_44%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              Live Care / PawReport
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Your Guru&apos;s care updates
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
              Follow photos, potty updates, food and water confirmations, care
              notes, live walk summaries, and the final PawReport for this
              booking.
            </p>
          </div>

          <Link
            href="/customer/dashboard"
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold leading-6 text-sky-900">
          This page shows the latest saved updates. Your dashboard refreshes the
          live care card automatically while a PawReport or walk is active.
        </div>

        <VisitUpdateTimeline
          session={session}
          updates={updates}
          viewer="customer"
        />
      </div>
    </main>
  );
}
