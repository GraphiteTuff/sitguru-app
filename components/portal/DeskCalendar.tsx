"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, Plus } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import type { ManagerScheduleItem, ManagerScheduleKind } from "@/lib/internship/manager-dashboard";
import { DESK_UI } from "@/lib/portal/desk-ui";

const ZONE = "America/New_York";

const KIND_STYLE: Record<ManagerScheduleKind, { chip: string; dot: string; label: string }> = {
  assignment: { chip: "bg-[#DCFCE7] text-[#166534]", dot: "bg-[#22C55E]", label: "Assignments" },
  "check-in": { chip: "bg-[#EDE9FE] text-[#6D28D9]", dot: "bg-[#8B5CF6]", label: "Check-ins" },
  milestone: { chip: "bg-[#FEE2E2] text-[#BE123C]", dot: "bg-[#EF4444]", label: "Milestones" },
  meeting: { chip: "bg-[#DBEAFE] text-[#1D4ED8]", dot: "bg-[#3B82F6]", label: "Meetings" },
  deadline: { chip: "bg-[#FFEDD5] text-[#C2410C]", dot: "bg-[#F97316]", label: "Deadlines" },
  training: { chip: "bg-[#FEF9C3] text-[#A16207]", dot: "bg-[#EAB308]", label: "Training" },
  event: { chip: "bg-[#D1FAE5] text-[#047857]", dot: "bg-[#10B981]", label: "Community Events" },
};

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONE });
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export default function DeskCalendar({
  events,
  audience,
}: {
  events: ManagerScheduleItem[];
  audience: "manager" | "intern";
}) {
  const manager = audience === "manager";
  const base = manager ? "/manager" : "/intern";
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return { year, month: month - 1 };
  });
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [selected, setSelected] = useState(today);
  const [filters, setFilters] = useState<Record<ManagerScheduleKind, boolean>>({
    assignment: true,
    "check-in": true,
    milestone: true,
    meeting: true,
    deadline: true,
    training: true,
    event: true,
  });

  const visible = events.filter((event) => filters[event.kind]);
  const byDate = useMemo(() => {
    const map = new Map<string, ManagerScheduleItem[]>();
    for (const event of visible) {
      const list = map.get(event.date) || [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const start = new Date(first);
    start.setUTCDate(1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === cursor.month,
      };
    });
  }, [cursor]);

  const weekStart = useMemo(() => {
    const [year, month, day] = selected.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - date.getUTCDay());
    return date.toISOString().slice(0, 10);
  }, [selected]);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const [year, month, day] = weekStart.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return date.toISOString().slice(0, 10);
  });

  const weekEvents = visible.filter((event) => event.date >= today && event.date <= addDays(today, 6));
  const todayEvents = byDate.get(today) || [];
  const counts = {
    events: visible.filter((event) => event.date >= today && event.date <= addDays(today, 6)).length,
    due: visible.filter((event) => event.kind === "deadline" || event.kind === "assignment").filter((event) => event.date >= today && event.date <= addDays(today, 6)).length,
    meetings: visible.filter((event) => event.kind === "meeting" && event.date >= today && event.date <= addDays(today, 6)).length,
    milestones: visible.filter((event) => event.kind === "milestone").length,
  };

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<CalendarDays size={22} />}
        title="Calendar"
        subtitle={
          manager
            ? "Stay organized with intern deadlines, check-ins, meetings, and milestones."
            : "Stay organized with your assignments, meetings, and important dates."
        }
        banner={manager ? "manager" : "intern"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Events This Week" value={counts.events} detail="Assignments, meetings, and deadlines" tone="bg-[#ECFDF5] text-[#047857]" />
        <Stat label="Due This Week" value={counts.due} detail="Assignments and check-ins" tone="bg-[#F5F3FF] text-[#6D28D9]" />
        <Stat label="Meetings" value={counts.meetings} detail="With the team" tone="bg-[#FFF7ED] text-[#C2410C]" />
        <Stat label="Milestones" value={counts.milestones} detail="Coming up on the desk" tone="bg-[#FFF1F2] text-[#BE123C]" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <article className={`${DESK_UI.card} p-3 sm:p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9]" onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9]" onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
              <button type="button" className="rounded-xl bg-[#F1F5F9] px-3 py-2 text-sm font-bold" onClick={() => { const [year, month, day] = today.split("-").map(Number); setCursor({ year, month: month - 1 }); setSelected(today); }}>
                Today
              </button>
              <h2 className="text-lg font-black text-[#0F2744]">{monthLabel(cursor.year, cursor.month)}</h2>
            </div>
            <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-bold">
              {(["month", "week", "day", "list"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setView(mode)} className={`rounded-lg px-3 py-1.5 capitalize ${view === mode ? "bg-[#2563EB] !text-white" : "text-slate-600"}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {view === "month" ? (
            <div className="mt-4">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-slate-100">
                {cells.map((cell) => (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => { setSelected(cell.key); setView("day"); }}
                    className={`min-h-24 bg-white p-1.5 text-left ${cell.inMonth ? "" : "opacity-40"} ${cell.key === today ? "ring-2 ring-inset ring-[#2563EB]" : ""}`}
                  >
                    <span className={`text-xs font-bold ${cell.key === selected ? "text-[#2563EB]" : "text-slate-500"}`}>{cell.day}</span>
                    <span className="mt-1 block space-y-1">
                      {(byDate.get(cell.key) || []).slice(0, 2).map((event) => (
                        <span key={event.id} className={`block truncate rounded-md px-1 py-0.5 text-[10px] font-bold ${KIND_STYLE[event.kind].chip}`}>
                          {event.time ? `${event.time} ` : ""}{event.title}
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {view === "week" ? (
            <div className="mt-4 grid gap-2 md:grid-cols-7">
              {weekDays.map((key) => (
                <button key={key} type="button" onClick={() => { setSelected(key); setView("day"); }} className={`rounded-2xl border p-2 text-left ${key === today ? "border-[#2563EB]" : "border-slate-100"}`}>
                  <span className="text-xs font-bold text-slate-500">{key.slice(8)}</span>
                  {(byDate.get(key) || []).map((event) => (
                    <span key={event.id} className={`mt-1 block rounded-md px-1 py-1 text-[10px] font-bold ${KIND_STYLE[event.kind].chip}`}>{event.title}</span>
                  ))}
                </button>
              ))}
            </div>
          ) : null}

          {view === "day" || view === "list" ? (
            <ul className="mt-4 space-y-2">
              {(view === "day" ? byDate.get(selected) || [] : visible).map((event) => (
                <li key={event.id} className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] px-3 py-3">
                  <span>
                    <span className="block text-sm font-bold text-[#0F2744]">{event.title}</span>
                    <span className="text-xs font-medium text-slate-500">{event.date}{event.time ? ` · ${event.time}` : ""}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${KIND_STYLE[event.kind].chip}`}>{KIND_STYLE[event.kind].label}</span>
                </li>
              ))}
              {!(view === "day" ? byDate.get(selected) || [] : visible).length ? (
                <li className="rounded-2xl bg-slate-50 px-3 py-6 text-sm font-medium text-slate-500">Nothing scheduled here yet.</li>
              ) : null}
            </ul>
          ) : null}
        </article>

        <aside className="space-y-4">
          <Link href={manager ? "/manager/assignments" : "/intern/assignments"} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-bold !text-white">
            <Plus size={16} /> Add Event
          </Link>
          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#0F2744]">Calendar Filters</h2>
              <button type="button" className="text-xs font-bold text-[#2563EB]" onClick={() => setFilters({ assignment: true, "check-in": true, milestone: true, meeting: true, deadline: true, training: true, event: true })}>Reset</button>
            </div>
            <ul className="mt-3 space-y-2">
              {(Object.keys(KIND_STYLE) as ManagerScheduleKind[]).map((kind) => (
                <li key={kind}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={filters[kind]} onChange={() => setFilters((current) => ({ ...current, [kind]: !current[kind] }))} />
                    <span className={`h-2.5 w-2.5 rounded-full ${KIND_STYLE[kind].dot}`} />
                    {KIND_STYLE[kind].label}
                  </label>
                </li>
              ))}
            </ul>
          </article>
          <article className={`${DESK_UI.card} p-4`}>
            <h2 className="text-sm font-black text-[#0F2744]">Upcoming This Week</h2>
            <ul className="mt-3 space-y-2">
              {weekEvents.slice(0, 5).map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="block text-[10px] font-black text-[#DC2626]">{event.date.slice(5)}</span>
                    <span className="font-semibold text-[#0F2744]">{event.title}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${KIND_STYLE[event.kind].chip}`}>{KIND_STYLE[event.kind].label}</span>
                </li>
              ))}
              {!weekEvents.length ? <li className="text-sm text-slate-500">Clear for the next 7 days.</li> : null}
            </ul>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">My Schedule Today</h2>
          <ul className="mt-3 space-y-2">
            {todayEvents.map((event) => (
              <li key={event.id} className="rounded-2xl bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#0F2744]">
                {event.time || "Today"} · {event.title}
              </li>
            ))}
            {!todayEvents.length ? <li className="text-sm font-medium text-slate-500">No desk items today.</li> : null}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Important Dates</h2>
          <ul className="mt-3 space-y-2">
            {visible.filter((event) => event.date >= today).slice(0, 4).map((event) => (
              <li key={event.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0F2744]">{event.title}</span>
                <span className="text-xs font-bold text-slate-500">{event.date.slice(5)}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={`${base}/assignments`} className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-center text-sm font-bold text-[#047857]">View Assignments</Link>
            <Link href={`${base}/milestones`} className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]"><Flag size={14} className="mx-auto" />Milestones</Link>
            <Link href={`${base}/check-ins`} className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">Check-Ins</Link>
            <a href={sitguruTeamsHref()} className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">Sync with Teams</a>
          </div>
        </article>
      </section>
    </div>
  );
}

function Stat({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return (
    <article className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="text-xs font-medium opacity-80">{detail}</p>
    </article>
  );
}

function addDays(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
