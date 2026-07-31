// components/pawreport/StatusUpdates.tsx
"use client";

type CareStatusKey = "food" | "water" | "potty" | "medication";

type CareStatusItem = {
  key: CareStatusKey;
  label: string;
  icon: string;
  detail: string;
  done: boolean;
};

type StatusUpdatesProps = {
  items?: CareStatusItem[];
  /** Guru can toggle / log statuses; Pet Parent is view-only. */
  interactive?: boolean;
  onToggleStatus?: (key: CareStatusKey) => void;
  className?: string;
};

const DEFAULT_ITEMS: CareStatusItem[] = [
  {
    key: "food",
    label: "Food",
    icon: "🍽️",
    detail: "Breakfast logged",
    done: true,
  },
  {
    key: "water",
    label: "Water",
    icon: "💧",
    detail: "Bowl refreshed",
    done: true,
  },
  {
    key: "potty",
    label: "Potty",
    icon: "🐾",
    detail: "Break completed",
    done: true,
  },
  {
    key: "medication",
    label: "Medication",
    icon: "💊",
    detail: "Not scheduled",
    done: false,
  },
];

/**
 * Placeholder care status strip — Food, Water, Potty, Medication.
 */
export default function StatusUpdates({
  items = DEFAULT_ITEMS,
  interactive = false,
  onToggleStatus,
  className = "",
}: StatusUpdatesProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        Care checklist
      </p>
      <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
        Status updates
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const content = (
            <>
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                  item.done ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-slate-950">
                    {item.label}
                  </p>
                  {item.done ? (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-800">
                      Done
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                  {item.detail}
                </p>
              </div>
            </>
          );

          if (interactive) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleStatus?.(item.key)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  item.done
                    ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                item.done
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { CareStatusKey, CareStatusItem };
