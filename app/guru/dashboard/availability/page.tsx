"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  CalendarDays, Users, Clock, DollarSign, Star, 
  MessageSquare, TrendingUp, PawPrint, ArrowRight 
} from "lucide-react";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function GuruDashboard() {
  const [guru, setGuru] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    monthlyRevenue: 2840,
    upcomingBookings: 7,
    avgRating: 4.9,
    responseRate: 98,
    activeClients: 12,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/guru/login";
        return;
      }

      const { data: guruData } = await supabase
        .from("gurus")
        .select("*")
        .eq("id", user.id)
        .single();

      setGuru(guruData);

      // Fetch recent bookings (real data from your bookings table)
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, service, booking_date, status, customer_id")
        .eq("sitter_id", user.id)
        .order("booking_date", { ascending: true })
        .limit(6);

      setBookings(bookingData || []);
      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading your command center...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation */}
      <div className="border-b border-gray-800 bg-[#111]/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PawPrint className="h-8 w-8 text-emerald-500" />
            <div className="font-bold text-2xl tracking-tight">SitGuru Guru Hub</div>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <Link href="/guru/dashboard" className="text-emerald-400 font-medium">Dashboard</Link>
            <Link href="/guru/dashboard/availability" className="hover:text-white transition">Availability</Link>
            <Link href="/guru/dashboard/bookings" className="hover:text-white transition">Bookings</Link>
            <Link href="/guru/dashboard/messages" className="hover:text-white transition">Messages</Link>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href = "/guru/login")} className="text-red-400 hover:text-red-300">Sign Out</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter">Welcome back, {guru?.full_name?.split(" ")[0] || "Guru"}</h1>
            <p className="text-gray-400 text-xl mt-2">Your business at a glance • April 2026</p>
          </div>
          <Link 
            href="/guru/dashboard/availability"
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl font-semibold transition"
          >
            <CalendarDays className="h-5 w-5" /> Manage Availability
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <GlassCard className="p-6">
            <p className="text-emerald-400 text-sm">Monthly Revenue</p>
            <p className="text-4xl font-bold mt-3">${stats.monthlyRevenue}</p>
            <p className="text-green-400 text-sm mt-1">↑ 12% this month</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-emerald-400 text-sm">Upcoming Bookings</p>
            <p className="text-4xl font-bold mt-3">{stats.upcomingBookings}</p>
            <p className="text-gray-400 text-sm mt-1">Next 14 days</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-emerald-400 text-sm">Avg Rating</p>
            <p className="text-4xl font-bold mt-3">{stats.avgRating}</p>
            <p className="text-gray-400 text-sm mt-1">from {guru?.review_count || 32} reviews</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-emerald-400 text-sm">Response Rate</p>
            <p className="text-4xl font-bold mt-3">{stats.responseRate}%</p>
            <p className="text-gray-400 text-sm mt-1">Last 30 days</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-emerald-400 text-sm">Active Clients</p>
            <p className="text-4xl font-bold mt-3">{stats.activeClients}</p>
            <p className="text-gray-400 text-sm mt-1">Repeat customers</p>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Recent / Upcoming Bookings */}
          <GlassCard className="lg:col-span-7 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Upcoming & Recent Bookings</h2>
              <Link href="/guru/dashboard/bookings" className="text-emerald-400 text-sm flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {bookings.length > 0 ? bookings.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center py-5 border-b border-gray-800 last:border-none">
                  <div>
                    <p className="font-medium">Booking #{b.id}</p>
                    <p className="text-sm text-gray-400">{b.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className={`text-sm ${b.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}`}>{b.status}</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 py-12 text-center">No bookings yet. Add availability to start receiving requests.</p>
              )}
            </div>
          </GlassCard>

          {/* Quick Stats & Actions */}
          <div className="lg:col-span-5 space-y-8">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Booking Mix</h2>
              <div className="flex justify-between text-sm mb-4">
                <span>Dog-related bookings</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-8">
                <div className="h-full w-[72%] bg-emerald-500 rounded-full"></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cat-related bookings</span>
                <span className="font-medium">28%</span>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <MessageSquare className="h-6 w-6" /> Quick Communication
              </h2>
              <div className="text-sm text-gray-400 mb-4">2 unread messages from customers</div>
              <Link href="/guru/dashboard/messages" className="block text-center py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium">
                Open Messages
              </Link>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}