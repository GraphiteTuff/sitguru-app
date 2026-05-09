import Link from "next/link";
import AccountLifecycleTable from "@/components/admin/AccountLifecycleTable";

export default function AdminAccountsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ← Back to admin
          </Link>
        </div>

        <AccountLifecycleTable
          title="Account lifecycle"
          description="Platform-wide account lifecycle tracking for customers, Gurus, admins, deleted users, suspended accounts, and cancelled Guru services."
          defaultRole="all"
        />
      </div>
    </main>
  );
}