import { notFound, redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";
import { readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import InternAssignmentDetailLayout from "@/components/internship/InternAssignmentDetailLayout";

export const dynamic = "force-dynamic";

export default async function InternAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) {
    const admin = await getAdminIdentity();
    if (admin?.canAccessAdmin) redirect("/admin/internship/portal");
    notFound();
  }
  const { id } = await params;
  const task = data.workspace.tasks.find((row) => row.id === id);
  if (!task || task.internId !== data.workspace.intern.id || String(task.status) === "draft") notFound();

  const paramsValues = searchParams ? await searchParams : {};
  const flashValue = (key: "ok" | "error") => {
    const raw = paramsValues[key];
    return String(Array.isArray(raw) ? raw[0] : raw || "");
  };
  const integrations = await listAssignmentIntegrations([task.id]);

  return (
    <InternAssignmentDetailLayout
      workspace={data.workspace}
      task={task}
      integrations={integrations}
      backHref="/intern/assignments"
      canSaveToSharePoint={readMicrosoftGraphConfig().configured}
      flash={{ ok: flashValue("ok"), error: flashValue("error") }}
    />
  );
}
