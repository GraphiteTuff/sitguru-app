export default function GuruDashboardEarningsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Guru Earnings
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Earnings
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Review payout progress, completed booking income, platform fees, and future expected earnings.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Earnings
            </p>
            <p className="mt-3 text-3xl font-black text-white">$0</p>
            <p className="mt-2 text-sm text-slate-300">
              Lifetime Guru earnings will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Pending Payouts
            </p>
            <p className="mt-3 text-3xl font-black text-white">$0</p>
            <p className="mt-2 text-sm text-slate-300">
              Pending payout totals will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Platform Fees
            </p>
            <p className="mt-3 text-3xl font-black text-white">$0</p>
            <p className="mt-2 text-sm text-slate-300">
              Fee tracking and payout deductions will appear here.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Next Payout
            </p>
            <p className="mt-3 text-3xl font-black text-white">--</p>
            <p className="mt-2 text-sm text-slate-300">
              Your next payout estimate will appear here.
            </p>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Earnings workspace
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            This page is now a valid Next.js module and will stop the current build failure.
            After the build is clean, you can add live Stripe payout and booking revenue data here.
          </p>
        </section>
      </div>
    </div>
  );
}