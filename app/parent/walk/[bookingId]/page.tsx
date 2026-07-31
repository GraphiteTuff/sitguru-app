import { redirect } from "next/navigation";
import ParentWalkUnauthorized from "@/components/parent/walk/ParentWalkUnauthorized";
import ParentWalkTrackingShell from "@/components/parent/walk/ParentWalkTrackingShell";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

async function parentOwnsBooking(
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
      .select("id,pet_name")
      .eq("id", bookingId)
      .eq(attempt.column, attempt.value)
      .maybeSingle();

    if (!error && data?.id) {
      return {
        ok: true as const,
        petName:
          typeof (data as { pet_name?: string }).pet_name === "string"
            ? String((data as { pet_name?: string }).pet_name)
            : "Scout",
      };
    }
  }

  // Booking exists but not owned by this parent
  const { data: anyBooking } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .maybeSingle();

  if (anyBooking?.id) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  return { ok: false as const, reason: "missing" as const };
}

export const metadata = {
  title: "Live Walk | SitGuru",
  description: "Follow your pet's live PawReport walk on mobile.",
};

export default async function ParentLiveWalkPage({ params }: PageProps) {
  const { bookingId } = await params;
  const id = String(bookingId || "").trim();

  if (!id) {
    redirect("/customer/dashboard/bookings");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/parent/walk/${id}`)}`);
  }

  const access = await parentOwnsBooking(id, user.id, user.email);

  if (!access.ok) {
    if (access.reason === "forbidden") {
      return <ParentWalkUnauthorized />;
    }
    redirect("/customer/dashboard/bookings");
  }

  return (
    <ParentWalkTrackingShell
      bookingId={id}
      initialPetName={access.petName}
      currentUserId={user.id}
    />
  );
}
