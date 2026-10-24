export type WorkBucket = "current" | "upcoming" | "later";

export type WorkloadItem = {
  id: string;
  title: string;
  status: string;
  weekNumber?: number | null;
  dueOn?: string | null;
};

export function assignmentBucket(
  item: WorkloadItem,
  focusWeek: number,
): WorkBucket {
  const done = item.status === "approved" || item.status === "not_accepted";
  const week = item.weekNumber ?? null;

  if (focusWeek <= 0) {
    if (week != null && week > 0 && week <= 2) return "upcoming";
    return "later";
  }

  if (week != null) {
    if (week === focusWeek) return "current";
    if (week < focusWeek && !done) return "current";
    if (week > focusWeek && week <= focusWeek + 2) return "upcoming";
    return "later";
  }

  if (!done) return "current";
  return "later";
}

export function groupWorkload<T extends WorkloadItem>(items: T[], focusWeek: number) {
  const current: T[] = [];
  const upcoming: T[] = [];
  const later: T[] = [];
  for (const item of items) {
    const bucket = assignmentBucket(item, focusWeek);
    if (bucket === "current") current.push(item);
    else if (bucket === "upcoming") upcoming.push(item);
    else later.push(item);
  }
  return {
    current,
    upcoming,
    later,
    counts: {
      current: current.length,
      upcoming: upcoming.length,
      later: later.length,
    },
  };
}
