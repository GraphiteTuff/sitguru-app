"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import Link from "next/link";                    // ← Added this import
import { Check, X, Clock, CalendarDays } from "lucide-react";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function GuruBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [guruId, setGuruId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/guru/login";
        return;
      }
      setGuruId(user.id);

      const { data } = await supabase
        .from("bookings")
        .select(`
          id, 
          service, 
          booking_date, 
          status, 
          price, 
          message,
          created_at,
          customer:customer_id (first_name, last_name)
        `)
        .eq("sitter_id", user.id)
        .order("booking_date", { ascending: true });

      setBookings(data || []);
      setLoading(false);
    }
    loadBookings();
  }, []);

  const updateBookingStatus = async (bookingId: string, newStatus: "confirmed" | "rejected") => {
    setActionLoading(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } else {
      alert("Failed to update booking status.");
    }
    setActionLoading(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading your bookings...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">My Bookings</h1>
            <p className="text-gray-400">Manage incoming requests and confirmed bookings</p>
          </div>
          <Link 
            href="/guru/dashboard" 
            className="text-emerald-400 hover:underline flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <GlassCard className="p-8">
          {bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">🐾</div>
                      <div>
                        <p className="font-semibold text-lg">
                          {booking.customer?.first_name} {booking.customer?.last_name}
                        </p>
                        <p className="text-emerald-400">{booking.service}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(booking.booking_date), "EEEE, MMMM d")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(booking.booking_date), "h:mm a")}
                      </div>
                    </div>

                    {booking.message && (
                      <p className="mt-4 text-sm text-gray-300 italic border-l-2 border-gray-700 pl-4">
                        "{booking.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">${booking.price}</p>
                      <p className={`text-sm font-medium ${booking.status === "pending" ? "text-amber-400" : booking.status === "confirmed" ? "text-emerald-400" : "text-red-400"}`}>
                        {booking.status.toUpperCase()}
                      </p>
                    </div>

                    {booking.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          disabled={actionLoading === booking.id}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded-2xl font-medium flex items-center gap-2 transition"
                        >
                          <Check className="h-4 w-4" /> Accept
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, "rejected")}
                          disabled={actionLoading === booking.id}
                          className="px-6 py-3 bg-red-600/80 hover:bg-red-600 disabled:bg-gray-700 rounded-2xl font-medium flex items-center gap-2 transition"
                        >
                          <X className="h-4 w-4" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              No bookings yet.<br />
              When customers book you, they will appear here.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}