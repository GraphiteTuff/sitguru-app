import InternPortalHome from "@/components/internship/InternPortalHome";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";

export default function InternDeskVerification({ data, hourSummary }: {
  data: InternshipWorkspaceData;
  hourSummary: HourSummary;
}) {
  return <InternPortalHome data={data} hourSummary={hourSummary} firstName="Fixture" weeklyDone={false} />;
}
