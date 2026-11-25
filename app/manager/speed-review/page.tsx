import InternshipInstructorWorkspace from "@/components/internship/InternshipInstructorWorkspace";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

export default async function ManagerSpeedReviewPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <InternshipInstructorWorkspace mode="manager" searchParams={searchParams} speedReview />;
}
