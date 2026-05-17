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
  MessageSquareText,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type WeeklyStatus =
  | "Not Started"
  | "In Progress"
  | "Submitted"
  | "CEO Review"
  | "CEO Confirmed"
  | "Needs Follow-Up"
  | "Blocked";

type WeeklyReview = {
  id: string;
  week_start: string | null;
  week_end: string | null;
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

type ReviewQuestion = {
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

const statusToneMap: Record<WeeklyStatus, StatusTone> = {
  "Not Started": "slate",
  "In Progress": "blue",
  Submitted: "amber",
  "CEO Review": "purple",
  "CEO Confirmed": "emerald",
  "Needs Follow-Up": "rose",
  Blocked: "rose",
};

const reviewQuestions: ReviewQuestion[] = [
  {
    question: "What content got the best reaction this week?",
    purpose: "Helps Danette repeat messages, images, and formats that are working.",
    icon: TrendingUp,
    tone: "emerald",
  },
  {
    question: "Which outreach conversations look warmest?",
    purpose: "Keeps local groomers, trainers, vets, and partners from getting lost.",
    icon: Users,
    tone: "blue",
  },
  {
    question: "What questions or objections did people repeat?",
    purpose: "Turns real feedback into better FAQs, posts, homepage copy, and booking clarity.",
    icon: MessageSquareText,
    tone: "amber",
  },
  {
    question: "What needs Danette next week?",
    purpose: "Keeps the next week focused instead of starting from scratch every Monday.",
    icon: Target,
    tone: "purple",
  },
  {
    question: "What is blocked because the website or workflow still needs development?",
    purpose: "Gives Jason a clear CEO/dev support list before blockers slow marketing down.",
    icon: HelpCircle,
    tone: "rose",
  },
];

function normalizeWeeklyStatus(status: string | null | undefined): WeeklyStatus {
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_weekly_reviews")
    .select(
      "id, week_start, week_end, week_label, theme, status, completion_rate, best_content_reaction, warmest_outreach, repeated_questions, needs_next_week, blocked_by, ceo_notes, submitted_by, confirmed_by, confirmed_at",
    )
    .order("week_start", { ascending: false });

  if (error) {
    console.error("Sales & Marketing Weekly Review fetch error:", error.message);
    return [];
  }

  return (data ?? []) as WeeklyReview[];
}

function buildStatCards(reviews: WeeklyReview[]): StatCard[] {
  const awaitingCeo = reviews.filter((review) => {
    const status = normalizeWeeklyStatus(review.status);
    return status === "Submitted" || status === "CEO Review";
  }).length;

  const blockedItems = reviews.filter((review) => {
    const status = normalizeWeeklyStatus(review.status);
    return status === "Blocked" || status === "Needs Follow-Up" || Boolean(review.blocked_by);
  }).length;

  const warmLeadNotes = reviews.filter((review) =>
    Boolean(review.warmest_outreach && review.warmest_outreach.trim().length > 0),
  ).length;

  return [
    {
      title: "Weekly Reviews",
      value: String(reviews.length),
      description: "Live weekly review rows from Supabase.",
      icon: CalendarCheck,
      tone: "emerald",
    },
    {
      title: "Awaiting CEO",
      value: String(awaitingCeo),
      description: "Reviews submitted by Danette that still need Jason confirmation.",
      icon: ClipboardCheck,
      tone: "purple",
    },
    {
      title: "Blocked Items",
      value: String(blockedItems),
      description: "Website, workflow, creative, or decision blockers that need support.",
      icon: AlertCircle,
      tone: "rose",
    },
    {
      title: "Warm Outreach Notes",
      value: String(warmLeadNotes),
      description: "Weekly reviews that include warm outreach conversations to carry forward.",
      icon: Users,
      tone: "blue",
    },
  ];
}

function StatusBadge({ status }: { status: WeeklyStatus }) {
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

export default async function SalesMarketingWeeklyReviewPage() {
  const weeklyReviews = await getWeeklyReviews();
  const statCards = buildStatCards(weeklyReviews);

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
                <Flag className="h-4 w-4" aria-hidden="true" />
                Weekly Marketing Review
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Friday closeout for wins, blockers, outreach, and next-week focus.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page is now reading live weekly review rows from Supabase.
                Danette can use this as the weekly reporting rhythm, and Jason can
                review what worked, what is blocked, and what needs support.
              </p>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Weekly rhythm
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Review & optimize
                  </h2>
                </div>
                <CardIcon icon={BarChart3} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Every Friday should capture the biggest win, biggest blocker,
                strongest outreach conversations, repeated questions, and what
                Jason needs to help with.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {weeklyReviews.length} weekly review rows loaded
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
                Required Weekly Questions
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                What Danette should answer every Friday
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                These questions keep marketing accountable without making the
                process complicated.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {reviewQuestions.map((item) => (
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
                  CEO Weekly View
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  What Jason should review
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
                      Confirm the week
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Mark the week as CEO Confirmed once the review has enough
                      detail and any proof or links are captured.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      Remove blockers
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Anything blocked by the website, workflow, assets, copy, or
                      a business decision should become a clear Jason action item.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Turn feedback into website improvements
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Repeated questions from Pet Parents, Gurus, and partners
                      should become better copy, FAQs, or Admin follow-up work.
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
                Weekly Review Log
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Live weekly review records
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This is now a read-only live view of the weekly reviews table.
                Once the read views are confirmed, we can add safe update actions
                for Danette submissions and Jason confirmations.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/daily-tracker"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Daily Tracker
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {weeklyReviews.length > 0 ? (
              weeklyReviews.map((review) => {
                const status = normalizeWeeklyStatus(review.status);

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
                          {review.week_label || "Weekly marketing review"}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-emerald-800">
                          {review.theme || "Sales & Marketing"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Week: {formatDate(review.week_start)} – {formatDate(review.week_end)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Best Content Reaction
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.best_content_reaction || "No content reaction entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Warmest Outreach
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.warmest_outreach || "No outreach notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Repeated Questions / Objections
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.repeated_questions || "No repeated questions entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          What Needs Danette Next Week
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {review.needs_next_week || "No next-week needs entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          Blocked By
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {review.blocked_by || "No blockers entered."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          CEO Notes / Action
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {review.ceo_notes || "No CEO notes yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">
                        Future button: Confirm Week
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
                  No weekly reviews found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_weekly_reviews yet.
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
                This page now reads from admin_marketing_weekly_reviews. It does
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