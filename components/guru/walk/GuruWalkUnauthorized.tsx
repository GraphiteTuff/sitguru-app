// components/guru/walk/GuruWalkUnauthorized.tsx
import Link from "next/link";

export default function GuruWalkUnauthorized() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700">
          Restricted
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
          Not your booking
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Only the assigned Guru for this booking can open the live walk
          publisher. Switch accounts or open a booking assigned to you.
        </p>
        <Link
          href="/guru/dashboard/bookings"
          className="mt-6 inline-flex rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white"
        >
          Back to Guru bookings
        </Link>
      </div>
    </main>
  );
}
