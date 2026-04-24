import { Suspense } from "react";
import BookingNewClient from "./BookingNewClient";

export const dynamic = "force-dynamic";

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-10 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
              <p className="text-base font-semibold text-white">
                Loading booking experience...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <BookingNewClient />
    </Suspense>
  );
}
