"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  Share2,
} from "lucide-react";
import InternAvatar from "@/components/internship/InternAvatar";
import InternshipAssignmentReview from "@/components/internship/InternshipAssignmentReview";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import InternStudentTools from "@/components/internship/InternStudentTools";
import { saveInternCampaign, saveInternContent, saveInternMetric, saveWeeklyReview } from "@/lib/internship/actions";
import { ATTRIBUTION_RULE, METRIC_SOURCE_SYSTEMS } from "@/lib/internship/constants";
import { internStatusLabel, metricSourceLabel } from "@/lib/internship/labels";
import {
  INTERN_HOME_TOOLS,
  INTERN_SOCIAL_PLATFORMS,
  type InternHomeToolId,
  type InternPromoteEvent,
} from "@/lib/internship/intern-tools";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";
import { buildInternshipProcess } from "@/lib/internship/process";
import {
  internCalendarEvents,
  internFirstName,
  internHourPacing,
} from "@/lib/internship/student-dashboard";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "work", label: "Work", icon: ClipboardList },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
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

export default function InternStudentDashboard({
  data,
  events = [],
  notice,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  events?: InternPromoteEvent[];
  notice?: { kind: "ok" | "error"; message: string } | null;
  preview?: boolean;
}) {
  const process = useMemo(() => buildInternshipProcess(data), [data]);
  const calendarEvents = useMemo(() => internCalendarEvents(data), [data]);
  const firstName = internFirstName(data.intern.fullName);
  const todayKey = toDateKey(new Date());
  const [tab, setTab] = useState<TabId>("home");
  const [tool, setTool] = useState<InternHomeToolId | null>(null);
  const [workFilter, setWorkFilter] = useState<WorkFilter>("all");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);

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

  function openTab(next: TabId) {
    setTab(next);
    setTool(null);
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

      <section
        className="public-dark-section overflow-hidden rounded-[1.75rem] p-5 sm:p-6"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <div className="flex items-center gap-4">
          <InternAvatar
            name={data.intern.fullName}
            email={data.intern.email}
            src={data.intern.avatarUrl}
            size="lg"
            className="ring-white/30"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] !text-white/80">
              Intern portal
            </p>
            <h1 className="mt-1 truncate text-2xl font-black !text-white sm:text-3xl">
              Hey, {firstName}
            </h1>
            <p className="mt-1 text-sm font-semibold !text-white/90">
              Week {process.weekNumber} · {process.deliverable.title}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">
            {internStatusLabel(data.intern.status)}
          </span>
          {data.intern.academicProgram ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">
              {data.intern.academicProgram}
            </span>
          ) : null}
          {data.university?.shortName || data.university?.displayName ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">
              {data.university.shortName || data.university.displayName}
            </span>
          ) : null}
        </div>
      </section>

      <div className="hidden gap-2 sm:flex">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openTab(item.id)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black ${
              tab === item.id
                ? "bg-[#0D5C3A] !text-white"
                : "border border-emerald-100 bg-white text-emerald-900"
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                This week
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {process.weeklyThisWeek ? "Logged" : "Due"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Weekly check-in</p>
            </div>
            <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Open work
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">{openWork.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Tasks to finish</p>
            </div>
            <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Metrics
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">{verifiedMetrics.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Verified KPIs</p>
            </div>
            <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Social
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">{data.content.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Posts logged</p>
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-slate-950">Tools</h2>
              <Share2 size={16} className="text-emerald-800" />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Intern-only. No Admin login.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INTERN_HOME_TOOLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTool(item.id)}
                  className="flex min-h-[4.75rem] flex-col items-start justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-left"
                >
                  <span className="text-sm font-black text-slate-950">{item.label}</span>
                  <span className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {item.blurb}
                  </span>
                </button>
              ))}
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
                {pacing.weeksRemaining} weeks left in your approved internship window.
                Pace uses your start and end dates, not a generic semester length.
              </p>
            </section>
          ) : null}

          <section className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Focus
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">
              {process.deliverable.title}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {process.deliverable.demonstrates}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {MARKET_GROWTH_PROJECT_NAME}
            </p>
          </section>

          <section className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-slate-950">Up next</h2>
              <button
                type="button"
                onClick={() => openTab("calendar")}
                className="text-xs font-black text-emerald-800"
              >
                Open calendar
              </button>
            </div>
            {upcoming.length ? (
              <ul className="mt-3 space-y-2">
                {upcoming.map((event) => (
                  <li
                    key={event.id}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-3 py-2"
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
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Nothing dated yet. When tasks get due dates, they show up here and on
                the calendar.
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
                Four short answers. That’s the whole update.
              </p>
              <input type="hidden" name="internId" value={data.intern.id} />
              <input type="hidden" name="mode" value="intern" />
              <input type="hidden" name="weekOf" value={weekOf} />
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
              <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
                <CheckCircle2 size={16} />
                Save check-in
              </button>
            </form>
          ) : process.weeklyThisWeek ? (
            <p className="flex min-h-12 items-center gap-2 rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-900">
              <CheckCircle2 size={16} />
              This week’s check-in is in.
            </p>
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200"
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
                className="min-h-11 rounded-full border border-slate-200 px-3 text-xs font-black"
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200"
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
                  className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-xs font-black ${
                    selected
                      ? "bg-[#0D5C3A] !text-white"
                      : today
                        ? "bg-emerald-50 text-emerald-900"
                        : day.inMonth
                          ? "text-slate-800"
                          : "text-slate-300"
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
            Tasks, social posts, and campaigns live here. Jason grades submitted work in
            Employer HQ — you do not need Admin.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["tasks", "Tasks"],
                ["content", "Social"],
                ["campaigns", "Campaigns"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setWorkFilter(id)}
                className={`inline-flex min-h-11 items-center rounded-2xl px-4 text-xs font-black ${
                  workFilter === id
                    ? "bg-[#0D5C3A] !text-white"
                    : "border border-emerald-100 bg-white text-emerald-900"
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
                  <button className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
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
                  <p className="text-xs font-semibold leading-5 text-slate-500">
                    {ATTRIBUTION_RULE}
                  </p>
                  <button className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
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

      {tab === "metrics" ? (
        <section className="space-y-4">
          <p className="px-1 text-sm font-semibold text-slate-600">
            Letters come from verified KPI output vs your SMART targets — not from
            posting more. Self-reported numbers wait for Jason.
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
                      {metric.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {metric.valueNumeric ?? "—"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Source: {metricSourceLabel(metric.sourceSystem)}
                    {metric.selfReported ? " · intern-submitted" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
              No metrics yet. Submit a number from an approved source.
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
              <h3 className="font-black text-slate-950">Submit metric for verification</h3>
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
              <p className="text-xs font-semibold text-amber-800">
                Self-reported until Jason verifies it from a SitGuru-controlled source.
              </p>
              <p className="text-xs font-semibold leading-5 text-slate-500">{ATTRIBUTION_RULE}</p>
              <button className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
                Submit metric
              </button>
            </form>
          )}
        </section>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openTab(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-black ${
                tab === item.id ? "bg-emerald-50 text-emerald-900" : "text-slate-500"
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
