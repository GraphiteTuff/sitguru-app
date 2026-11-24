import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Eye, Repeat2, Wallet } from "lucide-react";
import GuruPageHero from "@/components/guru/GuruPageHero";

const METRICS = [
  { label: "Booking conversion", note: "Available when conversion tracking is connected", icon: CalendarDays },
  { label: "Revenue trend", note: "See actual payments in Earnings", icon: Wallet },
  { label: "Profile views", note: "Available when profile analytics are connected", icon: Eye },
  { label: "Repeat Pet Parents", note: "Available when repeat booking reports are connected", icon: Repeat2 },
];

export default function GuruDashboardAnalyticsPage() {
  return (
    <main className="min-h-[70svh] bg-[#F7FFFB] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <GuruPageHero
          eyebrow="YOUR BUSINESS INSIGHTS"
          title="Guru Analytics"
          description="Understand your booking activity and grow your pet care business. Only verified metrics should appear here."
          action={{ href: "/guru/dashboard/earnings", label: "View Actual Earnings" }}
        />
        <section aria-label="Analytics cards" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(({ label, note, icon: Icon }) => (
            <article key={label} className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <h2 className="mt-4 text-base font-black text-slate-950">{label}</h2>
              <p className="mt-2 text-3xl font-black text-slate-950" aria-label={label + " not available yet"}>—</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{note}</p>
            </article>
          ))}
        </section>
        <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-1 h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Keep growing while reporting is connected</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">You can already review requests and completed care, check real earnings, and promote your public Guru profile. Future metrics will appear only after their data is available.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              { label: "My Bookings", href: "/guru/dashboard/bookings" },
              { label: "My Earnings", href: "/guru/dashboard/earnings" },
              { label: "Promote My Profile", href: "/guru/dashboard/promote" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-center text-sm font-black text-emerald-900 transition hover:bg-emerald-100">
                {item.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
