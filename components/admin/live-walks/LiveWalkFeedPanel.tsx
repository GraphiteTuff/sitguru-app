// components/admin/live-walks/LiveWalkFeedPanel.tsx
"use client";

import LiveWalkFeedCard from "@/components/admin/live-walks/LiveWalkFeedCard";
import type { AdminLiveWalkRow } from "@/components/admin/live-walks/types";

type LiveWalkFeedPanelProps = {
  rows: AdminLiveWalkRow[];
  selectedBookingId: string;
  isLoading: boolean;
  onSelect: (bookingId: string) => void;
};

export default function LiveWalkFeedPanel({
  rows,
  selectedBookingId,
  isLoading,
  onSelect,
}: LiveWalkFeedPanelProps) {
  return (
    <aside className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Live feed
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {isLoading ? "Syncing fleet…" : `${rows.length} active bookings`}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {rows.map((row) => (
          <LiveWalkFeedCard
            key={row.bookingId}
            row={row}
            selected={row.bookingId === selectedBookingId}
            onSelect={onSelect}
          />
        ))}

        {!isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            No active walks right now. New Guru sessions will appear here
            automatically.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
