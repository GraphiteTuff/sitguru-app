import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function CustomerVisitUpdatesPage({ params }: PageProps) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { session, updates } = await getVisitData(bookingId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Pet Parent Dashboard
            </p>
            <h1 className="text-2xl font-bold text-slate-950">
              SitGuru Visit Updates
            </h1>
          </div>

          <Link
            href="/customer/dashboard/bookings"
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            Back to Bookings
          </Link>
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