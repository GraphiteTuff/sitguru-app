import ReadsStaffShell from "@/components/reads/staff/ReadsStaffShell";
import ReadsStaffDashboard from "@/components/reads/staff/ReadsStaffDashboard";
import { requireReadsPortal } from "@/lib/reads/portal-access";
import { summarizeReadsAnalytics } from "@/lib/reads/analytics";
import {
  fetchStaffContent,
  fetchStaffKpis,
  fetchTeamMembers,
  fetchReadsTopics,
} from "@/lib/reads/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternReadsPage({ searchParams }: PageProps) {
  const access = await requireReadsPortal("intern");
  if (!access.ok) return access.ui;

  // Managers/admins can also open the intern surface for coaching.
  const params = (await searchParams) || {};
  const tab =
    typeof params.tab === "string" ? params.tab : "overview";

  const ownOnly = access.identity.staffRole === "intern";

  const [kpis, content, teamMembers, topics, analytics] = await Promise.all([
    fetchStaffKpis({
      createdBy: ownOnly ? access.identity.id : undefined,
    }),
    fetchStaffContent({
      createdBy: ownOnly ? access.identity.id : undefined,
      limit: 200,
    }),
    fetchTeamMembers(),
    fetchReadsTopics(),
    summarizeReadsAnalytics({
      sinceDays: 30,
      createdBy: ownOnly ? access.identity.id : undefined,
    }),
  ]);

  return (
    <ReadsStaffShell
      role="intern"
      title="Intern Content Studio — Reads & Media"
      subtitle="Research, draft, submit to Ava. No self-approval or direct publishing."
    >
      <ReadsStaffDashboard
        role="intern"
        tab={tab}
        kpis={kpis}
        content={content}
        teamMembers={teamMembers}
        topics={topics}
        analytics={analytics}
      />
    </ReadsStaffShell>
  );
}
