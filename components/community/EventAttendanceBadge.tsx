"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { EventAttendanceCounts } from "@/lib/community/attendance";

export default function EventAttendanceBadge({
  eventId,
  className = "",
}: {
  eventId: string;
  className?: string;
}) {
  const [counts, setCounts] = useState<EventAttendanceCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/community/events/${eventId}/attendance`);
        const payload = await response.json();
        if (!cancelled && payload.counts?.totalGoing >= 0) {
          setCounts(payload.counts);
        }
      } catch {
        // optional
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!counts || counts.totalGoing <= 0) return null;

  return (
    <p
      className={`inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 ${className}`}
    >
      <Users className="h-3.5 w-3.5" />
      {counts.totalGoing} going
      {counts.gurus > 0 ? ` · ${counts.gurus} Gurus` : ""}
    </p>
  );
}
