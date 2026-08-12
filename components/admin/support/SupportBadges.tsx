import {
  getPriorityLabel,
  getStatusLabel,
  getUserTypeLabel,
} from "@/lib/admin/support/utils";

export function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toLowerCase();
  const label = getPriorityLabel(priority).toLowerCase();

  const classes =
    label === "urgent" || normalized === "high" || normalized === "urgent"
      ? "bg-rose-100 text-rose-800"
      : label === "medium" || normalized === "normal" || normalized === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const display = getStatusLabel(status).toLowerCase();

  const classes =
    display === "resolved"
      ? "bg-emerald-100 text-emerald-800"
      : display === "pending"
        ? "bg-amber-100 text-amber-800"
        : display === "open"
          ? "bg-sky-100 text-sky-800"
          : "bg-rose-100 text-rose-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function UserTypeBadge({ userType }: { userType: string }) {
  const normalized = userType.toLowerCase();

  const classes =
    normalized === "guru"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "ambassador"
        ? "bg-violet-100 text-violet-800"
        : "bg-sky-100 text-sky-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${classes}`}
    >
      {getUserTypeLabel(normalized)}
    </span>
  );
}

export function EmailCheckbox({
  defaultChecked = false,
  label = "Send email notification to sender",
}: {
  defaultChecked?: boolean;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
      <input
        type="checkbox"
        name="sendEmail"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-emerald-700 accent-emerald-700"
      />
      {label}
    </label>
  );
}
