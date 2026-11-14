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
const SHORT_DAYS: Record<number, string> = { 7: "7 days", 3: "3 days", 1: "1 day", 0: "due date" };

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
  const recipientSummary = [
    reminders.notifyIntern ? "intern" : "",
    reminders.notifyManager ? "manager" : "",
  ].filter(Boolean).join(" and ") || "no recipients";

  return (
    <div id="planner-reminders" className="grid scroll-mt-24 gap-4 lg:grid-cols-2">
      <section className={`${DESK_UI.card} p-5 sm:p-6`}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700">1</span>
          <h2 className="text-xl font-black text-[#0F2744]">Remind the team</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Turn on deadline reminders once. SitGuru will notify the intern and manager automatically. No Microsoft setup is needed.
        </p>
        <form action={saveManagerAssignmentReminders} className="mt-4 space-y-4">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-black text-[#0F2744]">
            <input name="reminderEnabled" type="checkbox" defaultChecked={reminders.enabled} className="h-5 w-5 accent-blue-700" />
            Enable reminders for this assignment
          </label>
          <p className="text-sm font-medium text-slate-600">
            {reminders.enabled ? "Currently on" : "Currently off"} ·{" "}
            {reminders.daysBefore.map((day) => SHORT_DAYS[day]).join(", ") || "choose a reminder day"} ·{" "}
            Notify {recipientSummary}.
          </p>
          <details className="group rounded-xl border border-slate-200 px-3 py-3">
            <summary className="cursor-pointer text-sm font-bold text-blue-700">
              Customize reminder dates or recipients (optional)
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              <fieldset>
                <legend className="text-sm font-black text-[#0F2744]">When to remind</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {REMINDER_DAY_OPTIONS.map((day) => (
                    <label key={day} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      <input name="daysBefore" value={day} type="checkbox" defaultChecked={reminders.daysBefore.includes(day)} className="h-4 w-4 accent-blue-700" />
                      {REMINDER_LABELS[day]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-black text-[#0F2744]">Who to remind</legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                    <input name="notifyIntern" type="checkbox" defaultChecked={reminders.notifyIntern} className="h-4 w-4 accent-blue-700" />
                    Assigned intern
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                    <input name="notifyManager" type="checkbox" defaultChecked={reminders.notifyManager} className="h-4 w-4 accent-blue-700" />
                    Their manager
                  </label>
                </div>
              </fieldset>
            </div>
          </details>
          <p className="text-xs font-medium text-slate-500">
            {dueOn ? `Due ${dueOn}.` : "Please set a due date first."} Reminders arrive in SitGuru; submitted assignments are excluded.
          </p>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-700 px-5 text-sm font-black !text-white hover:bg-blue-800">
            Save reminder settings
          </button>
        </form>
      </section>

      <section className={`${DESK_UI.card} p-5 sm:p-6`}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">2</span>
          <h2 className="text-xl font-black text-[#0F2744]">Planner (optional)</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ava can track a task in Microsoft Planner if helpful. Interns can complete everything inside SitGuru — they don't need a separate Planner account.
        </p>
        <p className="mt-3 text-sm font-bold text-slate-700">
          {apiConnected ? "Microsoft task connected" : manualLink ? "Planner task linked (not verified)" : "No Planner task linked yet"}
        </p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-10 items-center text-sm font-black text-blue-700 underline">
            Open the Planner task
          </a>
        ) : null}
        {!apiConnected ? (
          <details className="mt-4 rounded-xl border border-slate-200 px-3 py-3">
            <summary className="cursor-pointer text-sm font-bold text-blue-700">
              {manualLink ? "Update or remove the Planner link" : "Link a Planner task (optional)"}
            </summary>
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <p className="text-sm leading-6 text-slate-600">
                Open Planner, create a task in the shared SitGuru team plan, set its due date, then copy the task link here.
              </p>
              <Link href="https://planner.cloud.microsoft/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-sm font-bold text-blue-700 underline">
                Open Microsoft Planner
              </Link>
              <form action={linkManagerPlannerTask} className="space-y-3">
                <input type="hidden" name="assignmentId" value={assignmentId} />
                <label className="block text-sm font-black text-[#0F2744]">
                  Planner task link
                  <input
                    name="plannerTaskUrl"
                    defaultValue={manualLink ? href : ""}
                    type="url"
                    placeholder="https://planner.cloud.microsoft/..."
                    maxLength={2000}
                    required
                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-900"
                  />
                </label>
                <button type="submit" name="intent" value="link" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-5 text-sm font-black !text-white">
                  Save Planner link
                </button>
              </form>
              {manualLink ? (
                <form action={linkManagerPlannerTask}>
                  <input type="hidden" name="assignmentId" value={assignmentId} />
                  <button name="intent" value="clear" type="submit" className="min-h-10 text-sm font-bold text-rose-700 underline">
                    Remove task link
                  </button>
                </form>
              ) : null}
              <p className="text-xs leading-5 text-slate-500">
                This links the task only. Automatic Planner creation needs a connected plan and Microsoft permissions.
              </p>
            </div>
          </details>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Open the task in Planner to change its checklist, due date, and Microsoft notifications.
          </p>
        )}
      </section>
    </div>
  );
}
