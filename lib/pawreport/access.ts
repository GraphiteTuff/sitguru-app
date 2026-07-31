// lib/pawreport/access.ts
/**
 * RBAC helpers for PawReport endpoints.
 * - Guru: must be assigned to the booking (and booking active for writes)
 * - Pet Parent: ownership columns only → read access
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { PawReportAccessRole } from "@/lib/pawreport/types";

type BookingAccessRow = {
  id?: string | number | null;
  status?: string | null;
  guru_id?: string | null;
  provider_id?: string | null;
  sitter_id?: string | null;
  caregiver_id?: string | null;
  pet_owner_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  customer_email?: string | null;
  email?: string | null;
};

export type PawReportAccess = {
  role: PawReportAccessRole;
  canRead: boolean;
  canWrite: boolean;
  booking: BookingAccessRow;
};

const ACTIVE_BOOKING_STATUSES = new Set([
  "confirmed",
  "accepted",
  "in_progress",
  "active",
  "paid",
  "upcoming",
]);

function asId(value: unknown) {
  return value == null ? "" : String(value).trim();
}

export async function loadBookingForPawReport(bookingId: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("PawReport booking load error:", error);
    return null;
  }

  return (data as BookingAccessRow | null) ?? null;
}

export function bookingAssignedGuruId(booking: BookingAccessRow) {
  return (
    asId(booking.guru_id) ||
    asId(booking.provider_id) ||
    asId(booking.sitter_id) ||
    asId(booking.caregiver_id) ||
    ""
  );
}

export function isBookingActiveForWrites(booking: BookingAccessRow) {
  const status = String(booking.status || "")
    .trim()
    .toLowerCase();

  // If status is missing, allow write so legacy rows are not blocked.
  if (!status) return true;
  if (ACTIVE_BOOKING_STATUSES.has(status)) return true;

  // Common completed/canceled blocks
  if (
    ["completed", "canceled", "cancelled", "refunded", "declined"].includes(
      status,
    )
  ) {
    return false;
  }

  return true;
}

export function customerOwnsBookingRow(
  booking: BookingAccessRow,
  userId: string,
  email?: string | null,
) {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const ownerIds = [
    asId(booking.pet_owner_id),
    asId(booking.customer_id),
    asId(booking.user_id),
  ];

  if (ownerIds.includes(userId)) return true;

  if (!normalizedEmail) return false;

  const emails = [
    String(booking.customer_email || "")
      .trim()
      .toLowerCase(),
    String(booking.email || "")
      .trim()
      .toLowerCase(),
  ];

  return emails.includes(normalizedEmail);
}

export async function resolvePawReportAccess(params: {
  bookingId: string;
  userId: string;
  email?: string | null;
}): Promise<PawReportAccess | null> {
  const booking = await loadBookingForPawReport(params.bookingId);
  if (!booking?.id) return null;

  const assignedGuruId = bookingAssignedGuruId(booking);
  const isGuru = assignedGuruId !== "" && assignedGuruId === params.userId;
  const isPetParent = customerOwnsBookingRow(
    booking,
    params.userId,
    params.email,
  );

  // Soft admin fallback via profiles.role when present
  let isAdmin = false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", params.userId)
    .maybeSingle();

  if (
    String((profile as { role?: string } | null)?.role || "")
      .trim()
      .toLowerCase() === "admin"
  ) {
    isAdmin = true;
  }

  if (!isGuru && !isPetParent && !isAdmin) {
    return {
      role: "pet_parent",
      canRead: false,
      canWrite: false,
      booking,
    };
  }

  if (isAdmin) {
    return {
      role: "admin",
      canRead: true,
      canWrite: true,
      booking,
    };
  }

  if (isGuru) {
    return {
      role: "guru",
      canRead: true,
      canWrite: isBookingActiveForWrites(booking),
      booking,
    };
  }

  return {
    role: "pet_parent",
    canRead: true,
    canWrite: false,
    booking,
  };
}
