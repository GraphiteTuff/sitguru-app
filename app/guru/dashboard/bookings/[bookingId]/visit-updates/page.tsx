import { redirect } from "next/navigation";
import { GuruLiveActionPanel } from "@/components/pawreport";
import GuruVisitTracker from "@/components/visit-updates/GuruVisitTracker";
import VisitUpdateTimeline from "@/components/visit-updates/VisitUpdateTimeline";
import GuruPageHero from "@/components/guru/GuruPageHero";
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
    <main className="min-h-screen bg-[#F7FFFB] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <GuruPageHero
          eyebrow="LIVE VISIT UPDATES"
          title="SitGuru PawReport™"
          description="Manage this booking's care updates, photos, and visit records. Your Pet Parent sees the updates permitted for this visit."
          action={{ href: "/guru/dashboard/bookings", label: "Back to Bookings" }}
        />

        {/* Realtime Guru phone panel → SSE + push/in-app notifications */}
        <GuruLiveActionPanel bookingId={bookingId} />

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
