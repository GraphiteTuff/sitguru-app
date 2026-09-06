"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Home,
  Link2,
  MapPinned,
  Megaphone,
  Palette,
  Share2,
} from "lucide-react";
import InternAvatar from "@/components/internship/InternAvatar";
import InternKpiBoard from "@/components/internship/InternKpiBoard";
import InternshipAssignmentReview from "@/components/internship/InternshipAssignmentReview";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import InternStudentTools from "@/components/internship/InternStudentTools";
import InternProfileCard, {
  InternPageTrigger,
} from "@/components/internship/InternProfileCard";
import InternWorkAttachments from "@/components/internship/InternWorkAttachments";
import InternshipFinalProjectBoard, {
  FinalSectionSelect,
} from "@/components/internship/InternshipFinalProjectBoard";
import { ThemeStatCard } from "@/components/sitguru/ThemeStatCard";
import { saveInternCampaign, saveInternContent, saveInternMetric, saveWeeklyReview } from "@/lib/internship/actions";
import { ATTRIBUTION_RULE, METRIC_SOURCE_SYSTEMS } from "@/lib/internship/constants";
import {
  academicLevelLabel,
  internStatusLabel,
  metricSourceLabel,
} from "@/lib/internship/labels";
import {
  INTERN_HOME_TOOLS,
  INTERN_GROWTH_WORKPLACE,
  INTERN_SOCIAL_PLATFORMS,
  internSchoolEmphasis,
  type InternHomeToolId,
  type InternPromoteEvent,
} from "@/lib/internship/intern-tools";
import {
  assembleBusinessGrowthReport,
  assembleFinalProjectWorkspace,
  defaultFinalSectionForWeek,
} from "@/lib/internship/final-project";
import { buildInternshipProcess } from "@/lib/internship/process";
import {
  internCalendarEvents,
  internHourPacing,
} from "@/lib/internship/student-dashboard";
import {
  internPortalFirstName,
  internPortalHeroClass,
} from "@/lib/internship/portal";
import {
  internGhostBtnClass,
  internPillBtnClass,
  internPressClass,
  internPrimaryBtnClass,
} from "@/lib/internship/intern-ui";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

const TABS = [
  { id: "home", label: "Home", icon: Home, active: "bg-emerald-700 !text-white", chip: "bg-emerald-50 text-emerald-900" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, active: "bg-sky-600 !text-white", chip: "bg-sky-50 text-sky-900" },
  { id: "work", label: "Work", icon: ClipboardList, active: "bg-violet-600 !text-white", chip: "bg-violet-50 text-violet-900" },
  { id: "project", label: "Report", icon: BookOpen, active: "bg-[#0D5C3A] !text-white", chip: "bg-emerald-50 text-emerald-900" },
  { id: "metrics", label: "Metrics", icon: BarChart3, active: "bg-amber-500 !text-white", chip: "bg-amber-50 text-amber-900" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type WorkFilter = "all" | "tasks" | "content" | "campaigns";

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthGrid(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function kindLabel(kind: string) {
  if (kind === "task") return "Task";
  if (kind === "content") return "Content";
  if (kind === "milestone") return "Milestone";
  return "Check-in";
}

function Field({
  name,
  label,
  placeholder,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
      />
    </label>
  );
}

function isTabId(value: string | null | undefined): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isWorkFilter(value: string | null | undefined): value is WorkFilter {
  return value === "all" || value === "tasks" || value === "content" || value === "campaigns";
}

function isHomeTool(value: string | null | undefined): value is InternHomeToolId {
  return INTERN_HOME_TOOLS.some((tool) => tool.id === value);
}

function dateFromKey(value: string | null | undefined) {
  const key = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = new Date(`${key}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function InternStudentDashboard({
  data,
  events = [],
  notice,
  preview = false,
  initialTab,
  initialTool,
  initialWorkFilter,
  initialDate,
}: {
  data: InternshipWorkspaceData;
  events?: InternPromoteEvent[];
  notice?: { kind: "ok" | "error"; message: string } | null;
  preview?: boolean;
  initialTab?: string;
  initialTool?: string | null;
  initialWorkFilter?: string;
  initialDate?: string;
}) {
  const process = useMemo(() => buildInternshipProcess(data), [data]);
  const calendarEvents = useMemo(() => internCalendarEvents(data), [data]);
  const firstName = internPortalFirstName(data.intern);
  const todayKey = toDateKey(new Date());
  const startDate = dateFromKey(initialDate);
  const [tab, setTab] = useState<TabId>(isTabId(initialTab) ? initialTab : "home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [tool, setTool] = useState<InternHomeToolId | null>(
    isHomeTool(initialTool) ? initialTool : null,
  );
  const [workFilter, setWorkFilter] = useState<WorkFilter>(
    isWorkFilter(initialWorkFilter) ? initialWorkFilter : "all",
  );
  const [calendarMonth, setCalendarMonth] = useState(() => startDate || new Date());
  const [selectedDate, setSelectedDate] = useState(startDate ? toDateKey(startDate) : todayKey);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof calendarEvents>();
    for (const event of calendarEvents) {
      const list = map.get(event.date) || [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [calendarEvents]);

  const selectedEvents = eventsByDate.get(selectedDate) || [];
  const upcoming = calendarEvents.filter((event) => event.date >= todayKey).slice(0, 4);
  const openWork = data.tasks.filter(
    (task) => !["approved", "not_accepted"].includes(task.status),
  );
  const verifiedMetrics = data.metrics.filter((metric) => metric.isVerified);
  const pacing = internHourPacing({
    requiredHours: data.intern.requiredHours,
    startDate: data.intern.academicStartDate || data.cohort?.startsOn || null,
    endDate: data.intern.academicEndDate || data.cohort?.endsOn || null,
  });
  const weekOf = (() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return toDateKey(start);
  })();
  const days = monthGrid(calendarMonth);
  const showTasks = workFilter === "all" || workFilter === "tasks";
  const showContent = workFilter === "all" || workFilter === "content";
  const showCampaigns = workFilter === "all" || workFilter === "campaigns";
  const thisWeekReview = data.weeklyReviews.find((row) => row.weekOf >= weekOf);
  const school = internSchoolEmphasis({
    university: data.university,
    campus: data.campus,
    intern: data.intern,
    cohort: data.cohort,
  });
  const finalProject = useMemo(() => assembleFinalProjectWorkspace(data), [data]);
  const growthReport = useMemo(
    () => assembleBusinessGrowthReport(finalProject),
    [finalProject],
  );
  const toolIcons = {
    brand: Palette,
    tracking: Link2,
    snapshot: MapPinned,
    events: CalendarDays,
    social: Share2,
  } as const;

  function openTab(next: TabId) {
    setTab(next);
    setTool(null);
  }

  function openTool(id: InternHomeToolId) {
    setTab("home");
    setTool(id);
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <article className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div
          className="flex min-h-[5.5rem] items-end gap-4 px-5 pb-3 sm:px-6"
          data-brand-green
          style={{
            background:
              "linear-gradient(120deg,#1e3a5f 0%,#334e68 42%,#0D5C3A 100%)",
          }}
        >
          {school.logoUrl ? (
            <span className="mb-1 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img
                src={school.logoUrl}
                alt={`${school.school} logo`}
                className="h-full w-full object-contain p-1 mix-blend-multiply"
              />
            </span>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-white/85">
            Your school
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1.2fr_0.8fr] sm:p-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-800">
              Your school
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {school.school}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {[school.campus, school.place].filter(Boolean).join(" · ") ||
                "School on your intern assignment"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {school.program ? (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-900">
                  {school.program}
                </span>
              ) : null}
              {school.courseCode ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                  {school.courseCode}
                </span>
              ) : null}
              {school.semester ? (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-900">
                  {school.semester}
                </span>
              ) : null}
              {school.level ? (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-900">
                  {academicLevelLabel(school.level)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-indigo-100 bg-[#FAF6EE] p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-800">
              <GraduationCap size={14} />
              Hours & credits
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {school.hours ? `${school.hours} hours` : "Hours pending"}
              {school.credits != null ? ` · ${school.credits} credits` : ""}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              SitGuru runs this internship. Your school counts the credits and hours.
              {school.partner ? " This school is a SitGuru university partner." : ""}
            </p>
          </div>
        </div>
      </article>

      {tab === "home" && !tool ? (
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className={`grid gap-6 px-5 py-6 sm:px-6 sm:py-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center ${internPortalHeroClass(data.intern.portalTheme)}`}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
                SitGuru Intern Portal
              </span>
              <span className="rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] !text-white">
                Your work area
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm">
                {internStatusLabel(data.intern.status)}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <InternAvatar
                name={data.intern.fullName}
                email={data.intern.email}
                src={data.intern.avatarUrl}
                size="lg"
                className="ring-white/70"
                onClick={() => setProfileOpen(true)}
                label="Open intern page"
              />
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  Welcome, {firstName}.
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Week {process.weekNumber} · {process.deliverable.title}
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-800">
              Do your weekly check-in, finish tasks, and grow SitGuru this week.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <InternPageTrigger onOpen={() => setProfileOpen(true)} />
              <Link
                href={INTERN_GROWTH_WORKPLACE.href}
                className={`${internPrimaryBtnClass} rounded-full min-h-11 px-4`}
              >
                <Megaphone size={14} />
                {INTERN_GROWTH_WORKPLACE.label}
              </Link>
              <button
                type="button"
                onClick={() => openTool("social")}
                className={`${internPillBtnClass} bg-rose-600 !text-white shadow-sm hover:bg-rose-700`}
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => openTool("tracking")}
                className={`${internPillBtnClass} bg-white text-sky-800 shadow-sm ring-1 ring-sky-200 hover:bg-sky-50`}
              >
                Tracking links
              </button>
              <button
                type="button"
                onClick={() => openTab("work")}
                className={`${internPillBtnClass} bg-white text-violet-800 shadow-sm ring-1 ring-violet-200 hover:bg-violet-50`}
              >
                Do your work
              </button>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-white/80 bg-white/95 p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Today’s focus
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              {process.deliverable.title}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {process.deliverable.demonstrates}
            </p>
            <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                {process.weeklyThisWeek ? "Check-in is done" : "Do your weekly check-in"}
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-700" />
                {openWork.length} tasks still open
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-rose-700" />
                {data.content.length} social posts logged
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-bold leading-5 text-emerald-900">
              Your report is {growthReport.percent}% done ·{" "}
              {growthReport.outcomes.length} checked results ·{" "}
              {growthReport.lessons.length} lessons
            </p>
            <button
              type="button"
              onClick={() => openTab("project")}
              className={`mt-3 text-left text-xs font-black text-emerald-800 underline hover:text-emerald-950 ${internPressClass} shadow-none hover:shadow-none`}
            >
              Open your report
            </button>
          </div>
        </div>
      </section>
      ) : null}

      <div className="hidden gap-2 sm:flex">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openTab(item.id)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black ${internPressClass} ${
              tab === item.id
                ? item.active
                : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "home" && tool ? (
        <InternStudentTools
          data={data}
          events={events}
          tool={tool}
          onBack={() => setTool(null)}
          preview={preview}
        />
      ) : null}

      {tab === "home" && !tool ? (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              type="button"
              onClick={() => openTab("home")}
              className={`w-full border-0 bg-transparent p-0 text-left ${internPressClass}`}
              aria-label="Open this week’s check-in"
            >
              <ThemeStatCard
                label="This week"
                value={process.weeklyThisWeek ? "Done" : "Due"}
                helper={process.weeklyThisWeek ? "Check-in is in" : "Do your weekly check-in"}
                tone="emerald"
                icon={<CheckCircle2 size={18} />}
                className="h-full"
              />
            </button>
            <button
              type="button"
              onClick={() => openTab("work")}
              className={`w-full border-0 bg-transparent p-0 text-left ${internPressClass}`}
              aria-label="Open your work"
            >
              <ThemeStatCard
                label="Open work"
                value={openWork.length}
                helper="Tasks to do"
                tone="violet"
                icon={<ClipboardList size={18} />}
                className="h-full"
              />
            </button>
            <button
              type="button"
              onClick={() => openTab("metrics")}
              className={`w-full border-0 bg-transparent p-0 text-left ${internPressClass}`}
              aria-label="Open metrics"
            >
              <ThemeStatCard
                label="Metrics"
                value={verifiedMetrics.length}
                helper="Numbers SitGuru checked"
                tone="amber"
                icon={<BarChart3 size={18} />}
                className="h-full"
              />
            </button>
            <button
              type="button"
              onClick={() => openTool("social")}
              className={`w-full border-0 bg-transparent p-0 text-left ${internPressClass}`}
              aria-label="Open social posts"
            >
              <ThemeStatCard
                label="Social"
                value={data.content.length}
                helper="Posts you’ve logged"
                tone="rose"
                icon={<Share2 size={18} />}
                className="h-full"
              />
            </button>
          </section>

          <InternKpiBoard internId={data.intern.id} />

          <section className="overflow-hidden rounded-[1.8rem] border border-emerald-200 bg-white shadow-sm">
            <span className="block h-2.5 w-full bg-[#0D5C3A]" />
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                  Your campaign workspace
                </p>
                <h2 className="mt-1 font-black text-slate-950">
                  {INTERN_GROWTH_WORKPLACE.label}
                </h2>
                <p className="mt-1 max-w-xl text-sm font-semibold text-slate-600">
                  {INTERN_GROWTH_WORKPLACE.blurb}
                </p>
              </div>
              <Link
                href={INTERN_GROWTH_WORKPLACE.href}
                className={`${internPrimaryBtnClass} shrink-0`}
              >
                Open workplace
              </Link>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                  Quick tools
                </p>
                <h2 className="mt-1 font-black text-slate-950">Intern toolkit</h2>
              </div>
              <p className="text-xs font-semibold text-slate-500">Tap a card to open it</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {INTERN_HOME_TOOLS.map((item) => {
                const Icon = toolIcons[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    className={`overflow-hidden rounded-[1.4rem] border text-left shadow-sm ${item.tile} ${internPressClass}`}
                  >
                    <span className={`block h-2.5 w-full ${item.bar}`} />
                    <span className="flex min-h-[5.25rem] flex-col items-start justify-center gap-2 px-3 py-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl !text-white ${item.bar}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-950">
                          {item.label}
                        </span>
                        <span className={`mt-0.5 block text-[11px] font-semibold ${item.ink}`}>
                          {item.blurb}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {pacing ? (
            <section className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Hour pace
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {pacing.requiredHours} hours · {pacing.requiredWeeklyPace}/week
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                You have {pacing.weeksRemaining} weeks left. Hit this weekly number so
                you finish your hours on time.
              </p>
            </section>
          ) : null}

          <section className="rounded-[1.4rem] border border-sky-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-slate-950">Up next</h2>
              <button
                type="button"
                onClick={() => openTab("calendar")}
                className={`${internGhostBtnClass} min-h-10 px-3 text-xs`}
              >
                Open calendar
              </button>
            </div>
            {upcoming.length ? (
              <ul className="mt-3 space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        openTab("calendar");
                        setSelectedDate(event.date);
                        setCalendarMonth(new Date(`${event.date}T12:00:00`));
                      }}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-3 py-2 text-left hover:bg-emerald-100 ${internPressClass}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {event.title}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {kindLabel(event.kind)} · {event.date}
                        </p>
                      </div>
                      {event.status ? (
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-emerald-800">
                          {event.status.replaceAll("_", " ")}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                No due dates yet. When SitGuru assigns dates, they show up here.
              </p>
            )}
          </section>

          {!process.weeklyThisWeek && !preview ? (
            <form
              action={saveWeeklyReview}
              className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
            >
              <h2 className="font-black text-slate-950">This week’s check-in</h2>
              <p className="text-sm font-semibold text-slate-500">
                Tell SitGuru what you finished this week. Be specific — this goes in
                your report.
              </p>
              <input type="hidden" name="internId" value={data.intern.id} />
              <input type="hidden" name="mode" value="intern" />
              <input type="hidden" name="weekOf" value={weekOf} />
              <FinalSectionSelect defaultValue={defaultFinalSectionForWeek(process.weekNumber)} />
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  What did you add or improve this week?
                </span>
                <textarea
                  name="contributionAdded"
                  required
                  rows={3}
                  placeholder="What you shipped, who it reached, and what you learned."
                  className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold text-slate-950"
                />
              </label>
              {[
                ["accomplished", "What did you finish?"],
                ["dataShowed", "What did the numbers show?"],
                ["didntWork", "What didn’t work?"],
                ["changingNextWeek", "What’s next?"],
              ].map(([name, label]) => (
                <label key={name} className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                    {label}
                  </span>
                  <textarea
                    name={name}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold text-slate-950"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Your number (SitGuru will check it)
                </span>
                <input
                  name="internReportedKpi"
                  placeholder="Example: 27 Pet Parent signups"
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
                />
              </label>
              <button className={`${internPrimaryBtnClass} w-full`}>
                <CheckCircle2 size={16} />
                Send this week to SitGuru
              </button>
            </form>
          ) : process.weeklyThisWeek ? (
            <div className="space-y-3">
              <p className="flex min-h-12 items-center gap-2 rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-900">
                <CheckCircle2 size={16} />
                This week’s check-in is done.
              </p>
              <article className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
                <InternWorkAttachments
                  internId={data.intern.id}
                  itemType="weekly"
                  itemId={thisWeekReview?.id || weekOf}
                  attachments={data.attachments || []}
                  preview={preview}
                  label="This week’s evidence"
                />
              </article>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "calendar" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Your calendar
              </p>
              <h2 className="text-xl font-black text-slate-950">
                {calendarMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                  )
                }
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 ${internPressClass}`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCalendarMonth(now);
                  setSelectedDate(toDateKey(now));
                }}
                className={`${internGhostBtnClass} min-h-11 rounded-full px-3 text-xs`}
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                  )
                }
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 ${internPressClass}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const count = eventsByDate.get(day.key)?.length || 0;
              const selected = day.key === selectedDate;
              const today = day.key === todayKey;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDate(day.key)}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-xs font-black ${internPressClass} ${
                    selected
                      ? "bg-[#0D5C3A] !text-white"
                      : today
                        ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        : day.inMonth
                          ? "text-slate-800 hover:bg-emerald-50"
                          : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {day.date.getDate()}
                  {count ? (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        selected ? "bg-white" : "bg-emerald-600"
                      }`}
                    />
                  ) : (
                    <span className="mt-0.5 h-1.5 w-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm font-black text-slate-950">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            {selectedEvents.length ? (
              <ul className="mt-3 space-y-2">
                {selectedEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-2xl border border-emerald-100 px-3 py-3"
                  >
                    <p className="text-sm font-black text-slate-950">{event.title}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {kindLabel(event.kind)}
                      {event.status ? ` · ${event.status.replaceAll("_", " ")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Free day. Tap another date or add due dates on your work.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {tab === "work" ? (
        <section className="space-y-3">
          <p className="px-1 text-sm font-semibold text-slate-600">
            Open a task, add proof, then send it to SitGuru.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All", "bg-emerald-700 !text-white", "border-emerald-200 text-emerald-900"],
                ["tasks", "Tasks", "bg-violet-600 !text-white", "border-violet-200 text-violet-900"],
                ["content", "Social", "bg-rose-600 !text-white", "border-rose-200 text-rose-900"],
                ["campaigns", "Campaigns", "bg-sky-600 !text-white", "border-sky-200 text-sky-900"],
              ] as const
            ).map(([id, label, on, off]) => (
              <button
                key={id}
                type="button"
                onClick={() => setWorkFilter(id)}
                className={`inline-flex min-h-11 items-center rounded-2xl px-4 text-xs font-black ${internPressClass} ${
                  workFilter === id ? on : `border bg-white ${off} hover:bg-emerald-50`
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showTasks ? (
            data.tasks.length ? (
              data.tasks.map((task) => (
                <InternshipAssignmentReview
                  key={task.id}
                  internId={data.intern.id}
                  mode="intern"
                  itemType="task"
                  id={task.id}
                  title={task.title}
                  status={task.status}
                  workUrl={task.workUrl}
                  studentNotes={task.studentNotes}
                  supervisorNotes={task.supervisorNotes}
                  employerLetter={task.employerLetter}
                  kpiTier={task.kpiTier}
                  comments={data.comments || []}
                  attachments={data.attachments || []}
                  preview={preview}
                />
              ))
            ) : workFilter === "tasks" ? (
              <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
                No assignments yet. Your supervisor will drop work here.
              </p>
            ) : null
          ) : null}

          {showContent ? (
            <>
              {data.content.length ? (
                data.content.map((item) => (
                  <InternshipAssignmentReview
                    key={item.id}
                    internId={data.intern.id}
                    mode="intern"
                    itemType="content"
                    id={item.id}
                    title={item.platform ? `${item.platform}: ${item.title}` : item.title}
                    status={item.status}
                    draftUrl={item.draftUrl}
                    publishedUrl={item.publishedUrl}
                    studentNotes={item.studentNotes}
                    supervisorNotes={item.supervisorNotes}
                    employerLetter={item.employerLetter}
                    kpiTier={item.kpiTier}
                    comments={data.comments || []}
                    attachments={data.attachments || []}
                    preview={preview}
                  />
                ))
              ) : workFilter === "content" ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
                  No social posts yet. Log one below or from Home → Social media.
                </p>
              ) : null}
              {!preview && (workFilter === "content" || workFilter === "all") ? (
                <form
                  action={saveInternContent}
                  className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
                >
                  <h3 className="font-black text-slate-950">Log a social post</h3>
                  <input type="hidden" name="internId" value={data.intern.id} />
                  <input type="hidden" name="mode" value="intern" />
                  <Field name="title" label="Title" required />
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                      Platform
                    </span>
                    <select
                      name="platform"
                      required
                      defaultValue="Instagram"
                      className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
                    >
                      {INTERN_SOCIAL_PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field name="draftUrl" label="Draft link" />
                  <Field name="publishedUrl" label="Published link" />
                  <FinalSectionSelect defaultValue="content_system" />
                  <button className={`${internPrimaryBtnClass} w-full`}>
                    Save social post
                  </button>
                </form>
              ) : null}
            </>
          ) : null}

          {showCampaigns ? (
            <>
              {data.campaigns.length ? (
                data.campaigns.map((campaign) => (
                  <article
                    key={campaign.id}
                    className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
                  >
                    <h3 className="font-black text-slate-950">{campaign.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {campaign.utmSource && campaign.utmCampaign
                        ? `utm_source=${campaign.utmSource}&utm_campaign=${campaign.utmCampaign}`
                        : "Add tracking before counting results"}
                    </p>
                    {campaign.trackingUrl ? (
                      <p className="mt-2 break-all text-sm font-semibold text-emerald-800">
                        {campaign.trackingUrl}
                      </p>
                    ) : null}
                    {campaign.objective ? (
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {campaign.objective}
                      </p>
                    ) : null}
                    <InternWorkAttachments
                      internId={data.intern.id}
                      itemType="campaign"
                      itemId={campaign.id}
                      attachments={data.attachments || []}
                      preview={preview}
                    />
                  </article>
                ))
              ) : workFilter === "campaigns" ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
                  No campaigns yet. Create a tracking link below.
                </p>
              ) : null}
              {!preview && (workFilter === "campaigns" || workFilter === "all") ? (
                <form
                  action={saveInternCampaign}
                  className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
                >
                  <h3 className="font-black text-slate-950">New campaign</h3>
                  <input type="hidden" name="internId" value={data.intern.id} />
                  <input type="hidden" name="mode" value="intern" />
                  <Field name="name" label="Campaign name" required />
                  <Field name="utmSource" label="utm_source" placeholder="instagram" />
                  <Field name="utmCampaign" label="utm_campaign" placeholder="spring27_growth" />
                  <Field name="referralCode" label="Referral code" />
                  <Field name="objective" label="Business objective" />
                  <FinalSectionSelect defaultValue={defaultFinalSectionForWeek(process.weekNumber)} />
                  <p className="text-xs font-semibold leading-5 text-slate-500">
                    {ATTRIBUTION_RULE}
                  </p>
                  <button className={`${internPrimaryBtnClass} w-full`}>
                    Save campaign
                  </button>
                </form>
              ) : null}
            </>
          ) : null}

          {!data.tasks.length && !data.content.length && !data.campaigns.length ? (
            <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
              Your work will show here — tasks, social posts, and tracking campaigns.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "project" ? (
        <InternshipFinalProjectBoard
          data={data}
          weekNumber={process.weekNumber}
          mode="intern"
          preview={preview}
        />
      ) : null}

      {tab === "metrics" ? (
        <section className="space-y-4">
          <InternKpiBoard internId={data.intern.id} />
          <p className="px-1 text-sm font-semibold text-slate-600">
            SitGuru checks these numbers. Your own counts stay pending until they confirm them.
          </p>
          <InternshipKpiLetterBoard data={data} />
          {data.metrics.length ? (
            <ul className="space-y-2">
              {data.metrics.map((metric) => (
                <li
                  key={metric.id}
                  className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-950">{metric.label}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        metric.isVerified
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {metric.isVerified ? "SitGuru checked" : "Waiting"}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {metric.valueNumeric ?? "—"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Source: {metricSourceLabel(metric.sourceSystem)}
                    {metric.selfReported ? " · you sent this" : ""}
                  </p>
                  <InternWorkAttachments
                    internId={data.intern.id}
                    itemType="metric"
                    itemId={metric.id}
                    attachments={data.attachments || []}
                    preview={preview}
                    label="Source files"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
              No numbers yet. Send one from an approved SitGuru source.
            </p>
          )}
          {preview ? (
            <p className="rounded-[1.4rem] border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Preview is view-only. Interns submit metrics here.
            </p>
          ) : (
            <form
              action={saveInternMetric}
              className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
            >
              <h3 className="font-black text-slate-950">Send a number for SitGuru to check</h3>
              <input type="hidden" name="internId" value={data.intern.id} />
              <input type="hidden" name="mode" value="intern" />
              <Field
                name="label"
                label="Metric"
                required
                placeholder="Pet Parent registrations"
              />
              <Field name="metricKey" label="Metric key" placeholder="pet_parent_signups" />
              <Field name="valueNumeric" label="Value" type="number" />
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Approved source
                </span>
                <select
                  name="sourceSystem"
                  required
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
                >
                  {METRIC_SOURCE_SYSTEMS.map((source) => (
                    <option key={source} value={source}>
                      {metricSourceLabel(source)}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="sourceNote" label="Source note / report link" />
              <FinalSectionSelect defaultValue="analytics_attribution" />
              <p className="text-xs font-semibold text-amber-800">
                SitGuru will check this against their own data before it counts.
              </p>
              <p className="text-xs font-semibold leading-5 text-slate-500">{ATTRIBUTION_RULE}</p>
              <button className={`${internPrimaryBtnClass} w-full`}>
                Send number
              </button>
            </form>
          )}
        </section>
      ) : null}

      <InternProfileCard
        intern={data.intern}
        preview={preview}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openTab(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-black ${internPressClass} ${
                tab === item.id ? item.chip : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
