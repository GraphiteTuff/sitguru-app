import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import InternSectionScaffold from "@/components/internship/InternSectionScaffold";
import { INTERN_ROUTES } from "@/lib/internship/intern-routes";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InternSettingsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  const name = data?.workspace.intern.fullName || "Intern";

  return (
    <InternSectionScaffold
      title="Settings"
      subtitle="Your intern profile and portal preferences — one place, no buried pages."
      icon={<Settings size={22} />}
    >
      <article className={`${DESK_UI.card} p-4 sm:p-5`}>
        <h2 className="text-lg font-black text-[#0F2744]">Account</h2>
        <p className="mt-2 text-sm font-medium text-slate-600">Signed in as {name}.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={INTERN_ROUTES.home}
            className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]"
          >
            Back to Home
          </Link>
          <Link
            href={INTERN_ROUTES.help}
            className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]"
          >
            Open Help
          </Link>
          <Link
            href={INTERN_ROUTES.hours}
            className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]"
          >
            My Hours
          </Link>
          <Link
            href={INTERN_ROUTES.messages}
            className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]"
          >
            Messages
          </Link>
        </div>
      </article>
    </InternSectionScaffold>
  );
}
