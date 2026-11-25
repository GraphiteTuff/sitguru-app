import ProgramStatusBanner from "@/components/internship/ProgramStatusBanner";
import { getProgramStatus } from "@/lib/internship/program-controls";
import { Suspense } from "react";
import GrowthWorkstreamSwitcher from "@/components/portal/GrowthWorkstreamSwitcher";
import InternPortalShell from "@/components/internship/InternPortalShell";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { getInternOnboarding, getUniversity } from "@/lib/internship/queries";
import { countDeskUnread } from "@/lib/messaging/mark-conversation-read";
import { createClient } from "@/lib/supabase/server";

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (internDocumentationModeEnabled()) {
    return (
      <>
        <WorkspaceLiveSyncMount />
        <Suspense fallback={<div className="min-h-dvh bg-[#F3F6F4]" />}>
          <InternPortalShell assigned onboarded>
            <ProgramStatusBanner status="pre_launch" />
            <GrowthWorkstreamSwitcher role="intern" />
            {children}
          </InternPortalShell>
        </Suspense>
      </>
    );
  }

  const intern = await currentAssignedIntern();
  const [ack, school, status] = await Promise.all([
    intern ? getInternOnboarding(intern.id) : null,
    intern?.universityId ? getUniversity(intern.universityId) : null,
    intern ? getProgramStatus(intern.cohortId) : null,
  ]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unreadMessages = user ? await countDeskUnread(user.id) : 0;

  return (
    <>
      <WorkspaceLiveSyncMount />
      <Suspense fallback={<div className="min-h-dvh bg-[#F3F6F4]" />}>
        <InternPortalShell
          assigned={Boolean(intern)}
          onboarded={internOnboardingComplete(ack)}
          schoolLogoUrl={school?.logoUrl || ""}
          unreadMessages={unreadMessages}
        >
          {intern ? <ProgramStatusBanner status={status} /> : null}
          <GrowthWorkstreamSwitcher role="intern" />
          {children}
        </InternPortalShell>
      </Suspense>
    </>
  );
}
