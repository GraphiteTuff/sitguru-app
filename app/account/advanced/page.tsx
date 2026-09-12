import Link from "next/link";
import DeleteAccountFlow from "@/components/account/DeleteAccountFlow";

export const metadata = {
  title: "Advanced account options | SitGuru",
  description: "Deactivate or delete your SitGuru account.",
};

export default function AccountAdvancedPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/account"
          className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          ← Back to Profile & Account
        </Link>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950">
          Advanced account options
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Deactivate or permanently delete your SitGuru account. These actions
          use SitGuru&apos;s production account APIs.
        </p>
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <DeleteAccountFlow />
        </div>
      </div>
    </main>
  );
}
