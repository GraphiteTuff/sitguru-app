import { redirect } from "next/navigation";
import GuruWalkUnauthorized from "@/components/guru/walk/GuruWalkUnauthorized";
import GuruWalkControlShell from "@/components/guru/walk/GuruWalkControlShell";
import {
  bookingAssignedGuruId,
  loadBookingForPawReport,
} from "@/lib/pawreport/access";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export const metadata = {
  title: "Guru Live Walk | SitGuru",
  description: "Publish live walk GPS and care events from your phone.",
};

function resolvePetName(booking: Record<string, unknown>) {
  const raw =
    booking.pet_name || booking.petName || booking.animal_name || "Scout";
  return typeof raw === "string" && raw.trim() ? raw.trim() : "Scout";
}

export default async function GuruLiveWalkPage({ params }: PageProps) {
  const { bookingId } = await params;
  const id = String(bookingId || "").trim();

  if (!id) {
    redirect("/guru/dashboard/bookings");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/guru/login?next=${encodeURIComponent(`/guru/walk/${id}`)}`);
  }

  const booking = await loadBookingForPawReport(id);
  if (!booking?.id) {
    redirect("/guru/dashboard/bookings");
  }

  const assignedGuruId = bookingAssignedGuruId(booking);
  if (!assignedGuruId || assignedGuruId !== user.id) {
    // Only the assigned Guru may publish for this booking
    return <GuruWalkUnauthorized />;
  }

  return (
    <GuruWalkControlShell
      bookingId={id}
      petName={resolvePetName(booking as Record<string, unknown>)}
      currentUserId={user.id}
    />
  );
}
