import { PROGRAM_CONTROL_PATHS } from "@/lib/internship/program-controls";
import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerDeskHome from "@/components/manager/ManagerDeskHome";
import { countPendingContentReviews } from "@/lib/internship/content-studio-actions";

export const dynamic = "force-dynamic";

export default async function ManagerPortalHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const requested = Array.isArray(params.as) ? params.as[0] : params.as;
  const desk = await loadManagerDeskBundle(access.actor.isSuperUser ? requested : null);
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Manager&apos;s Desk unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Sign in with a Social Media & Community Growth Manager account to open this desk.
        </p>
      </div>
    );
  }
  const pendingContent = await countPendingContentReviews(
    desk.viewingUserId || access.actor.id,
    desk.viewingUserId ? false : access.actor.isSuperUser,
  );
  return (
    <div className="space-y-4">
      <nav aria-label="Internship" className="flex flex-wrap gap-2">
        <Link href="/manager/instructor" className="inline-flex min-h-12 items-center rounded-xl bg-[#10583f] px-4 text-sm font-bold !text-white">Instructor Center</Link>
        <Link href={PROGRAM_CONTROL_PATHS.manager} className="inline-flex min-h-12 items-center rounded-xl border border-emerald-900 bg-white px-4 text-sm font-bold text-emerald-950">Program Controls</Link>
      </nav>
      <ManagerDeskHome desk={desk} pendingContent={pendingContent} />
    </div>
  );
}
