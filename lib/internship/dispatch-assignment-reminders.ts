/**
 * Daily, opt-in SitGuru assignment deadline reminders.
 *
 * Delivery is in-app only. Microsoft Planner task emails/pushes are controlled
 * independently by the assigned Microsoft 365 user's Planner settings.
 * The stable event ID + recipient uniqueness prevents duplicate delivery on
 * repeated cron runs (the live signal insert is the deduplication ledger).
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseAssignmentReminderSettings, reminderForDate, reminderMessage } from "@/lib/internship/assignment-reminder-rules";
import { stableEventId, uniqueUserIds } from "@/lib/realtime/pure";

const DAY_MS = 86_400_000;

function dateAtOffset(today: string, days: number) {
  return new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export async function dispatchInternshipAssignmentReminders(input?: {
  today?: string;
  maxAssignments?: number;
}) {
  const today = input?.today || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("Invalid reminder date.");
  const upper = dateAtOffset(today, 7);
  const limit = Math.min(Math.max(input?.maxAssignments || 250, 1), 1000);
  const { data: tasks, error } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,status,brief_payload")
    .in("status", ["todo", "in_progress", "revision_requested"])
    .gte("due_on", today)
    .lte("due_on", upper)
    .order("due_on", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Could not load intern assignment deadlines.");

  const scheduled = (tasks || []).flatMap((task) => {
    const settings = parseAssignmentReminderSettings(task.brief_payload);
    const daysBefore = reminderForDate({
      dueOn: String(task.due_on || ""),
      today,
      status: String(task.status || ""),
      settings,
    });
    return daysBefore === null ? [] : [{ task, settings, daysBefore }];
  });
  if (!scheduled.length) return { scanned: (tasks || []).length, scheduled: 0, delivered: 0, skipped: 0 };

  const internIds = [...new Set(scheduled.map((item) => String(item.task.intern_id)).filter(Boolean))];
  const { data: people, error: peopleError } = await supabaseAdmin.from("internship_interns")
    .select("id,user_id,manager_user_id")
    .in("id", internIds);
  if (peopleError) throw new Error("Could not resolve assignment reminder recipients.");
  const persons = new Map((people || []).map((row) => [String(row.id), row]));
  let delivered = 0;
  let skipped = 0;

  for (const { task, settings, daysBefore } of scheduled) {
    const intern = persons.get(String(task.intern_id));
    if (!intern) { skipped += 1; continue; }
    const recipients = uniqueUserIds([
      settings.notifyIntern ? intern.user_id : null,
      settings.notifyManager ? intern.manager_user_id : null,
    ]);
    if (!recipients.length) { skipped += 1; continue; }

    const eventId = stableEventId([
      "intern.assignment.deadline.reminder",
      String(task.id),
      String(task.due_on),
      String(daysBefore),
    ]);
    const signalRows = recipients.map((recipientUserId) => ({
      event_id: eventId,
      recipient_user_id: recipientUserId,
      event_type: "intern.assignment.deadline.reminder",
      resource_type: "internship_tasks",
      resource_id: String(task.id),
      scope: "intern",
      paths: ["/intern/assignments", "/manager/assignments"],
      actor_user_id: null,
      actor_label: "SitGuru internship reminders",
      resource_version: String(task.due_on || ""),
    }));
    // Only newly inserted signals may generate notifications.
    const { data: inserted, error: signalError } = await supabaseAdmin
      .from("sitguru_live_signals")
      .upsert(signalRows, { onConflict: "event_id,recipient_user_id", ignoreDuplicates: true })
      .select("recipient_user_id");
    if (signalError) {
      console.warn("[intern-reminders] Could not reserve delivery for an assignment.", signalError.message);
      skipped += 1;
      continue;
    }
    const newRecipients = uniqueUserIds((inserted || []).map((row) => row.recipient_user_id));
    if (!newRecipients.length) { skipped += 1; continue; }
    const href = `/intern/assignments/${encodeURIComponent(String(task.id))}`;
    const title = `Assignment ${reminderMessage(daysBefore)}: ${String(task.title || "Intern task").slice(0, 130)}`;
    const message = daysBefore === 0
      ? "This assignment is due today. Open SitGuru to finish or review it."
      : "Open SitGuru to review progress and finish the assignment before the due date.";
    const { error: notificationError } = await supabaseAdmin.from("notifications").insert(
      newRecipients.map((userId) => ({
        user_id: userId,
        title,
        body: message,
        type: "workspace:intern.assignment.deadline.reminder",
        href: userId === intern.manager_user_id
          ? `/manager/assignments/${encodeURIComponent(String(task.id))}` : href,
        link: userId === intern.manager_user_id
          ? `/manager/assignments/${encodeURIComponent(String(task.id))}` : href,
        is_read: false,
        created_at: new Date().toISOString(),
      })),
    );
    if (notificationError) {
      // No misleading success: the signal is reserved but the notification
      // insert needs an operator review. Never broadcast to other accounts.
      console.warn("[intern-reminders] Notification delivery failed.", notificationError.message);
      skipped += 1;
    } else {
      delivered += newRecipients.length;
    }
  }
  return { scanned: (tasks || []).length, scheduled: scheduled.length, delivered, skipped };
}
