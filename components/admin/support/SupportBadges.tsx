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
      ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
      : label === "medium" || normalized === "normal" || normalized === "medium"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const display = getStatusLabel(status).toLowerCase();

  const classes =
    display === "resolved"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : display === "pending"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : display === "open"
          ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
          : "border-rose-400/20 bg-rose-400/10 text-rose-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function UserTypeBadge({ userType }: { userType: string }) {
  const normalized = userType.toLowerCase();

  const classes =
    normalized === "guru"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
      : normalized === "ambassador"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
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
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
      <input
        type="checkbox"
        name="sendEmail"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-emerald-500"
      />
      {label}
    </label>
  );
}
