export default function GuruDashboardAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Guru Analytics
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Track bookings, conversion, customer activity, revenue trends, and profile performance from one place.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Booking Conversion
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Booking conversion metrics will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Revenue Trend
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Revenue tracking will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Profile Views
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Profile engagement data will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Repeat Customers
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Repeat customer analytics will appear here.
            </p>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Analytics workspace
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            This page is now a valid Next.js route and will stop the build from failing.
            Next, you can layer in real charts and data sources.
          </p>
        </section>
      </div>
    </div>
  );
}