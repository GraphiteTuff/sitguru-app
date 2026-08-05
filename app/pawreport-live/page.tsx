// app/pawreport-live/page.tsx
/**
 * Marketing explainer for PawReport Live (not booking-backed).
 * Real live data: /customer/dashboard/bookings/[id]/visit-updates
 *               + /guru/dashboard/bookings/[id]/visit-updates
 */

import Link from "next/link";
import { PawReportLiveDashboard } from "@/components/pawreport";

export const metadata = {
  title: "PawReport Live | SitGuru",
  description:
    "See how SitGuru PawReport Live keeps pet parents updated with walks, photos, and care checklists.",
};

export default function PawReportLiveMarketingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/40 to-sky-50/50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            How PawReport works
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
            Live care updates, built into every booking.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
            This page explains the experience. Your real PawReport Live stream
            opens from an active booking — Gurus log walks and photos; Pet
            Parents follow along in real time.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          {/* Demo-only UI — allowRoleSwitch is for education, not production data */}
          <PawReportLiveDashboard
            role="pet_parent"
            allowRoleSwitch
            petName="Scout"
            guruName="your Guru"
          />
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/customer/dashboard/bookings"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-black text-white hover:bg-emerald-800"
          >
            Open my bookings
          </Link>
          <Link
            href="/guru/dashboard/bookings"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white px-6 text-sm font-black text-emerald-800 hover:bg-emerald-50"
          >
            Guru visit tracker
          </Link>
        </div>
      </div>
    </main>
  );
}
