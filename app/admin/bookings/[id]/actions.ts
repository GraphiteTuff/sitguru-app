"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabase/admin";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type UpdateBookingStatusResult = {
  ok: boolean;
  message: string;
  status?: AllowedStatus;
};

const STATUS_LABELS: Record<AllowedStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function isAllowedStatus(value: string): value is AllowedStatus {
  return ALLOWED_STATUSES.includes(value as AllowedStatus);
}

function normalizeStatus(value: string): AllowedStatus | null {
  const clean = value.trim().toLowerCase();

  if (clean === "pending") return "pending";
  if (clean === "confirmed") return "confirmed";
  if (clean === "active") return "in_progress";
  if (clean === "in_progress") return "in_progress";
  if (clean === "in progress") return "in_progress";
  if (clean === "completed") return "completed";
  if (clean === "canceled") return "cancelled";
  if (clean === "cancelled") return "cancelled";

  if (isAllowedStatus(clean)) return clean;

  return null;
}

export async function updateBookingStatus(
  formData: FormData,
): Promise<UpdateBookingStatusResult> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();

  if (!bookingId) {
    return {
      ok: false,
      message: "Missing booking ID.",
    };
  }

  if (!rawStatus) {
    return {
      ok: false,
      message: "Missing booking status.",
    };
  }

  const status = normalizeStatus(rawStatus);

  if (!status) {
    return {
      ok: false,
      message: `Invalid booking status: ${rawStatus}.`,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("id,status")
    .maybeSingle();

  if (error) {
    console.error("Booking status update failed:", {
      bookingId,
      requestedStatus: status,
      error,
    });

    return {
      ok: false,
      message: `Failed to update booking status: ${error.message}`,
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Booking was not found or could not be updated.",
    };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return {
    ok: true,
    status,
    message: `Booking status updated to ${STATUS_LABELS[status]}.`,
  };
}

export { ALLOWED_STATUSES, STATUS_LABELS };