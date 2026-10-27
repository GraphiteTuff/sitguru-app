import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerDeskHome from "@/components/manager/ManagerDeskHome";

export const dynamic = "force-dynamic";

export default async function ManagerPortalHomePage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const desk = await loadManagerDeskBundle();
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Manager Desk unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Sign in with a Social Media & Community Growth Manager account to open this desk.
        </p>
      </div>
    );
  }
  return <ManagerDeskHome desk={desk} />;
}
