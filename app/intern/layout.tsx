import { Suspense } from "react";
import InternPortalShell from "@/components/internship/InternPortalShell";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { getInternOnboarding, getUniversity } from "@/lib/internship/queries";

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
            {children}
          </InternPortalShell>
        </Suspense>
      </>
    );
  }

  const intern = await currentAssignedIntern();
  const ack = intern ? await getInternOnboarding(intern.id) : null;
  const school = intern?.universityId ? await getUniversity(intern.universityId) : null;

  return (
    <>
      <WorkspaceLiveSyncMount />
      <Suspense fallback={<div className="min-h-dvh bg-[#F3F6F4]" />}>
        <InternPortalShell
          assigned={Boolean(intern)}
          onboarded={internOnboardingComplete(ack)}
          schoolLogoUrl={school?.logoUrl || ""}
        >
          {children}
        </InternPortalShell>
      </Suspense>
    </>
  );
}
