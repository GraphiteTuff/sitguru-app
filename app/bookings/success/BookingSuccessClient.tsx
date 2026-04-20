"use client";

import Link from "next/link";
import { useEffect } from "react";

type BookingSuccessClientProps = {
  bookingId: string;
};

export default function BookingSuccessClient({
  bookingId,
}: BookingSuccessClientProps) {
  useEffect(() => {
    let mounted = true;

    async function fireConfetti() {
      const mod = await import("canvas-confetti");
      const confetti = mod.default;

      if (!mounted) return;

      const end = Date.now() + 1800;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
      });

      frame();
    }

    fireConfetti();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
        <section className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-white/95 p-8 text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl shadow-inner">
            🎉
          </div>

          <h1 className="mt-6 text-center text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Booking Request Sent!
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-8 text-slate-600">
            Your payment was completed successfully. Your Guru will review your
            booking and respond shortly.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-emerald-800">Booking ID</p>
            <p className="mt-1 break-all text-sm text-emerald-700">
              {bookingId}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/search"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Book Another Guru
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}