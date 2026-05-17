import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flag,
  Handshake,
  HeartHandshake,
  Megaphone,
  MessageSquareText,
  PlusCircle,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type DashboardCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

type ReviewItem = {
  title: string;
  owner: string;
  status: string;
  due: string;
  tone: StatusTone;
};

type RoadmapMonth = {
  month: string;
  theme: string;
  focus: string;
  visibleWin: string;
  active?: boolean;
};

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: typeof ClipboardCheck;
  featured?: boolean;
};

type MarketingTaskRow = {
  primary_task: string;
  owner_name: string | null;
  status: string | null;
  task_date: string | null;
  needs_help: boolean | null;
  ceo_review_status: string | null;
};

type MarketingCounts = {
  totalTasks: number;
  awaitingCeoReview: number;
  blockedOrHelp: number;
  weeklyReviews: number;
  monthlyReviews: number;
  outreachContacts: number;
  contentItems: number;
  proofItems: number;
  campaigns: number;
  signupLeads: number;
  referrals: number;
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

const roadmap: RoadmapMonth[] = [
  {
    month: "May",
    theme: "Launch readiness + launch momentum",
    focus:
      "Launch messaging, social setup, first outreach, first assets, launch announcement, and first proof.",
    visibleWin: "The brand feels real on day one.",
    active: true,
  },
  {
    month: "June",
    theme: "Trust-building consistency",
    focus:
      "Guru spotlights, FAQs, how-it-works content, fast replies, and a visual proof library.",
    visibleWin: "SitGuru looks active and trustworthy.",
  },
  {
    month: "July",
    theme: "Local outreach + referrals",
    focus:
      "Partner asks, flyers/cards, local groups, community posts, and referral prompts.",
    visibleWin: "Local awareness begins to compound.",
  },
  {
    month: "August",
    theme: "Reviews + repeat booking",
    focus:
      "Collect proof, ask for testimonials, highlight happy outcomes, and prompt repeat bookings.",
    visibleWin: "Proof-driven marketing becomes easier.",
  },
  {
    month: "September",
    theme: "Optimization + partnerships",
    focus:
      "Double down on what performs, refine weak spots, and deepen warm partnerships.",
    visibleWin: "Time shifts toward highest-return work.",
  },
  {
    month: "October",
    theme: "Systems + seasonal prep",
    focus:
      "Create templates, clean up process, build seasonal campaigns, and archive reusable assets.",
    visibleWin: "Marketing becomes easier to sustain.",
  },
];

const quickLinks: QuickLink[] = [
  {
    title: "Lead & Signup Entry",
    description:
      "Add Pet Parent leads, Guru leads, Ambassador leads, partner leads, referrals, pets, and points of contact from a tablet or laptop.",
    href: "/admin/sales-marketing/lead-entry",
    icon: PlusCircle,
    featured: true,
  },
  {
    title: "Signup Leads & Referrals",
    description:
      "Review signup leads, referrals, optional pet details, message-ready status, CEO priority, and next follow-ups.",
    href: "/admin/sales-marketing/signup-leads",
    icon: HeartHandshake,
    featured: true,
  },
  {
    title: "Daily Tracker",
    description: "Review today’s tasks, Danette’s status, proof, notes, and CEO confirmation.",
    href: "/admin/sales-marketing/daily-tracker",
    icon: CalendarDays,
  },
  {
    title: "CEO Review",
    description: "Confirm completed tasks, flag follow-up, and capture support notes.",
    href: "/admin/sales-marketing/ceo-review",
    icon: ClipboardCheck,
  },
  {
    title: "Weekly Review",
    description: "Review Friday summaries, blockers, wins, and next-week priorities.",
    href: "/admin/sales-marketing/weekly-review",
    icon: BarChart3,
  },
  {
    title: "Monthly Review",
    description: "Confirm progress against the monthly marketing theme and roadmap.",
    href: "/admin/sales-marketing/monthly-review",
    icon: Flag,
  },
  {
    title: "Outreach",
    description: "Track groomers, trainers, vets, apartments, schools, and local partners.",
    href: "/admin/sales-marketing/outreach",
    icon: Users,
  },
  {
    title: "Content Planner",
    description: "Plan social posts, launch captions, ads, campaign copy, and assets.",
    href: "/admin/sales-marketing/content",
    icon: Megaphone,
  },
  {
    title: "Proof Library",
    description: "Collect testimonials, screenshots, reviews, pet photos, and local wins.",
    href: "/admin/sales-marketing/proof-library",
    icon: MessageSquareText,
  },
  {
    title: "Campaigns",
    description: "Organize launch, Guru signup, Pet Parent signup, PawPerks, and seasonal pushes.",
    href: "/admin/sales-marketing/campaigns",
    icon: FileText,
  },
];

const dailyRhythm = [
  {
    day: "Monday",
    focus: "Plan & organize",
    success: "Review the week, choose priorities, update the tracker, and align.",
  },
  {
    day: "Tuesday",
    focus: "Create content",
    success: "Draft or batch posts, stories, reels, and Guru spotlights.",
  },
  {
    day: "Wednesday",
    focus: "Outreach & partnerships",
    success: "Contact local businesses, log touchpoints, and set follow-ups.",
  },
  {
    day: "Thursday",
    focus: "Community engagement",
    success: "Reply to DMs/comments, engage locally, and collect questions.",
  },
  {
    day: "Friday",
    focus: "Review & optimize",
    success: "Check numbers, note the biggest win/blocker, and complete weekly review.",
  },
  {
    day: "Saturday",
    focus: "Capture & repurpose",
    success: "Collect proof, photos, screenshots, and reusable assets.",
  },
  {
    day: "Sunday",
    focus: "Reset & prepare",
    success: "Preview next week, move deferred items, and prepare Monday priorities.",
  },
];

async function getCount(table: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(`Sales & Marketing count error for ${table}:`, error.message);
    return 0;
  }

  return count ?? 0;
}

async function getFilteredCount(table: string, column: string, values: string[]) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
    .in(column, values);

  if (error) {
    console.error(
      `Sales & Marketing filtered count error for ${table}.${column}:`,
      error.message,
    );
    return 0;
  }

  return count ?? 0;
}

async function getNeedsHelpCount() {
  const { count, error } = await supabaseAdmin
    .from("admin_marketing_tasks")
    .select("*", { count: "exact", head: true })
    .or("needs_help.eq.true,status.in.(Blocked,Needs Follow-Up),ceo_review_status.in.(Needs help,Needs Follow-Up)");

  if (error) {
    console.error("Sales & Marketing needs-help count error:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function getMarketingCounts(): Promise<MarketingCounts> {
  const [
    totalTasks,
    awaitingCeoReview,
    blockedOrHelp,
    weeklyReviews,
    monthlyReviews,
    outreachContacts,
    contentItems,
    proofItems,
    campaigns,
    signupLeads,
    referrals,
  ] = await Promise.all([
    getCount("admin_marketing_tasks"),
    getFilteredCount("admin_marketing_tasks", "status", ["CEO Review", "Done"]),
    getNeedsHelpCount(),
    getCount("admin_marketing_weekly_reviews"),
    getCount("admin_marketing_monthly_reviews"),
    getCount("admin_marketing_outreach_contacts"),
    getCount("admin_marketing_content_calendar"),
    getCount("admin_marketing_proof_library"),
    getCount("admin_marketing_campaigns"),
    getCount("admin_marketing_signup_leads"),
    getCount("admin_marketing_referrals"),
  ]);

  return {
    totalTasks,
    awaitingCeoReview,
    blockedOrHelp,
    weeklyReviews,
    monthlyReviews,
    outreachContacts,
    contentItems,
    proofItems,
    campaigns,
    signupLeads,
    referrals,
  };
}

async function getReviewItems(): Promise<ReviewItem[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_tasks")
    .select("primary_task, owner_name, status, task_date, needs_help, ceo_review_status")
    .or("status.in.(CEO Review,Blocked,Waiting,Done),needs_help.eq.true")
    .order("task_date", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Sales & Marketing review queue error:", error.message);
    return [];
  }

  return ((data ?? []) as MarketingTaskRow[]).map((item) => {
    const status = item.needs_help
      ? "Needs Help"
      : item.status || item.ceo_review_status || "Not Reviewed";

    const tone: StatusTone =
      status === "CEO Review" || status === "Done"
        ? "amber"
        : status === "Blocked" || status === "Needs Help"
          ? "rose"
          : status === "Waiting"
            ? "blue"
            : "slate";

    const due = item.task_date
      ? new Date(`${item.task_date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Not scheduled";

    return {
      title: item.primary_task,
      owner: item.owner_name || "Danette",
      status,
      due,
      tone,
    };
  });
}

function buildDashboardCards(counts: MarketingCounts): DashboardCard[] {
  return [
    {
      title: "Lead Intake",
      value: String(counts.signupLeads + counts.referrals),
      description:
        "Signup leads and referrals captured by Jason or Danette through Sales & Marketing.",
      icon: PlusCircle,
      tone: "emerald",
    },
    {
      title: "Marketing Tasks",
      value: String(counts.totalTasks),
      description: "Live Supabase count of daily Sales & Marketing tasks.",
      icon: Target,
      tone: "blue",
    },
    {
      title: "Awaiting CEO Review",
      value: String(counts.awaitingCeoReview),
      description: "Tasks marked Done or CEO Review that still need Jason confirmation.",
      icon: ClipboardCheck,
      tone: "amber",
    },
    {
      title: "Needs Help / Blocked",
      value: String(counts.blockedOrHelp),
      description: "Tasks that may need CEO support, workflow help, or follow-up.",
      icon: AlertCircle,
      tone: "rose",
    },
  ];
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

export default async function SalesMarketingAdminPage() {
  const [counts, reviewItems] = await Promise.all([
    getMarketingCounts(),
    getReviewItems(),
  ]);

  const dashboardCards = buildDashboardCards(counts);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                  <Megaphone className="h-4 w-4" aria-hidden="true" />
                  Sales & Marketing Command Center
                </div>

                <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  CEO visibility plus field lead entry for SitGuru growth.
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Jason and Danette can now track marketing work, review blockers,
                  capture leads, enter referrals, organize outreach, and connect
                  campaigns to future growth reporting.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Primary owner</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">Danette</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">CEO support</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">Jason</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Supabase status</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">Connected</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Field entry
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Add leads fast
                  </h2>
                </div>
                <CardIcon icon={PlusCircle} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Use the Lead & Signup Entry page on a tablet or laptop to add Pet
                Parent leads, Guru leads, Ambassador leads, partners, referrals,
                and points of contact.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Link
                  href="/admin/sales-marketing/lead-entry"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Open Lead Entry
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/admin/sales-marketing/signup-leads"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  Review Leads
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Current intake
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {counts.signupLeads} signup leads · {counts.referrals} referrals
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${toneStyles[card.tone].card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <CardIcon icon={card.icon} tone={card.tone} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/admin/sales-marketing/signup-leads"
            className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm transition hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold text-slate-500">Signup Leads</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {counts.signupLeads}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pet Parent, Guru, Ambassador, partner, and program applicant leads.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              Review leads
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/admin/sales-marketing/signup-leads"
            className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm transition hover:bg-sky-50"
          >
            <p className="text-sm font-semibold text-slate-500">Referrals</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {counts.referrals}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Referral records captured by Jason or Danette.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-sky-700">
              Review referrals
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/admin/sales-marketing/outreach"
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold text-slate-500">Outreach Contacts</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {counts.outreachContacts}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Groomers, trainers, vet techs, partners, and local contacts.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              Open outreach
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/admin/sales-marketing/content"
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold text-slate-500">Content + Campaigns</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {counts.contentItems + counts.campaigns}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Content planner items and campaign records.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              Open planner
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/admin/sales-marketing/proof-library"
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold text-slate-500">Proof Library</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {counts.proofItems}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Testimonials, screenshots, DMs, reviews, and pet photos.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              Open proof
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  CEO Review Queue
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  Live tasks needing confirmation or support
                </h2>
              </div>
              <Link
                href="/admin/sales-marketing/ceo-review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open CEO Review
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {reviewItems.length > 0 ? (
                reviewItems.map((item) => (
                  <div
                    key={`${item.title}-${item.due}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Owner: {item.owner} · Due: {item.due}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[item.tone].pill}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-bold text-emerald-950">
                    No current review queue items.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-900">
                    When Danette marks tasks as Done, CEO Review, Waiting, or
                    Blocked, they will appear here.
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Quick Links
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Sales & Marketing work areas
              </h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group rounded-2xl border p-4 transition ${
                    link.featured
                      ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${
                        link.featured
                          ? "bg-emerald-700 text-white ring-emerald-700"
                          : "bg-white text-emerald-700 ring-slate-200 group-hover:ring-emerald-200"
                      }`}
                    >
                      <link.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{link.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Daily Operating Rhythm
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Weekly rhythm Danette can follow
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This keeps the marketing work simple: plan, create, outreach,
                engage, review, capture proof, and reset for the next week.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[0.7fr_1fr_1.6fr] bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                <span>Day</span>
                <span>Focus</span>
                <span>Success looks like</span>
              </div>

              {dailyRhythm.map((row) => (
                <div
                  key={row.day}
                  className="grid grid-cols-[0.7fr_1fr_1.6fr] border-t border-slate-200 px-4 py-3 text-sm"
                >
                  <span className="font-bold text-slate-950">{row.day}</span>
                  <span className="font-semibold text-emerald-800">{row.focus}</span>
                  <span className="text-slate-600">{row.success}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Six-Month Roadmap
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Monthly CEO confirmation path
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Each month has a clear marketing theme, focus, and visible win so
                Jason can confirm whether the month’s work is moving SitGuru forward.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {roadmap.map((item) => (
                <div
                  key={item.month}
                  className={`rounded-2xl border p-4 ${
                    item.active
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-950">
                          {item.month}
                        </h3>
                        {item.active ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-bold text-emerald-800">{item.theme}</p>
                    </div>
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        item.active ? "text-emerald-700" : "text-slate-300"
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.focus}</p>

                  <div className="mt-3 rounded-xl border border-white/80 bg-white/80 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Visible win
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {item.visibleWin}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Safe Admin Expansion
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Sales & Marketing now includes field lead intake and review.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This dashboard reads from Sales & Marketing Admin tables only. It
                does not change public pages, customer flows, Guru flows, bookings,
                payments, Stripe, Plaid, or financial logic.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-emerald-950">
                  Lead Entry Linked
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-sky-950">
                  Signup Review Live
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-slate-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-950">
                  Admin Route Only
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}