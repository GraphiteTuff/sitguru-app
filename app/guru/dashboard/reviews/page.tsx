export default function GuruDashboardReviewsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Guru Reviews
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Reviews
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Review customer feedback, ratings, sentiment, and service quality trends from one place.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Average Rating
            </p>
            <p className="mt-3 text-3xl font-black text-white">0.0</p>
            <p className="mt-2 text-sm text-slate-300">
              Your average review score will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Reviews
            </p>
            <p className="mt-3 text-3xl font-black text-white">0</p>
            <p className="mt-2 text-sm text-slate-300">
              Review totals will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              5-Star Reviews
            </p>
            <p className="mt-3 text-3xl font-black text-white">0</p>
            <p className="mt-2 text-sm text-slate-300">
              Top-rated review counts will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Response Rate
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Review response activity will appear here.
            </p>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Reviews workspace
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            This page is now a valid Next.js module and will clear the current build error.
            Once the build is fully clean, you can add review feeds, moderation tools, and rating analytics here.
          </p>
        </section>
      </div>
    </div>
  );
}
