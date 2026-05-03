"use client";

import { useEffect, useMemo, useState } from "react";

export type ManagementAlert = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  dueLabel: string;
  href: string;
};

type ReminderResult = {
  channel: "email" | "sms";
  status: "sent" | "skipped" | "failed";
  detail: string;
};

type ReminderResponse = {
  ok: boolean;
  message?: string;
  results?: ReminderResult[];
};

function severityClasses(severity: ManagementAlert["severity"]) {
  const styles = {
    critical: {
      pill: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
      card: "border-rose-200 bg-rose-50",
      button: "bg-rose-700 text-white hover:bg-rose-800",
    },
    warning: {
      pill: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      card: "border-amber-200 bg-amber-50",
      button: "bg-amber-600 text-white hover:bg-amber-700",
    },
    info: {
      pill: "border-blue-200 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
      card: "border-blue-200 bg-blue-50",
      button: "bg-emerald-700 text-white hover:bg-emerald-800",
    },
  };

  return styles[severity];
}

function getReminderSummary(results?: ReminderResult[]) {
  if (!results || results.length === 0) {
    return "No reminder delivery results yet.";
  }

  return results
    .map((result) => {
      const channelLabel = result.channel === "sms" ? "Text" : "Email";
      return `${channelLabel}: ${result.status} — ${result.detail}`;
    })
    .join("\n");
}

export default function ManagementAlerts({
  alerts,
}: {
  alerts: ManagementAlert[];
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [lastReminderResponse, setLastReminderResponse] =
    useState<ReminderResponse | null>(null);

  const priorityAlert = useMemo(() => {
    return (
      alerts.find((alert) => alert.severity === "critical") ||
      alerts.find((alert) => alert.severity === "warning") ||
      alerts[0]
    );
  }, [alerts]);

  useEffect(() => {
    if (!priorityAlert) return;

    const today = new Date().toISOString().slice(0, 10);
    const snoozeKey = `sitguru-cpa-alert-snoozed-${priorityAlert.id}-${today}`;

    if (window.localStorage.getItem(snoozeKey) !== "true") {
      setShowPopup(true);
    }
  }, [priorityAlert]);

  function snoozeToday() {
    if (!priorityAlert) return;

    const today = new Date().toISOString().slice(0, 10);
    const snoozeKey = `sitguru-cpa-alert-snoozed-${priorityAlert.id}-${today}`;

    window.localStorage.setItem(snoozeKey, "true");
    setShowPopup(false);
  }

  async function sendManagementReminder(alert: ManagementAlert) {
    setSendingAlertId(alert.id);
    setLastReminderResponse(null);

    try {
      const response = await fetch("/api/admin/financials/cpa-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          dueLabel: alert.dueLabel,
        }),
      });

      const json = (await response.json()) as ReminderResponse;

      setLastReminderResponse(json);
    } catch (error) {
      setLastReminderResponse({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to send management reminder.",
      });
    } finally {
      setSendingAlertId(null);
    }
  }

  if (!priorityAlert) return null;

  const popupStyles = severityClasses(priorityAlert.severity);

  return (
    <>
      {showPopup ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-xl rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-2xl sm:right-6 sm:left-auto sm:mx-0">
          <div className="flex gap-4">
            <span
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${popupStyles.dot}`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${popupStyles.pill}`}
                >
                  Management Alert
                </span>
                <span className="text-xs font-black text-slate-500">
                  {priorityAlert.dueLabel}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-950">
                {priorityAlert.title}
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {priorityAlert.description}
              </p>

              {lastReminderResponse ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                  {lastReminderResponse.ok
                    ? getReminderSummary(lastReminderResponse.results)
                    : lastReminderResponse.message ||
                      "Reminder could not be sent."}
                </pre>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={priorityAlert.href}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${popupStyles.button}`}
                >
                  View tracker
                </a>

                <button
                  type="button"
                  onClick={() => sendManagementReminder(priorityAlert)}
                  disabled={sendingAlertId === priorityAlert.id}
                  className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingAlertId === priorityAlert.id
                    ? "Sending..."
                    : "Email/Text Admin"}
                </button>

                <button
                  type="button"
                  onClick={snoozeToday}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Snooze today
                </button>

                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section
        id="management-alerts"
        className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Management Alerts
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              CPA Handoff Reminders
            </h2>
            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              These alerts help management stay ahead of monthly close,
              quarterly CPA review, annual tax package preparation, and export
              deadlines. Admins can receive the same alert by popup, email, and
              text message.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              className="w-fit rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              Show alert popup
            </button>

            <button
              type="button"
              onClick={() => sendManagementReminder(priorityAlert)}
              disabled={sendingAlertId === priorityAlert.id}
              className="w-fit rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingAlertId === priorityAlert.id
                ? "Sending reminder..."
                : "Email/Text Admin"}
            </button>
          </div>
        </div>

        {lastReminderResponse ? (
          <div
            className={`mt-5 rounded-[1.25rem] border p-4 ${
              lastReminderResponse.ok
                ? "border-emerald-100 bg-emerald-50"
                : "border-rose-100 bg-rose-50"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.18em] ${
                lastReminderResponse.ok ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              Reminder Status
            </p>
            <pre className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">
              {lastReminderResponse.ok
                ? getReminderSummary(lastReminderResponse.results)
                : lastReminderResponse.message || "Reminder could not be sent."}
            </pre>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {alerts.map((alert) => {
            const styles = severityClasses(alert.severity);

            return (
              <div
                key={alert.id}
                className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-1 hover:shadow-lg ${styles.card}`}
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${styles.pill}`}
                    >
                      {alert.severity}
                    </span>

                    <h3 className="mt-4 text-xl font-black text-slate-950">
                      {alert.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {alert.description}
                    </p>

                    <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      {alert.dueLabel}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-white/70 pt-4">
                    <a
                      href={alert.href}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${styles.button}`}
                    >
                      View tracker
                    </a>

                    <button
                      type="button"
                      onClick={() => sendManagementReminder(alert)}
                      disabled={sendingAlertId === alert.id}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingAlertId === alert.id
                        ? "Sending..."
                        : "Email/Text Admin"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Setup Needed
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Connect email and text providers
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            The reminder buttons are now wired to an API route. To send real
            messages, add the email and SMS environment variables for management
            recipients and providers.
          </p>
        </div>
      </section>
    </>
  );
}