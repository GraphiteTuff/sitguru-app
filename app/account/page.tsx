import Link from "next/link";
import ProfileAndAccountPanel from "@/components/account/ProfileAndAccountPanel";

export const metadata = {
  title: "Profile & Account | SitGuru",
  description:
    "Manage your SitGuru account identity, login security, and privacy controls.",
};

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <Link
            href="/customer/dashboard"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
            Profile & Account
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            SitGuru account identity, login security, and privacy — shared across
            every workspace you are authorized to use.
          </p>
        </div>

        <ProfileAndAccountPanel />
      </div>
    </main>
  );
}
