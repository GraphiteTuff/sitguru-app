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

export default async function AdminReadsPage({ searchParams }: PageProps) {
  const access = await requireReadsPortal("admin");
  if (!access.ok) {
    // Allow managers with admin HQ access to open oversight in read/write manager mode
    // by requiring admin staffRole specifically for this route.
    return access.ui;
  }

  const params = (await searchParams) || {};
  const tab =
    typeof params.tab === "string" ? params.tab : "overview";

  const [kpis, content, teamMembers, topics, analytics, partnersRes] =
    await Promise.all([
      fetchStaffKpis(),
      fetchStaffContent({ limit: 300 }),
      fetchTeamMembers(),
      fetchReadsTopics(),
      summarizeReadsAnalytics({ sinceDays: 90 }),
      supabaseAdmin
        .from("reads_partners")
        .select("id,name,partner_type,status,escalated_to_admin,organization,email")
        .order("updated_at", { ascending: false })
        .limit(200),
    ]);

  return (
    <ReadsStaffShell
      role="admin"
      title="Admin — Reads & Media Oversight"
      subtitle="Full content oversight, escalations, taxonomy, partnerships, and analytics with audit trail."
    >
      <ReadsStaffDashboard
        role="admin"
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
