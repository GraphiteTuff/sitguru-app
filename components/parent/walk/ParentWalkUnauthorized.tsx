// components/parent/walk/ParentWalkUnauthorized.tsx
import Link from "next/link";

export default function ParentWalkUnauthorized() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_55%)] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700">
          Unauthorized
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
          Access denied
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          This live walk belongs to another Pet Parent account. Sign in with the
          booking owner profile to follow Scout&apos;s route.
        </p>
        <Link
          href="/customer/dashboard/bookings"
          className="mt-6 inline-flex rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white"
        >
          Back to my bookings
        </Link>
      </div>
    </main>
  );
}
