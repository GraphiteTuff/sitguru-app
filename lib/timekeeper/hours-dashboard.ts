import {
  approvedHours,
  creditBearingHours,
  roundHours,
  semesterPace,
  timeReportCsv,
} from "@/lib/timekeeper/domain";

export type DashboardEntry = {
  id: string;
  workedOn: string;
  hours: number;
  status: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  weekNumber: number | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  "audience-research": "#7C3AED",
  "content-social": "#2563EB",
  campaigns: "#DB2777",
  analytics: "#0D9488",
  "community-events": "#EA580C",
  partnerships: "#16A34A",
  ambassador: "#F59E0B",
  "meetings-training": "#64748B",
  "final-project": "#0D5C3A",
  "other-internship": "#94A3B8",
};

export function hoursStatusLabel(status: string) {
  if (status === "founder_approved" || status === "locked") return "Approved";
  if (status === "manager_recommended") return "Manager review";
  if (status === "submitted") return "Submitted";
  if (status === "returned") return "Returned";
  if (status === "running") return "Running";
  return "Draft";
}

export function hoursAreApproved(status: string) {
  return status === "founder_approved" || status === "locked";
}

function parseDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function weekNumberForDate(startDate: string | null, workedOn: string) {
  const start = startDate ? parseDay(startDate) : null;
  const day = parseDay(workedOn);
  if (!start || !day) return 0;
  const diff = Math.floor((day.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return 0;
  return Math.min(16, Math.floor(diff / 7) + 1);
}

function mondayOf(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay();
  copy.setDate(copy.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return copy;
}

function countedEntries(entries: DashboardEntry[]) {
  return entries.filter((row) => row.status !== "running" || row.hours > 0);
}

function reviewColumns(status: string) {
  if (hoursAreApproved(status)) return { managerReview: "Recommended", founderApproval: "Approved" };
  if (status === "manager_recommended") return { managerReview: "Recommended", founderApproval: "" };
  if (status === "submitted") return { managerReview: "Pending", founderApproval: "" };
  if (status === "returned") return { managerReview: "Returned", founderApproval: "" };
  return { managerReview: "", founderApproval: "" };
}

export function internHoursCsv(entries: DashboardEntry[]) {
  const ordered = countedEntries(entries).sort((a, b) => a.workedOn.localeCompare(b.workedOn) || a.id.localeCompare(b.id));
  let cumulative = 0;
  return timeReportCsv(ordered.map((row) => {
    if (hoursAreApproved(row.status)) cumulative = roundHours(cumulative + row.hours);
    const review = reviewColumns(row.status);
    return {
      date: row.workedOn,
      week: row.weekNumber ? `Week ${row.weekNumber}` : "",
      hours: row.hours,
      category: row.categoryName,
      description: row.description,
      linkedWork: "",
      managerReview: review.managerReview,
      founderApproval: review.founderApproval,
      cumulativeApproved: cumulative,
    };
  }));
}

export function buildInternHoursDashboard(input: {
  entries: DashboardEntry[];
  requiredHours: number;
  weeks: number;
  weeklyTarget: number;
  currentWeek: number;
  startDate: string | null;
  requirementPending: boolean;
  today?: Date;
}) {
  const today = input.today ?? new Date();
  const todayKey = formatDay(today);
  const counted = countedEntries(input.entries);
  const official = approvedHours(counted.map((row) => ({ hours: row.hours, status: row.status })));
  const pendingRequirement = input.requirementPending || input.requiredHours <= 0;
  const credit = pendingRequirement ? official : creditBearingHours(official, input.requiredHours);
  const pace = semesterPace({
    requiredHours: Math.max(0, input.requiredHours),
    approvedHours: official,
    internshipWeeks: Math.max(1, input.weeks),
    currentWeek: Math.max(0, input.currentWeek),
    weeklyTarget: input.weeklyTarget > 0 ? input.weeklyTarget : 10,
  });
  const logged = roundHours(counted.reduce((sum, row) => sum + row.hours, 0));
  const weekStart = mondayOf(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = formatDay(date);
    const dayEntries = counted.filter((row) => row.workedOn === key);
    const primary = [...dayEntries].sort((a, b) => b.hours - a.hours)[0];
    return {
      key,
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      hours: roundHours(dayEntries.reduce((sum, row) => sum + row.hours, 0)),
      category: primary?.categoryName || "",
      approved: dayEntries.length > 0 && dayEntries.every((row) => hoursAreApproved(row.status)),
      hasEntry: dayEntries.length > 0,
    };
  });
  const hoursThisWeek = roundHours(weekDays.reduce((sum, day) => sum + day.hours, 0));
  const weeklyTarget = input.weeklyTarget > 0 ? input.weeklyTarget : 10;
  const completedPercent = pendingRequirement || input.requiredHours <= 0
    ? 0
    : Math.min(100, Math.round((credit / input.requiredHours) * 100));
  const chartStart = input.currentWeek > 6 ? input.currentWeek - 5 : 1;
  const chartWeeks = Array.from({ length: 6 }, (_, index) => {
    const week = chartStart + index;
    const hours = roundHours(counted.reduce((sum, row) => {
      const number = row.weekNumber && row.weekNumber > 0
        ? row.weekNumber
        : weekNumberForDate(input.startDate, row.workedOn);
      return number === week ? sum + row.hours : sum;
    }, 0));
    let range = "";
    const start = input.startDate ? parseDay(input.startDate) : null;
    if (start) {
      const from = new Date(start);
      from.setDate(start.getDate() + (week - 1) * 7);
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      const fmt = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      range = `${fmt(from)} – ${fmt(to)}`;
    }
    return { week, label: `Week ${week}`, range, hours, target: weeklyTarget };
  });
  const categories = [...counted.reduce((map, row) => {
    const key = row.categorySlug || "other";
    const current = map.get(key) || { slug: key, name: row.categoryName || "Other", hours: 0 };
    current.hours = roundHours(current.hours + row.hours);
    map.set(key, current);
    return map;
  }, new Map<string, { slug: string; name: string; hours: number }>()).values()]
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name))
    .map((row) => ({
      ...row,
      percent: logged > 0 ? Math.round((row.hours / logged) * 100) : 0,
      color: CATEGORY_COLORS[row.slug] || "#64748B",
    }));
  const first = parseDay(weekDays[0].key);
  const last = parseDay(weekDays[6].key);
  const weekRangeLabel = first && last
    ? `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";
  const paceTitle = pendingRequirement
    ? "Requirement pending"
    : pace.status === "complete"
      ? "Hours complete"
      : pace.status === "recovery"
        ? "Recovery pace"
        : pace.status === "watch"
          ? "Watch pace"
          : "On track";
  const paceDetail = pendingRequirement
    ? "University hour requirement is still pending confirmation."
    : pace.status === "on_track"
      ? "Approved hours are on pace for the confirmed requirement."
      : pace.label;

  return {
    todayKey,
    credit,
    logged,
    requiredHours: input.requiredHours,
    requirementPending: pendingRequirement,
    completedPercent,
    hoursThisWeek,
    weeklyTarget,
    weekTargetPercent: Math.min(100, Math.round((hoursThisWeek / weeklyTarget) * 100)),
    remaining: pendingRequirement ? null : pace.remaining,
    weeksRemaining: Math.max(0, input.weeks - Math.max(0, input.currentWeek)),
    programWeeks: input.weeks,
    currentWeek: input.currentWeek,
    paceTitle,
    paceDetail,
    paceStatus: pendingRequirement ? "pending" : pace.status,
    loggedPace: input.currentWeek > 0 ? roundHours(logged / input.currentWeek) : null,
    targetPace: input.currentWeek > 0 ? roundHours(weeklyTarget * input.currentWeek) : 0,
    weekDays,
    weekRangeLabel,
    chartWeeks,
    categories,
    recent: [...counted].sort((a, b) => b.workedOn.localeCompare(a.workedOn) || b.id.localeCompare(a.id)),
    markedDays: [...new Set(counted.map((row) => row.workedOn))],
    draftsThisWeek: counted.filter((row) => {
      const number = row.weekNumber && row.weekNumber > 0
        ? row.weekNumber
        : weekNumberForDate(input.startDate, row.workedOn);
      return number === input.currentWeek && (row.status === "draft" || row.status === "returned");
    }).length,
  };
}

export type HoursDashboard = ReturnType<typeof buildInternHoursDashboard>;
