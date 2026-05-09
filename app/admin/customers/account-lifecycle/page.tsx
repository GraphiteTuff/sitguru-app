import Link from "next/link";
import AccountLifecycleTable from "@/components/admin/AccountLifecycleTable";

export default function CustomerAccountLifecyclePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/customers"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ← Back to Customers
          </Link>

          <span className="text-sm font-semibold text-slate-300">/</span>

          <Link
            href="/admin/accounts"
            className="text-sm font-bold text-slate-500 hover:text-emerald-700 hover:underline"
          >
            All account lifecycle
          </Link>
        </div>

        <AccountLifecycleTable
          title="Customer account lifecycle"
          description="Customer-only lifecycle tracking for active, deactivated, suspended, deleted, and reactivated customer accounts."
          defaultRole="customer"
          lockedRole="customer"
        />
      </div>
    </main>
  );
}