import InternPortalHeader from "@/components/internship/InternPortalHeader";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { getInternOnboarding } from "@/lib/internship/queries";

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (internDocumentationModeEnabled()) {
    return (
      <div className="min-h-dvh overflow-x-hidden bg-[#FAF6EE]">
        <InternPortalHeader assigned onboarded />
        {children}
      </div>
    );
  }

  const intern = await currentAssignedIntern();
  const ack = intern ? await getInternOnboarding(intern.id) : null;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#FAF6EE]">
      <InternPortalHeader assigned={Boolean(intern)} onboarded={internOnboardingComplete(ack)} />
      {children}
    </div>
  );
}
