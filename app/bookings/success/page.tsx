"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, CalendarDays, Clock, Home, ArrowRight } from "lucide-react";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/90 backdrop-blur-xl shadow-xl ${className}`}>
      {children}
    </div>
  );
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const guruName = searchParams.get("guru") || "the Guru";
  const service = searchParams.get("service") || "service";

  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/bookings"); // Redirect to bookings list after countdown
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <GlassCard className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-emerald-600/10 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="h-16 w-16 text-emerald-500" />
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-4">Booking Request Sent!</h1>
          <p className="text-2xl text-gray-300 mb-10">
            Your request for <span className="text-emerald-400 font-semibold">{service}</span> with{" "}
            <span className="font-semibold">{guruName}</span> has been sent successfully.
          </p>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 mb-10 space-y-6 text-left">
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400 flex items-center gap-3">
                <CalendarDays className="h-5 w-5" /> Date
              </span>
              <span className="font-medium">You will be notified once confirmed</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400 flex items-center gap-3">
                <Clock className="h-5 w-5" /> Status
              </span>
              <span className="text-emerald-400 font-medium">Pending Confirmation</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Response Time</span>
              <span className="font-medium">Usually within 24 hours</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/bookings"
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 transition rounded-2xl font-semibold text-lg flex items-center justify-center gap-3"
            >
              View My Bookings
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/search"
              className="w-full py-5 border border-gray-700 hover:bg-gray-900 transition rounded-2xl font-medium text-lg"
            >
              Book Another Service
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-10">
            You will be redirected to your bookings page in{" "}
            <span className="font-mono text-emerald-400">{countdown}</span> seconds...
          </p>
        </GlassCard>

        <div className="text-center mt-8">
          <Link href="/" className="text-gray-500 hover:text-white flex items-center justify-center gap-2 text-sm">
            <Home className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}