import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipPlaybook from "@/components/internship/InternshipPlaybook";
import { INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";

export const dynamic = "force-dynamic";

export default async function InternshipPlaybookPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-8">
      <Link href="/admin/internship" className="text-xs font-black text-emerald-800">
        Internship Program
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
          Educational structure · any university
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {INTERNSHIP_PROGRAM_NAME}
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
          Learning objectives, semester deliverables, weekly rhythm, measurement
          hierarchy, and SMART controls belong to SitGuru. Credit, hours, and
          funding stay on each intern’s academic profile.
        </p>
      </div>
      <InternshipPlaybook />
    </main>
  );
}
