import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BarChart3, BookOpen, CalendarDays, ChevronRight, ClipboardCheck, ClipboardList, FileCheck2,
  Clock3, Flag, FolderOpen, GraduationCap, Handshake, Megaphone, MessageCircle, PawPrint, PenLine, Users,
} from "lucide-react";
import AskAvaForm from "@/components/internship/AskAvaForm";
import InternWorkSystemsCard from "@/components/internship/InternWorkSystemsCard";
import { buildLearningDashboard } from "@/lib/internship/learning-dashboard";
import { formatHours, type HourSummary } from "@/lib/internship/hours";
import { INTERN_ROUTES } from "@/lib/internship/intern-routes";
import { taskStatusLabel } from "@/lib/internship/labels";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import { INTERN_BANNER } from "@/lib/portal/desk-ui";

const learningLinks = [
  { label: "Syllabus", href: "/intern/milestones#syllabus", icon: BookOpen },
  { label: "Learning Modules", href: INTERN_ROUTES.training, icon: GraduationCap },
  { label: "Assignments", href: INTERN_ROUTES.assignments, icon: ClipboardList },
  { label: "Grades", href: "/intern/grades", icon: FileCheck2 },
  { label: "Calendar", href: INTERN_ROUTES.calendar, icon: CalendarDays },
  { label: "Discussions & Messages", href: INTERN_ROUTES.messages, icon: MessageCircle },
  { label: "Announcements", href: "/intern/announcements", icon: Megaphone },
  { label: "My Files", href: "/intern/files", icon: FolderOpen },
  { label: "My Hours", href: INTERN_ROUTES.hours, icon: Clock3 },
  { label: "Weekly Check-Ins", href: INTERN_ROUTES.checkIns, icon: ClipboardCheck },
];

const growthLinks = [
  { label: "Final Business Growth Project", href: "/intern/final-project", icon: Flag },
  { label: "Growth Results", href: INTERN_ROUTES.results, icon: BarChart3 },
  { label: "Community Studio", href: INTERN_ROUTES.communityStudio, icon: Users },
  { label: "Campus Growth", href: INTERN_ROUTES.campusGrowth, icon: GraduationCap },
  { label: "Content Studio", href: INTERN_ROUTES.content, icon: PenLine },
  { label: "Referral & Partner Results", href: "/intern/growth/referrals", icon: Handshake },
];

const card = "min-w-0 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm sm:p-5";
const row = "flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#183b31] hover:border-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700";
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function InternPortalHome({
  data,
  hourSummary,
  firstName,
  weeklyDone,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  hourSummary: HourSummary;
  firstName: string;
  weeklyDone: boolean;
  preview?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { assignments, pillars, unclassified, upcoming } = buildLearningDashboard(data, today);
  const feedback = data.comments.filter((comment) => comment.authorRole === "supervisor").slice(-3).reverse();
  const targetHours = hourSummary.pendingRequirement ? null : hourSummary.requiredHours;

  return (
    <div className="space-y-5">
      <section className="grid overflow-hidden rounded-3xl bg-[#10583f] text-white sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" data-brand-green>
        <div className="min-w-0 p-5 sm:p-7 lg:p-9">
          <p className="flex items-center gap-2 text-sm font-bold !text-white">
            <PawPrint size={19} aria-hidden="true" className="shrink-0 text-orange-300" />
            Learning &amp; Growth Center
          </p>
          <h1 className="mt-3 break-words text-3xl font-black tracking-tight !text-white sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          {!preview ? (
            <Link href={INTERN_ROUTES.assignments} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold !text-[#10583f] hover:bg-emerald-50">
              Open assignments <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div className="relative h-32 sm:h-auto">
          <Image src={INTERN_BANNER} alt="" fill priority sizes="(max-width: 639px) 100vw, 40vw" className="object-cover object-[center_45%]" />
        </div>
      </section>

      <section aria-labelledby="intern-pillar-heading" className={card}>
        <h2 id="intern-pillar-heading" className="text-xl font-black text-[#183b31]">Growth pillar progress</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <article key={pillar.id} className={`min-w-0 rounded-xl border p-4 ${pillar.id === "community" ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"}`}>
              <h3 className="break-words text-base font-bold text-[#183b31]">{pillar.label}</h3>
              <p className="mt-1 text-sm text-slate-700">
                Planned workload · {pillar.weight}%
                {targetHours != null ? ` · ${formatHours(targetHours * pillar.weight / 100)} hours` : ""}
              </p>
              {pillar.approvedHours > 0 ? (
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatHours(pillar.approvedHours)} approved hours linked to this pillar</p>
              ) : null}
              {pillar.assigned ? (
                <div className="mt-3">
                  <progress aria-label={`${pillar.label} assignments completed`} value={pillar.completed} max={pillar.assigned} className={`block h-2 w-full ${pillar.id === "community" ? "accent-emerald-700" : "accent-orange-700"}`} />
                  <p className="mt-2 text-sm font-semibold text-slate-800">{pillar.completed} of {pillar.assigned} assignments completed</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-700">No assignments classified in this pillar yet.</p>
              )}
            </article>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">Pillar hours come from approved time entries linked to classified assignments.</p>
        {unclassified > 0 ? (
          <p className="mt-3 text-sm text-slate-600">{unclassified} {unclassified === 1 ? "assignment has" : "assignments have"} no clear pillar category yet.</p>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-5">
          {!preview ? (
            <section className={card} aria-labelledby="intern-learning-heading">
              <h2 id="intern-learning-heading" className="text-xl font-black text-[#183b31]">Learning workspace</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {learningLinks.map(({ label, href, icon: Icon }) => (
                  <li key={href} className="min-w-0">
                    <Link href={href} className={row}>
                      <Icon size={18} className="shrink-0 text-[#10583f]" aria-hidden="true" />
                      <span className="min-w-0 flex-1 break-words">{label}</span>
                      <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className={card} aria-labelledby="intern-assignments-heading">
            <h2 id="intern-assignments-heading" className="text-xl font-black text-[#183b31]">My assignments</h2>
            {assignments.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {assignments.slice(0, 4).map((task) => (
                  <li key={task.id} className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm">
                    {preview ? <span className="font-semibold">{task.title}</span> : (
                      <Link href={`/intern/assignments/${encodeURIComponent(task.id)}`} className="break-words font-semibold text-[#10583f] underline-offset-4 hover:underline">{task.title}</Link>
                    )}
                    <span className="text-slate-600">{taskStatusLabel(task.status, task.reviewStage)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-600">No assignments yet.</p>}
          </section>
        </div>
        <div className="min-w-0 space-y-5">
          <section className={card} aria-labelledby="intern-deadlines-heading">
            <h2 id="intern-deadlines-heading" className="text-xl font-black text-[#183b31]">Upcoming deadlines</h2>
            {upcoming.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {upcoming.map((event) => (
                  <li key={`${event.type}-${event.id}`} className="flex min-h-12 items-start gap-3 py-3 text-sm">
                    <time dateTime={event.date} className="w-14 shrink-0 font-bold text-emerald-900">
                      {dateFormatter.format(new Date(`${event.date}T00:00:00Z`))}
                    </time>
                    <div className="min-w-0">
                      {preview ? <p className="break-words font-semibold">{event.title}</p> : (
                        <Link href={event.href} className="break-words font-semibold text-[#10583f] underline-offset-4 hover:underline">{event.title}</Link>
                      )}
                      <p className="text-slate-600">{event.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-600">No upcoming assignment or milestone dates.</p>}
          </section>
          <section className={card} aria-labelledby="intern-hours-heading">
            <h2 id="intern-hours-heading" className="text-xl font-black text-[#183b31]">Hours &amp; check-ins</h2>
            <p className="mt-3 text-sm text-slate-700">
              <strong>{formatHours(hourSummary.approvedHours)} hours approved</strong>
              {targetHours != null ? ` of ${formatHours(targetHours)} planned` : " · Program hour target pending"}
            </p>
            <p className="mt-2 text-sm text-slate-700">{formatHours(hourSummary.loggedThisWeek)} hours logged this week</p>
            <p className="mt-2 text-sm text-slate-700">{weeklyDone ? "This week’s check-in is on file." : "No check-in on file for this week."}</p>
          </section>
        </div>
      </div>

      {!preview ? (
        <section className={card} aria-labelledby="intern-growth-heading">
          <h2 id="intern-growth-heading" className="text-xl font-black text-[#183b31]">Growth workspace</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {growthLinks.map(({ label, href, icon: Icon }) => (
              <li key={href} className="min-w-0">
                <Link href={href} className={row}>
                  <Icon size={18} className="shrink-0 text-[#10583f]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words">{label}</span>
                  <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={card} aria-labelledby="intern-feedback-heading">
        <h2 id="intern-feedback-heading" className="text-xl font-black text-[#183b31]">Recent work feedback</h2>
        {feedback.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {feedback.map((comment) => <li key={comment.id} className="break-words py-3 text-sm text-slate-700">{comment.body}</li>)}
          </ul>
        ) : <p className="mt-3 text-sm text-slate-600">No supervisor feedback yet.</p>}
        {!preview ? <div className="mt-4"><AskAvaForm internId={data.intern.id} /></div> : null}
      </section>
      <InternWorkSystemsCard />
    </div>
  );
}
