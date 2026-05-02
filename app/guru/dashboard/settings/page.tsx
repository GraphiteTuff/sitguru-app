export default function GuruDashboardSettingsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Guru Settings
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Settings
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Manage account preferences, booking defaults, notification behavior,
            profile visibility, and workspace options from one place.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Account
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Login and identity
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Update account-level preferences, login-related options, and
              professional identity controls.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Notifications
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Alerts and messages
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Choose how you receive booking alerts, payout updates, customer
              messages, and platform notices.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Booking Defaults
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Availability and preferences
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Set default behavior for bookings, lead times, approvals, and
              calendar preferences.
            </p>
          </section>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Settings workspace
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            This page is now a valid Next.js module and will clear the current
            build error. After the build is clean, you can add real settings
            forms, notification toggles, privacy controls, and booking defaults
            here.
          </p>
        </section>
      </div>
    </div>
  );
}
