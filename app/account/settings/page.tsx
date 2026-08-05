import Link from "next/link";
import AdvancedAccountOptionsCard from "@/components/account/AdvancedAccountOptionsCard";

export default function AccountSettingsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
            Account settings
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Manage your SitGuru profile, login preferences, privacy, and
            advanced account options.
          </p>
        </div>

        <div className="grid gap-5">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update your name, contact details, profile photo, and basic
              account information from your role dashboard settings.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/customer/dashboard/profile"
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800"
              >
                Pet Parent settings
              </Link>
              <Link
                href="/guru/dashboard/profile"
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800"
              >
                Guru settings
              </Link>
              <Link
                href="/ambassador/dashboard/profile"
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800"
              >
                Ambassador settings
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Login & password
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage your email, password, and login security.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Notifications
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose which account, booking, and SitGuru updates you receive.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Privacy & security
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review privacy preferences and account access settings.
            </p>
          </section>

          <AdvancedAccountOptionsCard />
        </div>
      </div>
    </main>
  );
}