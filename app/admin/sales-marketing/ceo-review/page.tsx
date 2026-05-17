import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flag,
  HelpCircle,
  MessageSquareText,
  Target,
  TrendingUp,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type ReviewStatus =
  | "Not Reviewed"
  | "CEO Review"
  | "Confirmed"
  | "Needs Follow-Up"
  | "Blocked"
  | "Waiting"
  | "Done"
  | "Submitted"
  | "In Progress"
  | "CEO Confirmed";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type ReviewItemType = "Daily" | "Weekly" | "Monthly" | "Support";

type ReviewItem = {
  id: string;
  title: string;
  type: ReviewItemType;
  owner: string;
  status: ReviewStatus;
  due: string;
  completedWork: string;
  proof: string;
  danetteNotes: string;
  ceoAction: string;
};

type MarketingTaskRow = {
  id: string;
  task_date: string | null;
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

type WeeklyReviewRow = {
  id: string;
  week_label: string | null;
  theme: string | null;
  status: string | null;
  completion_rate: number | null;
  best_content_reaction: string | null;
  warmest_outreach: string | null;
  repeated_questions: string | null;
  needs_next_week: string | null;
  blocked_by: string | null;
  ceo_notes: string | null;
  submitted_by: string | null;
  week_end: string | null;
};

type MonthlyReviewRow = {
  id: string;
  month_label: string | null;
  theme: string | null;
  status: string | null;
  completion_rate: number | null;
  visible_win: string | null;
  what_worked: string | null;
  what_did_not_work: string | null;
  ceo_help_needed: string | null;
  carry_forward: string | null;
  stop_doing: string | null;
  development_notes: string | null;
  submitted_by: string | null;
  month_start: string | null;
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

const statusToneMap: Record<ReviewStatus, StatusTone> = {
  "Not Reviewed": "slate",
  "CEO Review": "purple",
  Confirmed: "emerald",
  "Needs Follow-Up": "rose",
  Blocked: "rose",
  Waiting: "amber",
  Done: "emerald",
  Submitted: "amber",
  "In Progress": "blue",
  "CEO Confirmed": "emerald",
};

function normalizeReviewStatus(
  status: string | null | undefined,
  needsHelp?: boolean | null,
): ReviewStatus {
  if (needsHelp) return "Needs Follow-Up";

  const cleanStatus = (status || "Not Reviewed").trim();

  if (
    cleanStatus === "Not Reviewed" ||
    cleanStatus === "CEO Review" ||
    cleanStatus === "Confirmed" ||
    cleanStatus === "Needs Follow-Up" ||
    cleanStatus === "Blocked" ||
    cleanStatus === "Waiting" ||
    cleanStatus === "Done" ||
    cleanStatus === "Submitted" ||
    cleanStatus === "In Progress" ||
    cleanStatus === "CEO Confirmed"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Awaiting Jason") return "CEO Review";
  if (cleanStatus === "Needs help") return "Needs Follow-Up";

  return "Not Reviewed";
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not scheduled";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getMarketingTasksForReview(): Promise<MarketingTaskRow[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_tasks")
    .select(
      "id, task_date, primary_task, category, status, owner_name, danette_notes, proof_summary, ceo_review_status, ceo_notes, needs_help, help_requested_note, follow_up_date, sort_order",
    )
    .or(
      "status.in.(CEO Review,Blocked,Waiting,Done,Needs Follow-Up),needs_help.eq.true,ceo_review_status.in.(Awaiting Jason,Needs help,Needs Follow-Up,CEO Review)",
    )
    .order("task_date", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Sales & Marketing CEO Review tasks fetch error:", error.message);
    return [];
  }

  return (data ?? []) as MarketingTaskRow[];
}

async function getWeeklyReviewsForReview(): Promise<WeeklyReviewRow[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_weekly_reviews")
    .select(
      "id, week_label, theme, status, completion_rate, best_content_reaction, warmest_outreach, repeated_questions, needs_next_week, blocked_by, ceo_notes, submitted_by, week_end",
    )
    .order("week_start", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Sales & Marketing CEO Review weekly fetch error:", error.message);
    return [];
  }

  return (data ?? []) as WeeklyReviewRow[];
}

async function getMonthlyReviewsForReview(): Promise<MonthlyReviewRow[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_monthly_reviews")
    .select(
      "id, month_label, theme, status, completion_rate, visible_win, what_worked, what_did_not_work, ceo_help_needed, carry_forward, stop_doing, development_notes, submitted_by, month_start",
    )
    .order("month_start", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Sales & Marketing CEO Review monthly fetch error:", error.message);
    return [];
  }

  return (data ?? []) as MonthlyReviewRow[];
}

function buildDailyReviewItems(tasks: MarketingTaskRow[]): ReviewItem[] {
  return tasks.map((task) => {
    const status = normalizeReviewStatus(
      task.needs_help ? "Needs Follow-Up" : task.status || task.ceo_review_status,
      task.needs_help,
    );

    const type: ReviewItemType =
      task.needs_help || status === "Blocked" || status === "Needs Follow-Up"
        ? "Support"
        : "Daily";

    return {
      id: task.id,
      title: task.primary_task || "Untitled marketing task",
      type,
      owner: task.owner_name || "Danette",
      status,
      due: formatDate(task.follow_up_date || task.task_date),
      completedWork:
        task.category || task.primary_task || "Daily Sales & Marketing task.",
      proof: task.proof_summary || "No proof summary yet.",
      danetteNotes: task.danette_notes || "No Danette notes yet.",
      ceoAction:
        task.help_requested_note ||
        task.ceo_notes ||
        "Review task status, proof, notes, and decide whether to confirm or request follow-up.",
    };
  });
}

function buildWeeklyReviewItems(weeklyReviews: WeeklyReviewRow[]): ReviewItem[] {
  return weeklyReviews.map((review) => {
    const status = normalizeReviewStatus(review.status);

    return {
      id: review.id,
      title: review.week_label || "Weekly marketing review",
      type: "Weekly",
      owner: review.submitted_by || "Danette",
      status,
      due: formatDate(review.week_end),
      completedWork:
        review.theme ||
        `Weekly completion rate: ${review.completion_rate ?? 0}%`,
      proof:
        review.best_content_reaction ||
        review.warmest_outreach ||
        "Weekly review details are ready to review.",
      danetteNotes:
        review.repeated_questions ||
        review.needs_next_week ||
        "No weekly notes entered yet.",
      ceoAction:
        review.ceo_notes ||
        review.blocked_by ||
        "Confirm the week, identify blockers, and decide what carries into next week.",
    };
  });
}

function buildMonthlyReviewItems(monthlyReviews: MonthlyReviewRow[]): ReviewItem[] {
  return monthlyReviews.map((review) => {
    const status = normalizeReviewStatus(review.status);

    return {
      id: review.id,
      title: review.month_label || "Monthly marketing review",
      type: "Monthly",
      owner: review.submitted_by || "Danette",
      status,
      due: formatDate(review.month_start),
      completedWork:
        review.theme ||
        `Monthly completion rate: ${review.completion_rate ?? 0}%`,
      proof:
        review.visible_win ||
        review.what_worked ||
        "Monthly review details are ready to review.",
      danetteNotes:
        review.what_did_not_work ||
        review.carry_forward ||
        "No monthly notes entered yet.",
      ceoAction:
        review.ceo_help_needed ||
        review.development_notes ||
        "Confirm the month, identify support needs, and decide what carries into the next month.",
    };
  });
}

function buildStatCards(reviewItems: ReviewItem[]): StatCard[] {
  const awaitingReview = reviewItems.filter((item) =>
    ["CEO Review", "Done", "Submitted"].includes(item.status),
  ).length;

  const needsHelp = reviewItems.filter((item) =>
    ["Needs Follow-Up", "Blocked", "Waiting"].includes(item.status),
  ).length;

  const confirmed = reviewItems.filter((item) =>
    ["Confirmed", "CEO Confirmed"].includes(item.status),
  ).length;

  const weeklyItems = reviewItems.filter((item) => item.type === "Weekly").length;

  return [
    {
      title: "Awaiting CEO Review",
      value: String(awaitingReview),
      description: "Live tasks or reviews that need Jason to confirm, ask questions, or flag follow-up.",
      icon: ClipboardCheck,
      tone: "purple",
    },
    {
      title: "Needs Help",
      value: String(needsHelp),
      description: "Marketing items blocked by website, workflow, creative assets, or CEO decisions.",
      icon: HelpCircle,
      tone: "rose",
    },
    {
      title: "Confirmed Items",
      value: String(confirmed),
      description: "Items already marked confirmed at the CEO level.",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      title: "Weekly Reviews",
      value: String(weeklyItems),
      description: "Weekly reviews included in this CEO view.",
      icon: CalendarCheck,
      tone: "blue",
    },
  ];
}

const ceoChecklist = [
  {
    title: "Confirm completed work",
    description:
      "Look for proof, notes, screenshots, drafts, links, or outreach details before marking work confirmed.",
    icon: CheckCircle2,
    tone: "emerald" as const,
  },
  {
    title: "Remove blockers",
    description:
      "If Danette is waiting on website changes, copy approval, creative assets, or a decision, assign the next action.",
    icon: HelpCircle,
    tone: "rose" as const,
  },
  {
    title: "Protect the weekly rhythm",
    description:
      "Use Friday reviews to decide what worked, what did not, what repeats, and what moves into next week.",
    icon: TrendingUp,
    tone: "blue" as const,
  },
];

function StatusBadge({ status }: { status: ReviewStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: ReviewItemType }) {
  const tone: StatusTone =
    type === "Daily"
      ? "blue"
      : type === "Weekly"
        ? "purple"
        : type === "Monthly"
          ? "emerald"
          : "rose";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {type}
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

export default async function SalesMarketingCeoReviewPage() {
  const [tasks, weeklyReviews, monthlyReviews] = await Promise.all([
    getMarketingTasksForReview(),
    getWeeklyReviewsForReview(),
    getMonthlyReviewsForReview(),
  ]);

  const reviewItems = [
    ...buildDailyReviewItems(tasks),
    ...buildWeeklyReviewItems(weeklyReviews),
    ...buildMonthlyReviewItems(monthlyReviews),
  ];

  const statCards = buildStatCards(reviewItems);

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
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                CEO Review & Confirmation
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Confirm Danette’s marketing work and help remove blockers.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live Supabase data from daily tasks,
                weekly reviews, and monthly reviews. Jason can see what is waiting,
                blocked, submitted, or ready for confirmation.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    CEO question
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    What needs Jason?
                  </h2>
                </div>
                <CardIcon icon={Target} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Review completed work, proof, blockers, weekly summaries, monthly
                progress, and anything that needs CEO support.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {reviewItems.length} review items loaded
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

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                CEO Checklist
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Review process
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Keep the review simple. Confirm work when there is proof, flag
                follow-up when something needs correction, and remove blockers quickly.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {ceoChecklist.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 ${toneStyles[item.tone].card}`}
                >
                  <div className="flex items-start gap-3">
                    <CardIcon icon={item.icon} tone={item.tone} />
                    <div>
                      <h3 className="font-extrabold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 text-amber-700" aria-hidden="true" />
                <div>
                  <h3 className="font-extrabold text-amber-950">
                    Read-only for this step
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    This page is wired to Supabase for live reads only. Update
                    buttons will come after we confirm the read views are working cleanly.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Review Queue
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  Live items waiting for CEO action
                </h2>
              </div>

              <Link
                href="/admin/sales-marketing/daily-tracker"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Daily Tracker
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {reviewItems.length > 0 ? (
                reviewItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <TypeBadge type={item.type} />
                          <StatusBadge status={item.status} />
                        </div>

                        <h3 className="mt-3 text-lg font-extrabold text-slate-950">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Owner: {item.owner} · Due: {item.due}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Completed / Proposed Work
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {item.completedWork}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Proof
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {item.proof}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Danette Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {item.danetteNotes}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          CEO Action
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {item.ceoAction}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Confirm
                      </span>
                      <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800">
                        Future button: Needs Follow-Up
                      </span>
                      <span className="inline-flex rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
                        Future button: Add CEO Note
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <h3 className="font-extrabold text-emerald-950">
                    No review items found.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    When tasks are marked CEO Review, Done, Blocked, Waiting, or
                    Needs Follow-Up, they will appear here.
                  </p>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Review Levels
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Daily, weekly, and monthly visibility
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The CEO view now combines daily task items with weekly and monthly
                review records from Supabase.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/admin/sales-marketing/daily-tracker"
                className="rounded-2xl border border-sky-200 bg-sky-50 p-4 transition hover:bg-sky-100"
              >
                <Clock3 className="h-5 w-5 text-sky-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold text-sky-950">
                  Daily Review
                </p>
                <p className="mt-1 text-xs leading-5 text-sky-900">
                  Check task status and today’s blockers.
                </p>
              </Link>

              <Link
                href="/admin/sales-marketing/weekly-review"
                className="rounded-2xl border border-violet-200 bg-violet-50 p-4 transition hover:bg-violet-100"
              >
                <Flag className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold text-violet-950">
                  Weekly Review
                </p>
                <p className="mt-1 text-xs leading-5 text-violet-900">
                  Confirm wins, blockers, and next week.
                </p>
              </Link>

              <Link
                href="/admin/sales-marketing/monthly-review"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100"
              >
                <CalendarCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold text-emerald-950">
                  Monthly Review
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-900">
                  Confirm progress against the roadmap.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Supabase Wiring Note
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page now reads from admin_marketing_tasks,
                admin_marketing_weekly_reviews, and admin_marketing_monthly_reviews.
                It does not write to Supabase yet and does not affect public pages,
                customer flows, Guru flows, auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}