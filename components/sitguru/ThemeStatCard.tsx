import type { ReactNode } from "react";

export type ThemeTone =
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

const tones: Record<
  ThemeTone,
  { card: string; icon: string; label: string }
> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    label: "text-emerald-800",
  },
  sky: {
    card: "border-sky-200 bg-sky-50",
    icon: "bg-sky-600 text-white",
    label: "text-sky-800",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    label: "text-amber-800",
  },
  rose: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    label: "text-rose-800",
  },
  violet: {
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-600 text-white",
    label: "text-violet-800",
  },
  slate: {
    card: "border-slate-200 bg-slate-50",
    icon: "bg-slate-700 text-white",
    label: "text-slate-700",
  },
};

export function ThemeStatCard({
  label,
  value,
  helper,
  tone = "emerald",
  icon,
  className = "",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: ThemeTone;
  icon?: ReactNode;
  className?: string;
}) {
  const theme = tones[tone];

  return (
    <div
      className={`rounded-[1.5rem] border p-4 shadow-sm ${theme.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-[10px] font-black uppercase tracking-[0.14em] ${theme.label}`}
        >
          {label}
        </p>
        {icon ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${theme.icon}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export { tones as themeToneClasses };
