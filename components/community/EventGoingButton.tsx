"use client";

import EventAttendingButtons from "@/components/community/EventAttendingButtons";
import type { EventAttendanceCounts } from "@/lib/community/attendance";

type EventGoingButtonProps = {
  eventId: string;
  eventSlug: string;
  initialCounts?: EventAttendanceCounts | null;
  compact?: boolean;
};

/** Detail-page RSVP — Attending? Yes / Maybe / No with live counters. */
export default function EventGoingButton({
  eventId,
  eventSlug,
  initialCounts = null,
  compact = false,
}: EventGoingButtonProps) {
  return (
    <EventAttendingButtons
      eventId={eventId}
      eventSlug={eventSlug}
      initialCounts={initialCounts}
      compact={compact}
    />
  );
}
