import InternshipInstructorWorkspace from "@/components/internship/InternshipInstructorWorkspace";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

export default async function ManagerInstructorPage({ searchParams }: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <InternshipInstructorWorkspace mode="manager" searchParams={searchParams} />;
}
