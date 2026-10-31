import Link from "next/link";
import { redirect } from "next/navigation";
import StaffAccessManagement from "@/components/admin/hr/StaffAccessManagement";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadStaffAccessSnapshot } from "@/lib/admin/hr/staff-access";

export const dynamic = "force-dynamic";

export default async function StaffAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/hr");

  const { userId } = await params;
  const staff = await loadStaffAccessSnapshot(userId);
  const query = searchParams ? await searchParams : {};
  const notice = Array.isArray(query.ok) ? query.ok[0] : query.ok || "";
  const noticeError = Array.isArray(query.error) ? query.error[0] : query.error || "";

  if (!staff) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm font-semibold text-slate-500">
          Admin HQ / Hiring & People / Staff Access & Roles
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Account not resolved</h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          SitGuru could not load a verified staff identity for this link. Open Hiring & People and
          use Manage Access & Roles from a team manager card with a linked login.
        </p>
        <Link
          href="/admin/hr"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
        >
          Back to Hiring & People
        </Link>
      </main>
    );
  }

  return (
    <StaffAccessManagement
      staff={staff}
      canEdit={Boolean(actor.isSuperUser && actor.canManageRoles)}
      notice={notice}
      noticeError={noticeError}
    />
  );
}
