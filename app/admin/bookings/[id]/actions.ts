"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabase/admin";

const ALLOWED_STATUSES = [
  "Pending",
  "Confirmed",
  "Active",
  "Completed",
  "Canceled",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function normalizeStatus(value: string): AllowedStatus {
  const clean = value.trim().toLowerCase();

  if (clean === "pending") return "Pending";
  if (clean === "confirmed") return "Confirmed";
  if (clean === "active") return "Active";
  if (clean === "completed") return "Completed";
  if (clean === "canceled" || clean === "cancelled") return "Canceled";

  return "Pending";
}

export async function updateBookingStatus(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();

  if (!bookingId) {
    return { ok: false, message: "Missing booking ID." };
  }

  const status = normalizeStatus(rawStatus);

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Booking status update failed:", error.message);
    return { ok: false, message: "Failed to update booking status." };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return { ok: true, message: `Booking status updated to ${status}.` };
}

export { ALLOWED_STATUSES };