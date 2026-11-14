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
import { saveWeeklyReview } from "@/lib/internship/actions";
import { FinalSectionSelect } from "@/components/internship/InternshipFinalProjectBoard";
import { isSubmittedWeeklyReview, isApprovedWeeklyReview, weekMonday } from "@/lib/internship/checkins-summary";
import { reviewStageLabel } from "@/lib/internship/review-flow";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

function formatDue(iso: string | null | undefined) {
  if (!iso) return "TBD";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InternAssignmentsPageView({
  workspace,
  links = {},
}: {
  workspace: InternshipWorkspaceData;
  links?: Record<string, { planner?: string; files?: string; teams?: string; canva?: string }>;
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
          value: open.length,
          detail: "Assigned work",
          tone: "sky",
          icon: <ClipboardList size={18} />,
        },
        {
          label: "Completed",
          value: completed,
          detail: "This term",
          tone: "violet",
          icon: <CheckCircle2 size={18} />,
        },
        {
          label: "Past Due",
          value: open.filter((task) => task.dueOn && new Date(`${task.dueOn}T23:59:59`).getTime() < Date.now()).length,
          detail: "Needs attention",
          tone: "amber",
          icon: <Flag size={18} />,
        },
        {
          label: "Overall Progress",
          value: tasks.length ? `${Math.round((completed / tasks.length) * 100)}%` : "0%",
          tone: "teal",
          icon: <BarChart3 size={18} />,
          progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-black text-[#0D5C3A]">All Assignments ({tasks.length})</span>
          <Link href="/intern/calendar" className="inline-flex min-h-10 items-center rounded-full bg-blue-50 px-4 text-xs font-black text-blue-700 hover:bg-blue-100">
            View my calendar
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/intern/assignments/${task.id}`} className="font-bold text-[#0F2744] hover:text-blue-700 hover:underline">{task.title}</Link>
                <p className="text-xs font-medium text-slate-500">Due {formatDue(task.dueOn)}</p>
                <Link href={`/intern/assignments/${task.id}`} className="mt-1 inline-flex min-h-9 items-center text-xs font-black text-blue-700">Open &amp; update →</Link>
              </div>
              <span className="rounded-full bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-bold text-[#9A3412]">
                {taskStatusLabel(task.status, task.reviewStage)}
              </span>
              <span className="flex flex-wrap gap-2 text-xs font-bold text-[#2563EB]">
                {links[task.id]?.planner ? <a href={links[task.id].planner}>Open Planner</a> : null}
                {links[task.id]?.files ? <a href={links[task.id].files}>Open project files</a> : null}
                {links[task.id]?.teams ? <a href={links[task.id].teams}>Open Teams</a> : null}
                {links[task.id]?.canva ? <a href={links[task.id].canva}>Open Canva</a> : null}
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
  const milestones = (workspace.milestones || []).filter(item =>
    !item.universityId || item.universityId === workspace.intern.universityId
  );
  const done = milestones.filter(item => ["done", "complete", "completed", "approved"].includes(String(item.status || "").toLowerCase())).length;
  const total = milestones.length;
  const required = hourSummary.requiredHours;
  const final = milestones.find(item => item.key === "closeout" || /final report|closeout/i.test(item.title));
  const finalStatus = final
    ? (["done", "complete", "completed", "approved"].includes(String(final.status || "").toLowerCase()) ? "Completed" :
       ["in_progress", "active"].includes(String(final.status || "").toLowerCase()) ? "In progress" : "Scheduled")
    : "Not scheduled";

  return (
    <InternSectionScaffold
      title="Milestones"
      subtitle="Your SitGuru program dates and your university-specific milestones. Progress comes from recorded status, not estimated percentages."
      icon={<Flag size={22} />}
      stats={[
        {
          label: "Milestones Completed",
          value: done + " / " + total,
          tone: "green",
          icon: <Flag size={18} />,
          progress: total > 0 ? Math.round(done / total * 100) : undefined,
        },
        {
          label: "Internship Hour Goal",
          value: required != null ? required + " hours" : "Not confirmed",
          tone: "sky",
          icon: <Clock3 size={18} />,
          progress: required != null && required > 0 ? (hourSummary.progressPercent ?? 0) : undefined,
        },
        {
          label: "Academic Duration",
          value: hourSummary.internshipWeeks ? hourSummary.internshipWeeks + " weeks" : "Not confirmed",
          detail: "Your university's approved plan",
          tone: "violet",
          icon: <CalendarDays size={18} />,
        },
        {
          label: "Final Project",
          value: finalStatus,
          detail: final?.dueOn ? "Target: " + formatDue(final.dueOn) : "No final milestone date recorded",
          tone: "amber",
          icon: <Sparkles size={18} />,
        },
      ]}
    >
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={DESK_UI.card + " p-4 sm:p-5 xl:col-span-2"}>
          <h2 className="text-lg font-black text-[#0F2744]">Your Program Milestones</h2>
          <p className="mt-1 text-xs font-semibold text-slate-600">Shared SitGuru milestones appear alongside dates applicable to your own university, never another school's deadlines.</p>
          {milestones.length ? (
            <ol className="mt-4 space-y-3">
              {milestones.map((item, index) => {
                const status = String(item.status || "").toLowerCase();
                const complete = ["done", "complete", "completed", "approved"].includes(status);
                const active = ["in_progress", "active"].includes(status);
                const blocked = status === "blocked";
                return (
                  <li key={item.id} className="flex flex-wrap items-start gap-3 rounded-2xl border border-slate-100 px-3 py-3">
                    <span className={"inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black " +
                      (complete ? "bg-[#DCFCE7] text-[#166534]" : active ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-slate-100 text-slate-500")}>
                      {complete ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#0F2744]">{item.title}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {item.dueOn ? formatDue(item.dueOn) : "Date not scheduled"} · {item.universityName || "SitGuru employer calendar"}
                      </p>
                      {item.action ? <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{item.action}</p> : null}
                    </div>
                    <span className={"rounded-full px-2.5 py-1 text-[10px] font-black " +
                      (complete ? "bg-[#DCFCE7] text-[#166534]" : active ? "bg-[#DBEAFE] text-[#1D4ED8]" : blocked ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-slate-100 text-slate-700")}>
                      {complete ? "Completed" : active ? "In progress" : blocked ? "Blocked" : "Scheduled"}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : <p className="mt-4 rounded-xl bg-[#F8FAFC] p-4 text-sm font-medium text-slate-600">No applicable milestone records are scheduled for your internship yet.</p>}
        </article>
        <article className={DESK_UI.card + " p-4 sm:p-5"}>
          <h2 className="text-lg font-black text-[#0F2744]">Related Work</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/intern/calendar" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">View Calendar</Link>
            <Link href="/intern/assignments" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">View Assignments</Link>
            <Link href="/intern/check-ins" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">Weekly Check-Ins</Link>
            <Link href="/intern/time" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">Log Hours</Link>
            <Link href="/intern/messages" className="rounded-2xl bg-[#F8FAFC] px-3 py-3 text-center text-sm font-bold text-[#0F2744]">Message Manager</Link>
          </div>
        </article>
      </section>
    </InternSectionScaffold>
  );
}

export function InternCheckInsPageView({
  workspace,
  hourSummary,
  notice = "",
  error = "",
}: {
  workspace: InternshipWorkspaceData;
  hourSummary: HourSummary;
  notice?: string;
  error?: string;
}) {
  const reviews=[...(workspace.weeklyReviews||[])].sort((a,b)=>String(b.weekOf).localeCompare(String(a.weekOf)));
  const submitted=reviews.filter(row=>isSubmittedWeeklyReview(String(row.reviewStatus||"")));
  const approved=reviews.filter(row=>isApprovedWeeklyReview(String(row.reviewStatus||"")));
  const expected=workspace.intern.internshipWeeks||null;
  const nowKey=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const monday=weekMonday(nowKey);
  const start=workspace.intern.academicStartDate||workspace.cohort?.startsOn||"";
  const canSubmit=workspace.intern.status==="active" && Boolean(start) && start<=nowKey;
  const thisWeek=reviews.find(row=>weekMonday(row.weekOf)===monday);
  const currentSubmitted=Boolean(thisWeek && isSubmittedWeeklyReview(String(thisWeek.reviewStatus||"")));
  const nextFriday=new Date(`${monday}T12:00:00Z`);
  nextFriday.setUTCDate(nextFriday.getUTCDate()+4);
  const due=canSubmit?nextFriday.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}):"Not started";
  const status=thisWeek?reviewStageLabel(String(thisWeek.reviewStatus||"draft")):canSubmit?"Awaiting weekly submission":"Not started";
  const fieldClass="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F2744]";
  return (
    <InternSectionScaffold
      title="My Check-Ins"
      subtitle="Record your weekly accomplishments and evidence. Ava reviews each submission; approved contributions feed your final Growth Report."
      icon={<ClipboardCheck size={22} />}
      stats={[
        {label:"Check-Ins Submitted",value:expected?`${submitted.length} / ${expected}`:String(submitted.length),tone:"green",icon:<ClipboardCheck size={18}/>,progress:expected?Math.min(100,Math.round(submitted.length/expected*100)):0},
        {label:"Next Check-In",value:currentSubmitted?"Submitted":due,detail:currentSubmitted?"Awaiting manager decision or already reviewed":canSubmit?"Weekly check-in target: Friday":"Spring internship work has not started",tone:"violet",icon:<CalendarDays size={18}/>},
        {label:"Status",value:status,detail:`${approved.length} approved by SitGuru`,tone:"amber",icon:<Sparkles size={18}/>},
        {label:"Hours Logged This Week",value:formatHours(hourSummary.loggedThisWeek),detail:(hourSummary.plannedWeeklyHours??0)>0?`Planned: ${formatHours(hourSummary.plannedWeeklyHours??0)}/week`:"Weekly target not configured",tone:"sky",icon:<Clock3 size={18}/>},
      ]}
    >
      {notice?<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{notice}</p>:null}
      {error?<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">{error}</p>:null}
      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article id="weekly-checkin-form" className={`${DESK_UI.card} scroll-mt-24 p-4 sm:p-6`}>
          <h2 className="text-lg font-black text-[#0F2744]">This Week&apos;s Check-In</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {currentSubmitted?"You already submitted this week. Any changes will resubmit the record for Ava's review.":"Describe your actual work and how it contributes to your final project."}
          </p>
          {canSubmit?(
            <form action={saveWeeklyReview} className="mt-4 space-y-3">
              <input type="hidden" name="internId" value={workspace.intern.id}/>
              <input type="hidden" name="mode" value="intern"/>
              <label className="block text-xs font-black text-[#0F2744]">Week of
                <input type="date" required name="weekOf" defaultValue={monday} max={nowKey} className={fieldClass}/>
              </label>
              <FinalSectionSelect defaultValue={thisWeek?.finalSection||""}/>
              <label className="block text-xs font-black text-[#0F2744]">Contribution to your final Growth Report
                <textarea name="contributionAdded" required rows={3} defaultValue={thisWeek?.contributionAdded||""} placeholder="What did you add or improve this week?" className={fieldClass}/>
              </label>
              <label className="block text-xs font-black text-[#0F2744]">Work accomplished
                <textarea name="accomplished" rows={3} defaultValue={thisWeek?.accomplished||""} placeholder="Describe your actual assignments, activities and results" className={fieldClass}/>
              </label>
              <label className="block text-xs font-black text-[#0F2744]">What did the data show?
                <textarea name="dataShowed" rows={2} defaultValue={thisWeek?.dataShowed||""} placeholder="Record only observed or verified numbers; leave blank if unavailable" className={fieldClass}/>
              </label>
              <label className="block text-xs font-black text-[#0F2744]">Challenges and what didn't work
                <textarea name="didntWork" rows={2} defaultValue={thisWeek?.didntWork||""} className={fieldClass}/>
              </label>
              <label className="block text-xs font-black text-[#0F2744]">What will you change next week?
                <textarea name="changingNextWeek" rows={2} defaultValue={thisWeek?.changingNextWeek||""} className={fieldClass}/>
              </label>
              <label className="block text-xs font-black text-[#0F2744]">Hours reported (not auto-approved)
                <input type="number" name="hoursLogged" step="0.25" min="0" max="80" defaultValue={thisWeek?.hoursLogged??""} className={fieldClass}/>
              </label>
              <button type="submit" className="min-h-12 w-full rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">{currentSubmitted?"Resubmit to Ava":"Submit check-in to Ava"}</button>
              <p className="text-xs font-medium text-slate-500">Formal timesheet hours must still be logged and approved separately in My Hours.</p>
            </form>
          ):(
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Weekly check-in submission opens when your approved internship reaches its academic start date and your status is Active. You can review past check-ins now.
            </p>
          )}
        </article>
        <div className="space-y-4">
          <article className={`${DESK_UI.card} p-4 sm:p-5`}>
            <h2 className="text-lg font-black text-[#0F2744]">Recent Check-Ins ({reviews.length})</h2>
            {reviews.length?(
              <ul className="mt-4 space-y-2">
                {reviews.slice(0,10).map(row=>(
                  <li key={row.id} className="rounded-xl bg-[#F8FAFC] px-3 py-3">
                    <p className="text-sm font-black text-[#0F2744]">Week of {formatDue(row.weekOf)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${isApprovedWeeklyReview(String(row.reviewStatus||""))?"bg-emerald-100 text-emerald-900":"bg-amber-100 text-amber-900"}`}>
                      {reviewStageLabel(String(row.reviewStatus||"draft"))}
                    </span>
                    {row.contributionAdded?<p className="mt-2 line-clamp-3 text-xs font-medium text-slate-600">{row.contributionAdded}</p>:null}
                  </li>
                ))}
              </ul>
            ):<p className="mt-4 text-sm font-medium text-slate-500">No weekly reviews submitted yet. Nothing is counted until a real record exists.</p>}
          </article>
          <article className={`${DESK_UI.card} p-4 sm:p-5`}>
            <h2 className="text-lg font-black text-[#0F2744]">Related work</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/intern/assignments" className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-sm font-bold text-[#1D4ED8]">My Assignments</Link>
              <Link href="/intern/time" className="rounded-xl bg-[#F0FDF4] px-3 py-3 text-sm font-bold text-[#166534]">My Hours</Link>
              <Link href="/intern/growth" className="rounded-xl bg-[#FFF7ED] px-3 py-3 text-sm font-bold text-[#C2410C]">Growth Workspace</Link>
            </div>
          </article>
        </div>
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
