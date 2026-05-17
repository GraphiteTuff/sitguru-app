import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  HelpCircle,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  Target,
  TrendingUp,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type MonthlyStatus =
  | "Not Started"
  | "In Progress"
  | "Submitted"
  | "CEO Review"
  | "CEO Confirmed"
  | "Needs Follow-Up"
  | "Blocked";

type MonthlyReview = {
  id: string;
  month_start: string | null;
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
  confirmed_by: string | null;
  confirmed_at: string | null;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

type MonthlyQuestion = {
  question: string;
  purpose: string;
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

const statusToneMap: Record<MonthlyStatus, StatusTone> = {
  "Not Started": "slate",
  "In Progress": "blue",
  Submitted: "amber",
  "CEO Review": "purple",
  "CEO Confirmed": "emerald",
  "Needs Follow-Up": "rose",
  Blocked: "rose",
};

const monthlyQuestions: MonthlyQuestion[] = [
  {
    question: "Did we complete the month’s main theme?",
    purpose:
      "Confirms whether the month achieved the intended marketing direction instead of just checking off tasks.",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    question: "What worked best?",
    purpose:
      "Helps SitGuru double down on messages, audiences, partners, and content that produced momentum.",
    icon: TrendingUp,
    tone: "blue",
  },
  {
    question: "What did not work?",
    purpose:
      "Identifies low-return tasks so Danette does not waste time repeating weak efforts.",
    icon: AlertCircle,
    tone: "amber",
  },
  {
    question: "What needs Jason or CEO help?",
    purpose:
      "Keeps website, workflow, copy, creative, access, and business-decision blockers visible.",
    icon: HelpCircle,
    tone: "rose",
  },
  {
    question: "What should carry into next month?",
    purpose: "Preserves momentum and makes the next month easier to start.",
    icon: Lightbulb,
    tone: "purple",
  },
];

function normalizeMonthlyStatus(status: string | null | undefined): MonthlyStatus {
  const cleanStatus = (status || "Not Started").trim();

  if (
    cleanStatus === "Not Started" ||
    cleanStatus === "In Progress" ||
    cleanStatus === "Submitted" ||
    cleanStatus === "CEO Review" ||
    cleanStatus === "CEO Confirmed" ||
    cleanStatus === "Needs Follow-Up" ||
    cleanStatus === "Blocked"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Confirmed") return "CEO Confirmed";
  if (cleanStatus === "Needs help") return "Needs Follow-Up";

  return "Not Started";
}

function formatPercent(value: number | null | undefined) {
  const safeValue = Number(value ?? 0);
  return `${safeValue.toFixed(safeValue % 1 === 0 ? 0 : 1)}%`;
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not scheduled";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

async function getMonthlyReviews(): Promise<MonthlyReview[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_monthly_reviews")
    .select(
      "id, month_start, month_label, theme, status, completion_rate, visible_win, what_worked, what_did_not_work, ceo_help_needed, carry_forward, stop_doing, development_notes, submitted_by, confirmed_by, confirmed_at",
    )
    .order("month_start", { ascending: true });

  if (error) {
    console.error("Sales & Marketing Monthly Review fetch error:", error.message);
    return [];
  }

  return (data ?? []) as MonthlyReview[];
}

function buildStatCards(reviews: MonthlyReview[]): StatCard[] {
  const awaitingCeo = reviews.filter((review) => {
    const status = normalizeMonthlyStatus(review.status);
    return status === "Submitted" || status === "CEO Review";
  }).length;

  const blockedThemes = reviews.filter((review) => {
    const status = normalizeMonthlyStatus(review.status);
    return (
      status === "Blocked" ||
      status === "Needs Follow-Up" ||
      Boolean(review.ceo_help_needed) ||
      Boolean(review.development_notes)
    );
  }).length;

  const confirmed = reviews.filter((review) => {
    const status = normalizeMonthlyStatus(review.status);
    return status === "CEO Confirmed" || Boolean(review.confirmed_by);
  }).length;

  const currentMonth =
    reviews.find((review) => normalizeMonthlyStatus(review.status) !== "Not Started")
      ?.month_label || reviews[0]?.month_label || "May";

  return [
    {
      title: "Roadmap Months",
      value: String(reviews.length),
      description: "Live monthly roadmap rows from Supabase.",
      icon: CalendarCheck,
      tone: "emerald",
    },
    {
      title: "Current Month",
      value: currentMonth.replace(" 2026", ""),
      description: "The active or first available monthly marketing roadmap item.",
      icon: Target,
      tone: "blue",
    },
    {
      title: "Needs CEO Review",
      value: String(awaitingCeo),
      description: "Monthly summaries ready for Jason to confirm or return for follow-up.",
      icon: ClipboardCheck,
      tone: "purple",
    },
    {
      title: "Support / Dev Notes",
      value: String(blockedThemes),
      description: "Monthly themes with CEO help or website/workflow notes.",
      icon: AlertCircle,
      tone: "rose",
    },
  ];
}

function StatusBadge({ status }: { status: MonthlyStatus }) {
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

export default async function SalesMarketingMonthlyReviewPage() {
  const monthlyReviews = await getMonthlyReviews();
  const statCards = buildStatCards(monthlyReviews);

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
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Monthly Marketing Review
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Confirm monthly progress against SitGuru’s marketing roadmap.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live monthly roadmap rows from Supabase.
                Jason can review what Danette completed, what worked, what should
                stop, what needs help, and what should carry into the next month.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Current roadmap
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    May–October
                  </h2>
                </div>
                <CardIcon icon={Megaphone} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                The monthly review keeps marketing focused on launch momentum,
                trust, local outreach, proof, optimization, and repeatable systems.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {monthlyReviews.length} monthly review rows loaded
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
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Required Monthly Questions
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                What Jason should confirm each month
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                These questions keep the monthly review tied to business outcomes,
                not just completed tasks.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {monthlyQuestions.map((item) => (
                <div
                  key={item.question}
                  className={`rounded-2xl border p-4 ${toneStyles[item.tone].card}`}
                >
                  <div className="flex items-start gap-3">
                    <CardIcon icon={item.icon} tone={item.tone} />
                    <div>
                      <h3 className="font-extrabold text-slate-950">
                        {item.question}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {item.purpose}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  CEO Monthly View
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  Monthly confirmation workflow
                </h2>
              </div>

              <Link
                href="/admin/sales-marketing/ceo-review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                CEO Review
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-extrabold text-emerald-950">
                      Confirm the month
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Confirm when the month’s theme, visible win, and key
                      marketing responsibilities have been completed or clearly reviewed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      Escalate support needs
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Anything that requires CEO input, website work, assets,
                      approvals, or process changes should become a clear support task.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Improve the next month
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Use monthly reviews to double down on what works, stop
                      weak efforts, and turn feedback into better campaigns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Monthly Review Log
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live monthly roadmap reviews
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is now a read-only live view of the monthly reviews table.
                Once the read views are confirmed, we can add safe update actions
                for Danette submissions and Jason confirmations.
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

          <div className="mt-6 space-y-4">
            {monthlyReviews.length > 0 ? (
              monthlyReviews.map((review) => {
                const status = normalizeMonthlyStatus(review.status);

                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={status} />
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                            Completion: {formatPercent(review.completion_rate)}
                          </span>
                          {review.confirmed_by ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                              Confirmed by {review.confirmed_by}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                          {review.month_label || formatDate(review.month_start)}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-emerald-800">
                          {review.theme || "Sales & Marketing"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 lg:max-w-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Visible Win
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
                          {review.visible_win || "No visible win entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          What Worked
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.what_worked || "No what-worked notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          What Did Not Work
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.what_did_not_work ||
                            "No what-did-not-work notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Help Needed
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {review.ceo_help_needed || "No CEO help noted."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Carry Forward
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {review.carry_forward || "No carry-forward notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Stop Doing
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-950">
                          {review.stop_doing || "No stop-doing notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          Development / Website Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-950">
                          {review.development_notes ||
                            "No development or website notes entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Confirm Month
                      </span>
                      <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800">
                        Future button: Needs Follow-Up
                      </span>
                      <span className="inline-flex rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
                        Future button: Add CEO Note
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-extrabold text-amber-950">
                  No monthly reviews found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_monthly_reviews yet.
                </p>
              </div>
            )}
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
                This page now reads from admin_marketing_monthly_reviews. It does
                not write to Supabase yet and does not affect public pages,
                customer flows, Guru flows, auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}