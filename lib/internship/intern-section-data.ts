import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { documentationInternWorkspace } from "@/lib/internship/documentation-fixture";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import { getInternWorkspace } from "@/lib/internship/queries";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";

export async function loadInternSectionWorkspace(): Promise<{
  workspace: InternshipWorkspaceData;
  hourSummary: HourSummary;
  firstName: string;
} | null> {
  const documentation = internDocumentationModeEnabled();
  const assigned = documentation ? null : await currentAssignedIntern();
  const workspace = documentation
    ? documentationInternWorkspace()
    : assigned
      ? await getInternWorkspace(assigned.id)
      : null;
  if (!workspace) return null;

  const hourSummary = summarizeInternshipHours({
    requiredHours: workspace.intern.requiredHours,
    requirementStatus: workspace.intern.requirementStatus,
    plannedWeeklyHours: workspace.intern.plannedWeeklyHours,
    internshipWeeks: workspace.intern.internshipWeeks,
    startDate: workspace.intern.academicStartDate,
    entries: (workspace.timeLogs || []).map((row) => ({
      workedOn: row.workedOn,
      hours: row.hours,
      status: row.status,
      weekNumber: row.weekNumber,
    })),
    exceptions: workspace.scheduleExceptions,
    weekZeroReady: true,
    internshipStatus: workspace.intern.status,
  });

  const firstName =
    workspace.intern.preferredName ||
    workspace.intern.fullName.split(/\s+/)[0] ||
    "Intern";

  return { workspace, hourSummary, firstName };
}
