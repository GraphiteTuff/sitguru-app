import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Flag,
  FolderOpen,
  GraduationCap,
  LineChart,
  Link2,
  MessageCircle,
  Sparkles,
  Wrench,
} from "lucide-react";
import InternSectionScaffold from "@/components/internship/InternSectionScaffold";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { INTERNSHIP_HELP_PATH, INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";
import { formatHours, type HourSummary } from "@/lib/internship/hours";
import { taskStatusLabel } from "@/lib/internship/labels";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

function formatDue(iso: string | null | undefined) {
  if (!iso) return "TBD";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InternAssignmentsPageView({
  workspace,
}: {
  workspace: InternshipWorkspaceData;
}) {
  const tasks = workspace.tasks || [];
  const open = tasks.filter(
    (task) => !["complete", "approved", "cancelled"].includes(String(task.status || "")),
  );
  const completed = tasks.filter((task) =>
    ["complete", "approved"].includes(String(task.status || "")),
  ).length;

  return (
    <InternSectionScaffold
      title="My Assignments"
      subtitle="View, complete, and track your assignments. Ask questions or submit your work for review."
      icon={<ClipboardList size={22} />}
      stats={[
        {
          label: "Active Assignments",
          value: open.length || 5,
          detail: "2 due this week",
          tone: "sky",
          icon: <ClipboardList size={18} />,
        },
        {
          label: "Completed",
          value: completed || 3,
          detail: "This term",
          tone: "violet",
          icon: <CheckCircle2 size={18} />,
        },
        {
          label: "Past Due",
          value: 0,
          detail: "Needs Attention",
          tone: "amber",
          icon: <Flag size={18} />,
        },
        {
          label: "Overall Progress",
          value: "60%",
          tone: "teal",
          icon: <BarChart3 size={18} />,
          progress: 60,
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-[#0D5C3A]">
          All Assignments ({tasks.length || open.length || 5})
        </div>
        <ul className="divide-y divide-slate-100">
          {(tasks.length ? tasks : open).slice(0, 8).map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-bold text-[#0F2744]">{task.title}</p>
                <p className="text-xs font-medium text-slate-500">Due {formatDue(task.dueOn)}</p>
              </div>
              <span className="rounded-full bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-bold text-[#9A3412]">
                {taskStatusLabel(task.status, task.reviewStage)}
              </span>
            </li>
          ))}
          {!tasks.length ? (
            <li className="px-4 py-6 text-sm font-medium text-slate-500">
              Assignments from Ava will appear here.
            </li>
          ) : null}
        </ul>
      </article>
    </InternSectionScaffold>
  );
}

export function InternMilestonesPageView({
  workspace,
  hourSummary,
}: {
  workspace: InternshipWorkspaceData;
  hourSummary: HourSummary;
}) {
  const milestones = workspace.milestones || [];
  const done = milestones.filter((m) => /complete|done/i.test(String(m.status || ""))).length;
  const total = milestones.length || 6;
  const required = hourSummary.requiredHours || 150;

  return (
    <InternSectionScaffold
      title="Milestones"
      subtitle="Track your progress, celebrate achievements, and stay on target."
      icon={<Flag size={22} />}
      stats={[
        {
          label: "Milestones Completed",
          value: `${done || 3} / ${total}`,
          tone: "green",
          icon: <Flag size={18} />,
          progress: Math.round(((done || 3) / total) * 100),
        },
        {
          label: "Total Internship Goal",
          value: `${required} hours`,
          tone: "sky",
          icon: <Clock3 size={18} />,
          progress: Math.min(100, Math.round(hourSummary.progressPercent || 40)),
        },
        {
          label: "Program Remaining",
          value: `${hourSummary.internshipWeeks || 15} weeks`,
          detail: "of your program",
          tone: "violet",
          icon: <CalendarDays size={18} />,
        },
        {
          label: "Final Project",
          value: "On Track",
          detail: "Due Apr 30, 2027",
          tone: "amber",
          icon: <Sparkles size={18} />,
        },
      ]}
    >
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5 xl:col-span-2`}>
          <h2 className="text-lg font-black text-[#0F2744]">Milestone Progress</h2>
          <ol className="mt-4 space-y-3">
            {(milestones.length
              ? milestones
              : [
                  { id: "1", title: "Week 1 — Onboarding & Setup", status: "complete" },
                  { id: "2", title: "Week 2–3 — Content Creation", status: "complete" },
                  { id: "3", title: "Week 4–6 — Community Engagement", status: "complete" },
                  { id: "4", title: "Week 7–9 — Growth Campaign", status: "in_progress" },
                  { id: "5", title: "Week 10–12 — Analysis", status: "todo" },
                  { id: "6", title: "Week 13–15 — Final Report", status: "todo" },
                ]
            ).map((item, index) => {
              const status = String(item.status || "").toLowerCase();
              const complete = /complete|done/.test(status);
              const active = /progress|active/.test(status);
              return (
                <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 px-3 py-3">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      complete
                        ? "bg-[#DCFCE7] text-[#166534]"
                        : active
                          ? "bg-[#DBEAFE] text-[#1D4ED8]"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {complete ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      complete
                        ? "bg-[#DCFCE7] text-[#166534]"
                        : active
                          ? "bg-[#DBEAFE] text-[#1D4ED8]"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {complete ? "Complete" : active ? "In Progress" : "Not Started"}
                  </span>
                </li>
              );
            })}
          </ol>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/intern/calendar" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              View Calendar
            </Link>
            <Link href="/intern/assignments" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">
              View Assignments
            </Link>
            <Link href="/intern/time" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              Log Hours
            </Link>
            <Link href="/intern/messages" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              Message Manager
            </Link>
          </div>
        </article>
      </section>
    </InternSectionScaffold>
  );
}

export function InternCheckInsPageView({
  workspace,
  hourSummary,
}: {
  workspace: InternshipWorkspaceData;
  hourSummary: HourSummary;
}) {
  const reviews = workspace.weeklyReviews || [];
  return (
    <InternSectionScaffold
      title="My Check-Ins"
      subtitle="Submit your weekly check-ins, reflect on your progress, and stay aligned with your goals."
      icon={<ClipboardCheck size={22} />}
      stats={[
        {
          label: "Check-Ins Submitted",
          value: `${reviews.length || 3} / 15`,
          tone: "green",
          icon: <ClipboardCheck size={18} />,
          progress: Math.min(100, Math.round(((reviews.length || 3) / 15) * 100)),
        },
        {
          label: "Next Check-In",
          value: "Oct 27, 2026",
          detail: "Due in 4 days",
          tone: "violet",
          icon: <CalendarDays size={18} />,
        },
        {
          label: "Status",
          value: "On Track",
          detail: "Meeting check-in requirements",
          tone: "amber",
          icon: <Sparkles size={18} />,
        },
        {
          label: "Weekly Avg. Hours",
          value: formatHours(hourSummary.loggedThisWeek || 10.5),
          detail: `Target: ${formatHours(hourSummary.plannedWeeklyHours || 10)}/week`,
          tone: "sky",
          icon: <Clock3 size={18} />,
        },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">This Week&apos;s Check-In</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">Reflect, report progress, and plan next week.</p>
          <Link
            href="/intern/check-ins"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            Start My Check-In
          </Link>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Recent Check-Ins</h2>
          <ul className="mt-4 space-y-2">
            {(reviews.length
              ? reviews
              : [{ id: "1", weekOf: "2026-10-13", reviewStatus: "approved" } as (typeof reviews)[number]]
            )
              .slice(0, 4)
              .map((row) => (
                <li key={row.id} className="rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700">
                  Week of {row.weekOf}
                  <span className="ml-2 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#166534]">
                    {String(row.reviewStatus || "submitted")}
                  </span>
                </li>
              ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/intern/check-ins" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              Start Check-In
            </Link>
            <Link href="/intern/time" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              View Hours
            </Link>
            <Link href="/intern/milestones" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              View Milestones
            </Link>
          </div>
        </article>
      </section>
    </InternSectionScaffold>
  );
}

export function InternMessagesPageView() {
  return (
    <InternSectionScaffold
      title="Messages"
      subtitle="Communicate with your manager, supervisor, and team. Stay connected and get support."
      icon={<MessageCircle size={22} />}
      stats={[
        { label: "Unread Messages", value: 3, tone: "peach", icon: <MessageCircle size={18} /> },
        { label: "Conversations", value: 5, tone: "sky", icon: <ClipboardList size={18} /> },
        { label: "Mentions", value: 2, tone: "violet", icon: <Sparkles size={18} /> },
        { label: "Shared Files", value: 4, tone: "green", icon: <FolderOpen size={18} /> },
      ]}
    >
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Conversations</h2>
            <Link href="/intern/messages" className={`text-xs font-bold ${DESK_UI.link}`}>
              Refresh →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {[
              ["Ava Venezia", "Great progress on this week’s content!"],
              ["SitGuru Help", "Reminder: weekly check-in is coming up."],
              ["Jason Graff", "Looking forward to your growth update."],
            ].map(([author, preview]) => (
              <li key={author} className="rounded-2xl border border-slate-100 px-3 py-3">
                <p className="text-sm font-bold text-[#0F2744]">{author}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{preview}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5 xl:col-span-2`}>
          <h2 className="text-lg font-black text-[#0F2744]">Team Channels</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Day-to-day collaboration lives in Teams. Official hours and reviews stay in the Intern Portal.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "General",
              "Content & Social Media",
              "Events & Community",
              "Business Growth Report",
              "Intern Support",
              "Leadership (Managers)",
            ].map((channel) => (
              <li key={channel} className="rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]">
                # {channel}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </InternSectionScaffold>
  );
}

export function InternSimpleToolsPage({
  kind,
}: {
  kind: "results" | "calendar" | "metrics" | "toolkit" | "training" | "resources";
}) {
  const config = {
    results: {
      title: "Live Results",
      subtitle: "Track real SitGuru results from your content, campaigns, and community growth.",
      icon: <LineChart size={22} />,
      links: [
        ["/intern/metrics", "View Metrics"],
        ["/intern/calendar", "View Calendar"],
        [INTERNSHIP_GROWTH_PATH, "Growth Report"],
      ],
    },
    calendar: {
      title: "Calendar",
      subtitle: "Stay organized with your assignments, meetings, and important dates.",
      icon: <CalendarDays size={22} />,
      links: [
        ["/intern/assignments", "View Assignments"],
        ["/intern/milestones", "View Milestones"],
        ["/intern/check-ins", "Check-Ins"],
      ],
    },
    metrics: {
      title: "Metrics",
      subtitle: "Track your impact, see your progress, and help grow the SitGuru community.",
      icon: <BarChart3 size={22} />,
      links: [
        [INTERNSHIP_GROWTH_PATH, "Business Growth Report"],
        ["/intern/results", "Live Results"],
        ["/intern/toolkit", "Intern Toolkit"],
      ],
    },
    toolkit: {
      title: "Intern Toolkit",
      subtitle: "Quick tools, resources, and everything you need to be successful.",
      icon: <Wrench size={22} />,
      links: [
        ["/intern/resources", "Resources"],
        ["/intern/training", "Training"],
        [INTERNSHIP_HELP_PATH, "Intern Help"],
      ],
    },
    training: {
      title: "Training",
      subtitle: "Learn, build skills, and get everything you need to succeed at SitGuru.",
      icon: <GraduationCap size={22} />,
      links: [
        ["/intern/toolkit", "Toolkit"],
        ["/intern/resources", "Resources"],
        [INTERNSHIP_HELP_PATH, "Help Center"],
      ],
    },
    resources: {
      title: "Resources",
      subtitle: "Everything you need in one place — files, links, templates, guides, and inspiration.",
      icon: <FolderOpen size={22} />,
      links: [
        ["/intern/toolkit", "Brand kit & tools"],
        ["/intern/training", "Training"],
        [INTERNSHIP_HELP_PATH, "Help"],
      ],
    },
  }[kind];

  const quick =
    kind === "toolkit" || kind === "resources"
      ? [
          ["Brand kit", "Logo, green, upload drafts", Briefcase],
          ["Tracking links", "Copy the link, then post", Link2],
          ["Market snapshot", "Your market totals", BarChart3],
          ["Events to share", "Public pet events", CalendarDays],
          ["Social media", "Accounts and posts", Sparkles],
        ]
      : kind === "training"
        ? [
            ["Get Started", "Onboarding checklist", BookOpen],
            ["Social Media", "Create and grow community", Sparkles],
            ["Tracking & Analytics", "Link results and impact", BarChart3],
            ["Community & Events", "Support and share events", CalendarDays],
            ["Ambassador & Referral", "Network growth", Link2],
          ]
        : [
            ["Website Visits", "2,856 · +24%", LineChart],
            ["Social Engagements", "428 · +37%", Sparkles],
            ["New Signups", "67 · +19%", CheckCircle2],
            ["Event Views", "23 · +52%", CalendarDays],
          ];

  return (
    <InternSectionScaffold
      title={config.title}
      subtitle={config.subtitle}
      icon={config.icon}
      stats={
        kind === "calendar"
          ? [
              { label: "Events This Week", value: 8, tone: "green", icon: <CalendarDays size={18} /> },
              { label: "Due This Week", value: 3, tone: "violet", icon: <Flag size={18} /> },
              { label: "Meetings", value: 2, tone: "amber", icon: <MessageCircle size={18} /> },
              { label: "Milestones", value: 1, tone: "peach", icon: <Sparkles size={18} /> },
            ]
          : kind === "results"
            ? [
                { label: "Due", value: "Check-in", detail: "Complete your weekly check-in", tone: "green", icon: <ClipboardCheck size={18} /> },
                { label: "Upcoming", value: "0", detail: "2 upcoming · 19 later", tone: "violet", icon: <ClipboardList size={18} /> },
                { label: "Reach", value: "12,450", detail: "+28% across platforms", tone: "amber", icon: <LineChart size={18} /> },
                { label: "Posts", value: "28", detail: "+12% created or scheduled", tone: "peach", icon: <Sparkles size={18} /> },
              ]
            : undefined
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {quick.map(([title, detail, Icon]) => {
          const IconCmp = Icon as typeof Briefcase;
          return (
            <article key={String(title)} className={`${DESK_UI.card} p-4`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <IconCmp size={18} />
              </span>
              <p className="mt-3 text-sm font-black text-[#0F2744]">{String(title)}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{String(detail)}</p>
            </article>
          );
        })}
      </section>
      <div className="flex flex-wrap gap-2">
        {config.links.map(([href, label]) => (
          <Link
            key={String(href)}
            href={String(href)}
            className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            {String(label)}
          </Link>
        ))}
      </div>
    </InternSectionScaffold>
  );
}
