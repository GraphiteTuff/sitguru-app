import { requireGrowthWorkplace, currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { documentationInternWorkspace } from "@/lib/internship/documentation-fixture";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { getInternWorkspace } from "@/lib/internship/queries";
import { loadStaffInbox } from "@/lib/messaging/staff-data";
import { buildInternGrowthSummary } from "@/lib/internship/growth-home-data";
import InternGrowthWorkspaceHome from "@/components/internship/InternGrowthWorkspaceHome";

export const dynamic = "force-dynamic";

export default async function InternGrowthHomePage() {
  const access=await requireGrowthWorkplace("intern");
  if(!access.ok)return access.ui;

  const documentation=internDocumentationModeEnabled();
  const assigned=documentation?null:await currentAssignedIntern();
  const workspace=documentation
    ? documentationInternWorkspace()
    : assigned
      ? await getInternWorkspace(assigned.id)
      : null;
  if(!workspace) {
    return (
      <section className="mx-auto max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#0F2744]">Growth Workspace unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          No assigned internship workspace could be loaded for this account. Open your Intern Portal or ask your manager to review your linked account.
        </p>
        <a href="/intern" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white">Intern Portal</a>
      </section>
    );
  }
  const inbox=assigned?.userId && assigned.userId===access.actor.id
    ? await loadStaffInbox(access.actor.id,false,"intern")
    : {conversations:[]};
  const recentMessages=inbox.conversations.slice(0,3).map(conversation=>({
    author:conversation.messages[conversation.messages.length-1]?.author || conversation.subject,
    preview:conversation.preview || conversation.messages[conversation.messages.length-1]?.body || "",
  }));
  const summary=buildInternGrowthSummary({workspace,recentMessages});
  return <InternGrowthWorkspaceHome {...summary}/>;
}
