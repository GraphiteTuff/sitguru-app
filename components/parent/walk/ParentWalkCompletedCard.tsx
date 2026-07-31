// components/parent/walk/ParentWalkCompletedCard.tsx
"use client";

import Link from "next/link";

type ParentWalkCompletedCardProps = {
  petName: string;
  bookingId: string;
  distanceMiles: number;
  durationMinutes: number;
  loggedCount: number;
};

export default function ParentWalkCompletedCard({
  petName,
  bookingId,
  distanceMiles,
  durationMinutes,
  loggedCount,
}: ParentWalkCompletedCardProps) {
  return (
    <section className="mx-3 mt-3 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_20px_50px_rgba(6,78,59,0.12)]">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 px-5 py-6 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">
          Walk complete
        </p>
        <h2 className="mt-2 text-[clamp(1.35rem,5.5vw,1.75rem)] font-black leading-tight tracking-[-0.03em]">
          🏡 {petName} is back home safe and sound!
        </h2>
        <p className="mt-2 text-sm font-semibold text-emerald-50/95">
          Your complete PawReport history card is ready.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <div className="rounded-2xl bg-emerald-50 px-2 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Miles
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {distanceMiles.toFixed(1)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-2 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Minutes
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {Math.round(durationMinutes)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-2 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Events
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">{loggedCount}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-4">
        <Link
          href={`/customer/dashboard/bookings/${encodeURIComponent(bookingId)}/visit-updates`}
          className="flex w-full items-center justify-center rounded-2xl bg-emerald-800 px-4 py-3.5 text-sm font-black text-white"
        >
          Open full PawReport history
        </Link>
      </div>
    </section>
  );
}
