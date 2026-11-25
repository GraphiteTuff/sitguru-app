import InternshipInstructorWorkspace from "@/components/internship/InternshipInstructorWorkspace";

export const dynamic = "force-dynamic";

export default async function AdminInstructorPage({ searchParams }: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  return <InternshipInstructorWorkspace mode="admin" searchParams={searchParams} />;
}
