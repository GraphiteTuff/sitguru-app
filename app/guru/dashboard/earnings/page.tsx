"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  DollarSign,
  PiggyBank,
  Sparkles,
  Wallet,
} from "lucide-react";

const earningsSummary = {
  totalEarnings: 0,
  pendingPayouts: 0,
  paidOut: 0,
  thisMonth: 0,
  completedBookings: 0,
  sitguruFees: 0,
};

const recentEarnings = [
  {
    id: "BK-0000",
    date: "—",
    service: "No completed bookings yet",
    petParent: "—",
    gross: 0,
    fee: 0,
    net: 0,
    status: "Pending",
  },
];

const referralPreview = [
  {
    title: "Refer a Guru",
    description:
      "Invite another great Guru to SitGuru. When they join and complete their first qualified booking, you may be eligible for a referral reward.",
  },
  {
    title: "Referral Tracking",
    description:
      "As SitGuru grows, you’ll be able to track referrals, reward status, and growth opportunities directly from your dashboard.",
  },
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function statusClasses(status: string) {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Processing":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function GuruDashboardEarningsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Guru Earnings
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Keep more of what you earn.
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-300">
                SitGuru is built to support Gurus with a lower platform fee than
                many larger marketplaces. Earnings shown here reflect completed
                bookings, the SitGuru platform fee, payout status, and what you
                take home after applicable deductions.
              </p>
            </div>

            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    Introductory Platform Fee
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">8%</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-emerald-50/90">
                That means more of each completed booking stays with you while
                SitGuru continues building a more Guru-friendly platform.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                Total Earnings
              </p>
              <span className="text-emerald-300">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {currency(earningsSummary.totalEarnings)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Net earnings from completed bookings
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                Pending Payouts
              </p>
              <span className="text-amber-300">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {currency(earningsSummary.pendingPayouts)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Awaiting payout processing
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Paid Out</p>
              <span className="text-sky-300">
                <PiggyBank className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {currency(earningsSummary.paidOut)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Successfully paid to you
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                This Month
              </p>
              <span className="text-emerald-300">
                <DollarSign className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {currency(earningsSummary.thisMonth)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Net earnings this month
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                Completed Bookings
              </p>
              <span className="text-violet-300">
                <CalendarDays className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {earningsSummary.completedBookings}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Qualified completed services
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                SitGuru Fees
              </p>
              <span className="text-rose-300">
                <BadgeDollarSign className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {currency(earningsSummary.sitguruFees)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Total 8% platform fees deducted
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Recent Earnings Activity
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Booking-by-booking breakdown
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                Gross amount − 8% fee = your net earnings
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Service</th>
                    <th className="px-6 py-4 font-semibold">Pet Parent</th>
                    <th className="px-6 py-4 font-semibold">Gross</th>
                    <th className="px-6 py-4 font-semibold">Fee</th>
                    <th className="px-6 py-4 font-semibold">Net</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEarnings.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/10 text-sm text-slate-200"
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-white">{item.date}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">{item.service}</td>
                      <td className="px-6 py-4 align-top">{item.petParent}</td>
                      <td className="px-6 py-4 align-top">
                        {currency(item.gross)}
                      </td>
                      <td className="px-6 py-4 align-top text-rose-300">
                        -{currency(item.fee)}
                      </td>
                      <td className="px-6 py-4 align-top font-semibold text-emerald-300">
                        {currency(item.net)}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-[0_10px_40px_rgba(16,185,129,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                How Earnings Work
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Simple and transparent
              </h2>

              <div className="mt-6 space-y-4 text-sm leading-7 text-emerald-50">
                <div className="rounded-2xl border border-emerald-300/20 bg-white/5 p-4">
                  <p className="font-semibold text-white">Gross booking total</p>
                  <p className="mt-1">
                    The full amount paid for the completed service.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300/20 bg-white/5 p-4">
                  <p className="font-semibold text-white">SitGuru fee (8%)</p>
                  <p className="mt-1">
                    An introductory platform fee designed to stay Guru-friendly.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300/20 bg-white/5 p-4">
                  <p className="font-semibold text-white">Net earnings</p>
                  <p className="mt-1">
                    What you take home after the SitGuru fee is deducted.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Referrals & Growth
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    More ways to grow
                  </h2>
                </div>
                <ArrowUpRight className="h-5 w-5 text-emerald-300" />
              </div>

              <div className="mt-6 space-y-4">
                {referralPreview.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                  >
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-emerald-300/30 bg-emerald-400/5 p-4">
                <p className="text-sm font-semibold text-emerald-200">
                  Coming Soon
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  SitGuru plans to support referral and affiliate opportunities
                  as the platform grows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Note
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Introductory 8% platform fee
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-300">
                SitGuru’s current model is designed to help Gurus keep more from
                each completed booking. Platform fees, payout timing, referral
                rewards, and affiliate options may evolve as SitGuru grows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/help"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                View Help Center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}