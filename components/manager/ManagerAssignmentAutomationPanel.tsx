import Link from "next/link";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { parseAssignmentReminderSettings, REMINDER_DAY_OPTIONS } from "@/lib/internship/assignment-reminder-rules";
import { linkManagerPlannerTask, saveManagerAssignmentReminders } from "@/lib/internship/manager-assignment-reminder-actions";
import type { AssignmentIntegration } from "@/lib/microsoft/assignment-integrations";

const REMINDER_LABELS: Record<number, string> = {
  7: "One week before",
  3: "Three days before",
  1: "One day before",
  0: "On the due date",
};

export default function ManagerAssignmentAutomationPanel({
  assignmentId,
  dueOn,
  briefPayload,
  planner,
}: {
  assignmentId: string;
  dueOn: string;
  briefPayload: unknown;
  planner?: AssignmentIntegration;
}) {
  const reminders = parseAssignmentReminderSettings(briefPayload);
  const manualLink = planner?.status === "linked_manually";
  const apiConnected = planner?.status === "connected";
  const href = planner?.externalUrl || "";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`${DESK_UI.card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-[#0F2744]">Automatic deadline reminders</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">SitGuru</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Automatically notify assigned interns and their managers inside SitGuru before an assignment is due. Only enabled assignments receive reminders; completed and submitted work is excluded.
        </p>
        <form action={saveManagerAssignmentReminders} className="mt-4 space-y-4">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-[#0F2744]">
            <input name="reminderEnabled" type="checkbox" defaultChecked={reminders.enabled} className="h-4 w-4 accent-blue-700" />
            Enable automatic deadline reminders
          </label>
          <fieldset>
            <legend className="text-sm font-black text-[#0F2744]">Send reminders</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REMINDER_DAY_OPTIONS.map((day) => (
                <label key={day} className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  <input name="daysBefore" value={day} type="checkbox" defaultChecked={reminders.daysBefore.includes(day)} className="h-4 w-4 accent-blue-700" />
                  {REMINDER_LABELS[day]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-black text-[#0F2744]">Notify</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
              <label className="flex min-h-10 items-center gap-2">
                <input type="checkbox" name="notifyIntern" defaultChecked={reminders.notifyIntern} className="h-4 w-4 accent-blue-700" />
                Assigned intern
              </label>
              <label className="flex min-h-10 items-center gap-2">
                <input type="checkbox" name="notifyManager" defaultChecked={reminders.notifyManager} className="h-4 w-4 accent-blue-700" />
                Their manager
              </label>
            </div>
          </fieldset>
          <p className="text-xs font-medium text-slate-500">
            {dueOn ? `Current due date: ${dueOn}.` : "Set the assignment due date before enabling reminders."} A daily SitGuru check sends in-app notifications; this does not enable Microsoft Planner email or push notifications.
          </p>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-black !text-white hover:bg-blue-800">
            Save reminder settings
          </button>
        </form>
      </section>

      <section className={`${DESK_UI.card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-[#0F2744]">Microsoft Planner task</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${apiConnected ? "bg-emerald-50 text-emerald-800" : manualLink ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
            {apiConnected ? "API connected" : manualLink ? "Manually linked" : "Setup required"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use Planner for task assignments, checklists, priorities, progress, and Microsoft 365 due-date notifications. Keep deliverables and submitted research in the intern's SharePoint folder.
        </p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-700 underline">
            Open linked Planner task
          </a>
        ) : null}
        {planner?.lastError && !apiConnected ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            Planner API setup is incomplete. The existing SitGuru assignment remains available.
          </p>
        ) : null}
        {!apiConnected ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-black text-[#0F2744]">Set up a task in Planner</p>
              <p className="mt-1">Open your SitGuru Growth team plan in Microsoft Planner, create a task, set a due date, assign its Microsoft 365 members, and enable your notifications in Planner Settings.</p>
              <Link href="https://planner.cloud.microsoft/" target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center font-bold text-blue-700 underline">
                Open Microsoft Planner
              </Link>
            </div>
            <form action={linkManagerPlannerTask} className="space-y-3">
              <input type="hidden" name="assignmentId" value={assignmentId} />
              <label className="block text-sm font-black text-[#0F2744]">
                Link an existing task to this SitGuru assignment
                <input
                  name="plannerTaskUrl"
                  defaultValue={manualLink ? href : ""}
                  type="url"
                  placeholder="https://planner.cloud.microsoft/webui/plan/.../task/..."
                  maxLength={2000}
                  required
                  className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-900"
                />
              </label>
              <button type="submit" name="intent" value="link" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-5 text-sm font-black !text-white">
                {manualLink ? "Update task link" : "Link Planner task"}
              </button>
            </form>
            {manualLink ? (
              <form action={linkManagerPlannerTask}>
                <input type="hidden" name="assignmentId" value={assignmentId} />
                <button name="intent" value="clear" type="submit" className="text-sm font-bold text-rose-700 underline">
                  Remove manual link (does not delete the Planner task)
                </button>
              </form>
            ) : null}
            <p className="text-xs leading-5 text-slate-500">
              Manually linked tasks are marked unverified. Automated Microsoft task creation and assignment require a connected Planner plan, appropriate Graph permissions, and member identities; SharePoint authorization alone does not enable Planner.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            This task is API-linked to SitGuru. Open Planner to edit checklists and Microsoft notification preferences.
          </p>
        )}
      </section>
    </div>
  );
}
