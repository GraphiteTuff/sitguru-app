import InternshipProgramControls from "@/components/internship/InternshipProgramControls";

export const dynamic = "force-dynamic";

export default function ProgramControlsPage({ searchParams }: {
  searchParams: Promise<{ cohort?: string; result?: string }>;
}) {
  return <InternshipProgramControls mode="admin" searchParams={searchParams} />;
}
