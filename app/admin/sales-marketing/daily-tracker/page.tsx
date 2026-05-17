import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Flag,
  HelpCircle,
  MessageSquareText,
  Target,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Done"
  | "Deferred"
  | "Waiting"
  | "Blocked"
  | "CEO Review"
  | "CEO Confirmed"
  | "Needs Follow-Up";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type MarketingTask = {
  id: string;
  task_date: string | null;
  day_label: string | null;
  month_theme: string | null;
  primary_task: string | null;
  category: string | null;
  status: string | null;
  owner_name: string | null;
  danette_notes: string | null;
  proof_summary: string | null;
  ceo_review_status: string | null;
  ceo_notes: string | null;
  needs_help: boolean | null;
  help_requested_note: string | null;
  follow_up_date: string | null;
  sort_order: number | null;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

const toneStyles: Record<
  StatusTone,
  {
    card: string;
    icon: string;
    pill: string;
    text: string;
    border: string;
  }
> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    pill: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    pill: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  blue: {
    card: "border-sky-200 bg-sky-50",
    icon: "bg-sky-600 text-white",
    pill: "bg-sky-100 text-sky-800",
    text: "text-sky-800",
    border: "border-sky-200",
  },
  rose: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    pill: "bg-rose-100 text-rose-800",
    text: "text-rose-800",
    border: "border-rose-200",
  },
  slate: {
    card: "border-slate-200 bg-slate-50",
    icon: "bg-slate-700 text-white",
    pill: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  purple: {
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-600 text-white",
    pill: "bg-violet-100 text-violet-800",
    text: "text-violet-800",
    border: "border-violet-200",
  },
};

const statusToneMap: Record<TaskStatus, StatusTone> = {
  Pending: "slate",
  "In Progress": "blue",
  Done: "emerald",
  Deferred: "amber",
  Waiting: "amber",
  Blocked: "rose",
  "CEO Review": "purple",
  "CEO Confirmed": "emerald",
  "Needs Follow-Up": "rose",
};

function normalizeTaskStatus(status: string | null | undefined): TaskStatus {
  const cleanStatus = (status || "Pending").trim();

  if (
    cleanStatus === "Pending" ||
    cleanStatus === "In Progress" ||
    cleanStatus === "Done" ||
    cleanStatus === "Deferred" ||
    cleanStatus === "Waiting" ||
    cleanStatus === "Blocked" ||
    cleanStatus === "CEO Review" ||
    cleanStatus === "CEO Confirmed" ||
    cleanStatus === "Needs Follow-Up"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Awaiting Jason") return "CEO Review";
  if (cleanStatus === "Needs help") return "Needs Follow-Up";

  return "Pending";
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not scheduled";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not scheduled";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getMarketingTasks(): Promise<MarketingTask[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_tasks")
    .select(
      "id, task_date, day_label, month_theme, primary_task, category, status, owner_name, danette_notes, proof_summary, ceo_review_status, ceo_notes, needs_help, help_requested_note, follow_up_date, sort_order",
    )
    .order("task_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Sales & Marketing Daily Tracker fetch error:", error.message);
    return [];
  }

  return (data ?? []) as MarketingTask[];
}

function buildStatCards(tasks: MarketingTask[]): StatCard[] {
  const todayTaskCount = tasks.length;
  const needsCeoReview = tasks.filter((task) => {
    const status = normalizeTaskStatus(task.status);
    return status === "CEO Review" || status === "Done";
  }).length;

  const blockedOrWaiting = tasks.filter((task) => {
    const status = normalizeTaskStatus(task.status);
    return (
      status === "Blocked" ||
      status === "Waiting" ||
      status === "Needs Follow-Up" ||
      task.needs_help === true
    );
  }).length;

  const confirmed = tasks.filter((task) => {
    const status = normalizeTaskStatus(task.status);
    return (
      status === "CEO Confirmed" ||
      task.ceo_review_status === "Confirmed" ||
      task.ceo_review_status === "CEO Confirmed"
    );
  }).length;

  return [
    {
      title: "Marketing Tasks",
      value: String(todayTaskCount),
      description: "Live Supabase count of Sales & Marketing daily task rows.",
      icon: CalendarDays,
      tone: "emerald",
    },
    {
      title: "Needs CEO Review",
      value: String(needsCeoReview),
      description: "Tasks marked Done or CEO Review that need Jason confirmation.",
      icon: ClipboardCheck,
      tone: "purple",
    },
    {
      title: "Blocked / Waiting",
      value: String(blockedOrWaiting),
      description: "Items that may need CEO support, website help, assets, or follow-up.",
      icon: AlertCircle,
      tone: "rose",
    },
    {
      title: "Confirmed",
      value: String(confirmed),
      description: "Tasks marked as reviewed and accepted at the CEO level.",
      icon: CheckCircle2,
      tone: "blue",
    },
  ];
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function CardIcon({
  icon: Icon,
  tone,
}: {
  icon: typeof ClipboardCheck;
  tone: StatusTone;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${toneStyles[tone].icon}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export default async function SalesMarketingDailyTrackerPage() {
  const tasks = await getMarketingTasks();
  const statCards = buildStatCards(tasks);

  const currentMonthTheme =
    tasks.find((task) => task.month_theme)?.month_theme ||
    "Launch readiness + launch momentum";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/sales-marketing"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sales & Marketing
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Daily Marketing Tracker
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Track Danette’s daily marketing work and CEO confirmation.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live task rows from Supabase. Danette’s
                daily marketing work, CEO review status, proof notes, blockers,
                and follow-up needs can be tracked here.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Current focus
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    {currentMonthTheme}
                  </h2>
                </div>
                <CardIcon icon={Target} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Launch readiness, launch messaging, first outreach, first proof,
                and early momentum before SitGuru’s full public push.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {tasks.length} task rows loaded
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${toneStyles[card.tone].card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <CardIcon icon={card.icon} tone={card.tone} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Today’s CEO View
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  What Jason should check first
                </h2>
              </div>
              <Link
                href="/admin/sales-marketing/ceo-review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open CEO Review
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 h-5 w-5 text-amber-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-amber-950">Review ready items</h3>
                    <p className="mt-1 text-sm leading-6 text-amber-900">
                      Check tasks marked as CEO Review or Done. Confirm them, ask for
                      proof, or flag follow-up.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-rose-950">Remove blockers</h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Blocked or Waiting items may need website support, final copy,
                      creative assets, access, or a CEO decision.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-bold text-emerald-950">Confirm completed work</h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Keep Done separate from CEO Confirmed so completed work is visible
                      before it is officially closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Status Workflow
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Recommended daily flow
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Pending",
                "In Progress",
                "Done",
                "CEO Review",
                "CEO Confirmed",
                "Needs Follow-Up",
                "Blocked",
              ].map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="font-semibold text-slate-800">{status}</span>
                  <StatusBadge status={status as TaskStatus} />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Daily Tracker
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live Supabase task rows
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is now a read-only live view of the Admin marketing task table.
                Next step will be adding safe Admin actions so statuses and CEO
                confirmations can be updated from the page.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/weekly-review"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Weekly Review
              <Flag className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[0.85fr_1.3fr_1fr_0.8fr_1fr] gap-4 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 lg:grid">
              <span>Date</span>
              <span>Primary Task</span>
              <span>Status / Category</span>
              <span>Proof</span>
              <span>CEO Notes</span>
            </div>

            {tasks.length > 0 ? (
              tasks.map((task) => {
                const status = normalizeTaskStatus(task.status);
                const displayStatus = task.needs_help ? "Needs Follow-Up" : status;

                return (
                  <article
                    key={task.id}
                    className="border-t border-slate-200 p-4 first:border-t-0 lg:grid lg:grid-cols-[0.85fr_1.3fr_1fr_0.8fr_1fr] lg:gap-4"
                  >
                    <div>
                      <p className="font-extrabold text-slate-950">
                        {formatDate(task.task_date)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-800">
                        {task.day_label || "Marketing Day"}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {task.month_theme || "Sales & Marketing"}
                      </p>
                      {task.follow_up_date ? (
                        <p className="mt-2 text-xs font-bold text-amber-700">
                          Follow-up: {formatShortDate(task.follow_up_date)}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 lg:mt-0">
                      <p className="font-bold leading-6 text-slate-950">
                        {task.primary_task || "Untitled marketing task"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {task.danette_notes || "No Danette notes yet."}
                      </p>
                      {task.needs_help && task.help_requested_note ? (
                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                            Help Requested
                          </p>
                          <p className="mt-1 text-sm leading-6 text-rose-950">
                            {task.help_requested_note}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 lg:mt-0">
                      <StatusBadge status={displayStatus} />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {task.category || "General"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        CEO review: {task.ceo_review_status || "Not Reviewed"}
                      </p>
                    </div>

                    <div className="mt-4 lg:mt-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        {task.proof_summary || "No proof yet"}
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-0">
                      <p className="text-sm leading-6 text-slate-600">
                        {task.ceo_notes || "No CEO notes yet."}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="p-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-extrabold text-amber-950">
                    No marketing tasks found.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    The page is connected to Supabase, but there are no rows in
                    admin_marketing_tasks yet. Add starter rows or rerun the seed
                    section of the SQL script.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Supabase Wiring Note
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Daily Tracker is now reading from admin_marketing_tasks.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page uses server-side Admin Supabase access for a read-only
                task view. It does not change public pages, customer flows, Guru
                flows, auth, bookings, payments, or financial logic.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-emerald-950">
                  Supabase connected
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-sky-950">
                  Read-only task view
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-slate-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-950">
                  Admin route only
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}