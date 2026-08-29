import {
  attendanceStatusLabel,
  type EventAttendanceAdminRow,
  type EventAttendanceCounts,
} from "@/lib/community/attendance";

const emptyCounts: EventAttendanceCounts = {
  petParents: 0,
  gurus: 0,
  ambassadors: 0,
  totalGoing: 0,
  totalMaybe: 0,
  totalNo: 0,
};

function roleLabel(role: EventAttendanceAdminRow["role"], isGuest: boolean) {
  if (isGuest) return "Guest";
  if (role === "guru") return "Guru";
  if (role === "ambassador") return "Ambassador";
  return "Pet Parent";
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminEventAttendancePanel({
  counts = emptyCounts,
  rows = [],
}: {
  counts?: EventAttendanceCounts;
  rows?: EventAttendanceAdminRow[];
}) {
  const yes = rows.filter((row) => row.status === "going");
  const maybe = rows.filter((row) => row.status === "interested");
  const no = rows.filter((row) => row.status === "cancelled");

  const sections: Array<{
    key: string;
    title: string;
    tone: string;
    count: number;
    items: EventAttendanceAdminRow[];
  }> = [
    {
      key: "yes",
      title: "Yes",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      count: counts.totalGoing,
      items: yes,
    },
    {
      key: "maybe",
      title: "Maybe",
      tone: "border-amber-200 bg-amber-50 text-amber-950",
      count: counts.totalMaybe,
      items: maybe,
    },
    {
      key: "no",
      title: "No",
      tone: "border-slate-200 bg-slate-50 text-slate-800",
      count: counts.totalNo,
      items: no,
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Attendance tracking
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Attending? Yes · Maybe · No
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Responses from event cards and detail pages. Going also breaks down
            by role.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-900">
            Yes {counts.totalGoing}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-950">
            Maybe {counts.totalMaybe}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-800">
            No {counts.totalNo}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Pet Parents going
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-950">
            {counts.petParents}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-800">
            Gurus going
          </p>
          <p className="mt-1 text-2xl font-black text-sky-950">{counts.gurus}</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-800">
            Ambassadors going
          </p>
          <p className="mt-1 text-2xl font-black text-violet-950">
            {counts.ambassadors}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {sections.map((section) => (
          <div key={section.key} className={`rounded-2xl border px-4 py-3 ${section.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">
                {section.title}{" "}
                <span className="font-semibold opacity-80">({section.count})</span>
              </p>
            </div>
            {section.items.length ? (
              <ul className="mt-3 space-y-2">
                {section.items.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-0.5 rounded-xl border border-white/60 bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">{row.name}</p>
                      <p className="text-xs font-semibold text-slate-600">
                        {roleLabel(row.role, !row.userId)}
                        {row.email ? ` · ${row.email}` : ""}
                      </p>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500">
                      {attendanceStatusLabel(row.status)} · {formatWhen(row.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs font-semibold opacity-80">
                No {section.title.toLowerCase()} responses yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
