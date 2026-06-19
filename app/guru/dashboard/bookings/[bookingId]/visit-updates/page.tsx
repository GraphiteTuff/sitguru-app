import Link from "next/link";
import { redirect } from "next/navigation";
import GuruVisitTracker from "@/components/visit-updates/GuruVisitTracker";
import VisitUpdateTimeline from "@/components/visit-updates/VisitUpdateTimeline";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

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

export default async function GuruVisitUpdatesPage({ params }: PageProps) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/guru/login");
  }

  const { session, updates } = await getVisitData(bookingId);

  return (
    <main className="min-h-screen !bg-slate-50 px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold !text-slate-600">
              Guru Dashboard
            </p>

            <h1 className="text-4xl font-black tracking-tight !text-slate-950 sm:text-5xl">
              Visit Updates
            </h1>
          </div>

          <Link
            href="/guru/dashboard/bookings"
            className="inline-flex rounded-2xl border border-slate-200 !bg-white px-4 py-2 text-sm font-black !text-slate-800 shadow-sm hover:!bg-slate-100"
          >
            Back to Bookings
          </Link>
        </div>

        <GuruVisitTracker bookingId={bookingId} initialSession={session} />

        <VisitUpdateTimeline
          session={session}
          updates={updates}
          viewer="guru"
        />
      </div>
    </main>
  );
}