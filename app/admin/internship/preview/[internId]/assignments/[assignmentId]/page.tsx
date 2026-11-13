import { notFound } from "next/navigation";
import InternAssignmentDetailLayout from "@/components/internship/InternAssignmentDetailLayout";
import { adminInternAssignmentsPath, requireAdminInternAssignmentPreview } from "@/lib/internship/admin-preview";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";

export const dynamic = "force-dynamic";

/** Administrator preview is deliberately read-only; no save/submit action is attached. */
export default async function AdminInternAssignmentDetailPreviewPage({
  params,
}: {
  params: Promise<{ internId: string; assignmentId: string }>;
}) {
  const { internId, assignmentId } = await params;
  const workspace = await requireAdminInternAssignmentPreview(internId);
  const task = workspace.tasks.find((item) => item.id === assignmentId && item.internId === workspace.intern.id);
  if (!task || String(task.status) === "draft") notFound();
  const integrations = await listAssignmentIntegrations([task.id]);

  return (
    <main className="px-3 pb-12 sm:px-5">
      <InternAssignmentDetailLayout
        workspace={workspace}
        task={task}
        integrations={integrations}
        backHref={adminInternAssignmentsPath(internId)}
        adminPreview
        canSaveToSharePoint={false}
      />
    </main>
  );
}
