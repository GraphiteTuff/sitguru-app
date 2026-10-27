"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  GraduationCap,
  Home,
  Link2,
  MapPinned,
  Megaphone,
  Palette,
  Share2,
  MoreHorizontal,
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
} from "@/lib/internship/student-dashboard";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import { groupWorkload } from "@/lib/internship/workload";
import { isWeekZeroReady } from "@/lib/internship/week-zero";
import InternHoursPanel from "@/components/internship/InternHoursPanel";
import InternWeekZeroCard from "@/components/internship/InternWeekZeroCard";
import AskAvaForm from "@/components/internship/AskAvaForm";
import {
  internPortalFirstName,
  internPortalHeroClass,
} from "@/lib/internship/portal";
import { INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";
import {
  INTERN_OPEN_PAGE_EVENT,
  internGhostBtnClass,
  internPageHashActive,
  internPillBtnClass,
  internPressClass,
  internPrimaryBtnClass,
} from "@/lib/internship/intern-ui";
import {
  isSitGuruWorkEmail,
  sitguruTeamsHref,
} from "@/lib/admin/growth/teams-access";
import InternPortalHome from "@/components/internship/InternPortalHome";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "home", label: "Home", icon: Home, active: "bg-emerald-700 !text-white", chip: "bg-emerald-50 text-emerald-900" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, active: "bg-sky-600 !text-white", chip: "bg-sky-50 text-sky-900" },
  { id: "work", label: "Work", icon: ClipboardList, active: "bg-violet-600 !text-white", chip: "bg-violet-50 text-violet-900" },
  { id: "project", label: "Report", icon: BookOpen, active: "bg-[#166534] !text-white", chip: "bg-emerald-50 text-emerald-900" },
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
  initialProfileOpen = false,
}: {
  data: InternshipWorkspaceData;
  events?: InternPromoteEvent[];
  notice?: { kind: "ok" | "error"; message: string } | null;
  preview?: boolean;
  initialTab?: string;
  initialTool?: string | null;
  initialWorkFilter?: string;
  initialDate?: string;
  initialProfileOpen?: boolean;
}) {
  const router = useRouter();
  const process = useMemo(() => buildInternshipProcess(data), [data]);
  const calendarEvents = useMemo(() => internCalendarEvents(data), [data]);
  const firstName = internPortalFirstName(data.intern);
  const todayKey = toDateKey(new Date());
  const startDate = dateFromKey(initialDate);
  const [tab, setTab] = useState<TabId>(isTabId(initialTab) ? initialTab : "home");
  const [profileOpen, setProfileOpen] = useState(initialProfileOpen);
  const [tool, setTool] = useState<InternHomeToolId | null>(
    isHomeTool(initialTool) ? initialTool : null,
  );
  const [workFilter, setWorkFilter] = useState<WorkFilter>(
    isWorkFilter(initialWorkFilter) ? initialWorkFilter : "all",
  );
  const [calendarMonth, setCalendarMonth] = useState(() => startDate || new Date());
  const [selectedDate, setSelectedDate] = useState(startDate ? toDateKey(startDate) : todayKey);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    function openInternPage() {
      setTab("home");
      setTool(null);
      setProfileOpen(true);
      if (internPageHashActive()) {
        window.history.replaceState(null, "", "/intern");
      }
    }

    function onHash() {
      if (internPageHashActive()) openInternPage();
    }

    onHash();
    window.addEventListener("hashchange", onHash);
    window.addEventListener(INTERN_OPEN_PAGE_EVENT, openInternPage);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(INTERN_OPEN_PAGE_EVENT, openInternPage);
    };
  }, []);

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
  const verifiedMetrics = data.metrics.filter((metric) => metric.isVerified);
  const weekZeroReady = isWeekZeroReady({
    completedKeys: data.startChecks || [],
    approvedAt: data.intern.weekZeroApprovedAt,
  });
  const hourSummary = summarizeInternshipHours({
    requiredHours: data.intern.requiredHours,
    requirementStatus: data.intern.requirementStatus,
    plannedWeeklyHours: data.intern.plannedWeeklyHours,
    internshipWeeks: data.intern.internshipWeeks,
    startDate: data.intern.academicStartDate || data.cohort?.startsOn || null,
    entries: (data.timeLogs || []).map((row) => ({
      workedOn: row.workedOn,
      hours: row.hours,
      status: row.status,
      weekNumber: row.weekNumber,
    })),
    exceptions: data.scheduleExceptions,
    weekZeroReady,
    internshipStatus: data.intern.status,
  });
  const focusWeek = hourSummary.weekNumber;
  const workload = groupWorkload(data.tasks, focusWeek);
  const returnedWork = data.tasks.filter((task) => task.status === "revision_requested" || task.reviewStage === "changes_requested");
  const waitingOnAva = data.tasks.filter((task) => task.status === "submitted" || task.reviewStage === "submitted_to_ava").length
    + data.content.filter((item) => item.status === "submitted" || item.reviewStage === "submitted_to_ava").length
    + (data.weeklyReviews || []).filter((row) => row.reviewStatus === "submitted_to_ava").length;
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
    <div className="space-y-4 pb-28 xl:pb-8">
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

      {tab !== "home" ? (
      <article className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div
          className="flex min-h-[5.5rem] items-end gap-4 px-5 pb-3 sm:px-6"
          data-brand-green
          style={{
            background:
              "linear-gradient(120deg,#1e3a5f 0%,#334e68 42%,#166534 100%)",
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
      ) : null}

      {tab === "home" && !tool ? (
        <InternPortalHome
          data={data}
          hourSummary={hourSummary}
          firstName={firstName}
          weeklyDone={Boolean(process.weeklyThisWeek)}
          currentAssignmentTitle={
            data.tasks.find((task) => task.status === "in_progress" || task.status === "submitted")?.title ||
            process.deliverable.title
          }
          preview={preview}
          onOpenWork={() => router.push("/intern/work")}
          onOpenCheckIn={() => router.push("/intern/check-ins")}
          onOpenHours={() => router.push("/intern/time")}
          onOpenMilestones={() => router.push("/intern/milestones")}
        />
      ) : null}

      {tab !== "home" ? (
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
      ) : null}

      {tab === "home" && tool ? (
        <InternStudentTools
          data={data}
          events={events}
          tool={tool}
          onBack={() => setTool(null)}
          preview={preview}
        />
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
              {isSitGuruWorkEmail(data.intern.email) ||
              isSitGuruWorkEmail(data.intern.studentEmail) ? (
                <a
                  href={sitguruTeamsHref()}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
                >
                  Marketing & Community Growth · Open in Teams
                </a>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Microsoft Teams (teams.cloud.microsoft) is for SitGuru work
                  accounts (@sitguru.com). Your manager will share channel access.
                </p>
              )}
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
                      ? "bg-[#166534] !text-white"
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
              ([
                ["Current week", workload.current, true],
                ["Next 2 weeks", workload.upcoming, false],
                ["Later this semester", workload.later, false],
              ] as const).map(([label, items, open]) => (
                <details key={label} open={open} className="rounded-[1.4rem] border border-violet-100 bg-white p-3">
                  <summary className="cursor-pointer list-none min-h-11 text-sm font-black text-slate-950">
                    {label} · {items.length}
                  </summary>
                  <div className="mt-3 space-y-3">
                    {items.length ? items.map((task) => (
                      <InternshipAssignmentReview
                        key={task.id}
                        internId={data.intern.id}
                        mode="intern"
                        itemType="task"
                        id={task.id}
                        title={task.title}
                        status={task.status}
                        reviewStage={task.reviewStage}
                        workUrl={task.workUrl}
                        studentNotes={task.studentNotes}
                        supervisorNotes={task.supervisorNotes}
                        employerLetter={task.employerLetter}
                        kpiTier={task.kpiTier}
                        comments={data.comments || []}
                        attachments={data.attachments || []}
                        preview={preview}
                        intern={data.intern}
                        task={task}
                        metrics={data.metrics || []}
                        smartGoals={data.smartGoals || []}
                        experiments={data.experiments || []}
                      />
                    )) : (
                      <p className="text-sm font-semibold text-slate-500">Nothing in this group.</p>
                    )}
                  </div>
                </details>
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

      
    </div>
  );
}
