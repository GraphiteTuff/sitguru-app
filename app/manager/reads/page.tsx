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
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManagerReadsPage({ searchParams }: PageProps) {
  const access = await requireReadsPortal("manager");
  if (!access.ok) return access.ui;

  const params = (await searchParams) || {};
  const tab =
    typeof params.tab === "string" ? params.tab : "overview";

  const [kpis, content, teamMembers, topics, analytics, partnersRes] =
    await Promise.all([
      fetchStaffKpis(),
      fetchStaffContent({ limit: 200 }),
      fetchTeamMembers(),
      fetchReadsTopics(),
      summarizeReadsAnalytics({ sinceDays: 30 }),
      supabaseAdmin
        .from("reads_partners")
        .select("id,name,partner_type,status,escalated_to_admin,organization,email")
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

  return (
    <ReadsStaffShell
      role="manager"
      title="Ava — Reads & Media"
      subtitle="Growth Manager review, publishing, Team Picks, partnerships, and analytics."
    >
      <ReadsStaffDashboard
        role="manager"
        tab={tab}
        kpis={kpis}
        content={content}
        partners={partnersRes.data || []}
        teamMembers={teamMembers}
        topics={topics}
        analytics={analytics}
      />
    </ReadsStaffShell>
  );
}
