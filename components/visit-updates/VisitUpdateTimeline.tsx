type VisitSession = {
  id: string;
  booking_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  final_note: string | null;
};

type VisitUpdate = {
  id: string;
  update_type: string;
  note: string | null;
  photo_url: string | null;
  created_at: string;
};

type VisitUpdateTimelineProps = {
  session: VisitSession | null;
  updates: VisitUpdate[];
  viewer?: "guru" | "customer" | "admin";
};

type UpdateStyle = {
  label: string;
  icon: string;
  helper: string;
  chipClassName: string;
  iconClassName: string;
};

const UPDATE_STYLES: Record<string, UpdateStyle> = {
  visit_started: {
    label: "PawReport started",
    icon: "▶️",
    helper: "The visit is now active.",
    chipClassName: "border-sky-200 bg-sky-50 !text-sky-800",
    iconClassName: "bg-sky-50 ring-sky-100",
  },
  visit_ended: {
    label: "PawReport completed",
    icon: "✅",
    helper: "The visit summary has been completed.",
    chipClassName: "border-emerald-200 bg-emerald-50 !text-emerald-800",
    iconClassName: "bg-emerald-50 ring-emerald-100",
  },
  pee: {
    label: "Pee update",
    icon: "💧",
    helper: "Potty update recorded.",
    chipClassName: "border-cyan-200 bg-cyan-50 !text-cyan-800",
    iconClassName: "bg-cyan-50 ring-cyan-100",
  },
  poop: {
    label: "Poop update",
    icon: "🐾",
    helper: "Potty update recorded.",
    chipClassName: "border-amber-200 bg-amber-50 !text-amber-800",
    iconClassName: "bg-amber-50 ring-amber-100",
  },
  water: {
    label: "Water refreshed",
    icon: "💧",
    helper: "Fresh water was confirmed.",
    chipClassName: "border-blue-200 bg-blue-50 !text-blue-800",
    iconClassName: "bg-blue-50 ring-blue-100",
  },
  food: {
    label: "Food update",
    icon: "🍽️",
    helper: "Food or feeding details were confirmed.",
    chipClassName: "border-orange-200 bg-orange-50 !text-orange-800",
    iconClassName: "bg-orange-50 ring-orange-100",
  },
  photo: {
    label: "Photo added",
    icon: "📷",
    helper: "A visit photo was added.",
    chipClassName: "border-violet-200 bg-violet-50 !text-violet-800",
    iconClassName: "bg-violet-50 ring-violet-100",
  },
  note: {
    label: "Care note",
    icon: "📝",
    helper: "A care note was added.",
    chipClassName: "border-slate-200 bg-slate-50 !text-slate-800",
    iconClassName: "bg-slate-50 ring-slate-100",
  },
  medication: {
    label: "Medication note",
    icon: "💊",
    helper: "Medication or health-related care note recorded.",
    chipClassName: "border-rose-200 bg-rose-50 !text-rose-800",
    iconClassName: "bg-rose-50 ring-rose-100",
  },
  walk: {
    label: "Walk update",
    icon: "🦮",
    helper: "Walk or outdoor activity update recorded.",
    chipClassName: "border-lime-200 bg-lime-50 !text-lime-800",
    iconClassName: "bg-lime-50 ring-lime-100",
  },
  play: {
    label: "Play update",
    icon: "🎾",
    helper: "Playtime or enrichment update recorded.",
    chipClassName: "border-fuchsia-200 bg-fuchsia-50 !text-fuchsia-800",
    iconClassName: "bg-fuchsia-50 ring-fuchsia-100",
  },
  mood: {
    label: "Mood update",
    icon: "😊",
    helper: "Pet mood or behavior update recorded.",
    chipClassName: "border-yellow-200 bg-yellow-50 !text-yellow-800",
    iconClassName: "bg-yellow-50 ring-yellow-100",
  },
};

function formatTime(value: string | null): string {
  if (!value) return "Not recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getUpdateStyle(type: string): UpdateStyle {
  return (
    UPDATE_STYLES[type] || {
      label: "PawReport update",
      icon: "🐶",
      helper: "Care update recorded.",
      chipClassName: "border-slate-200 bg-slate-50 !text-slate-800",
      iconClassName: "bg-slate-50 ring-slate-100",
    }
  );
}

function getDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt && !endedAt) return "Not started";
  if (startedAt && !endedAt) return "In progress";
  if (!startedAt || !endedAt) return "Not recorded";

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Not recorded";

  const minutes = Math.max(0, Math.round((end - start) / 60000));

  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

function getStatusLabel(session: VisitSession | null) {
  const status = String(session?.status || "not_started").toLowerCase();

  if (status === "completed") return "Complete";
  if (status === "in_progress") return "Live now";
  return "Ready to start";
}

function getStatusClassName(session: VisitSession | null) {
  const status = String(session?.status || "not_started").toLowerCase();

  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 !text-emerald-800";
  }

  if (status === "in_progress") {
    return "border-sky-200 bg-sky-50 !text-sky-800";
  }

  return "border-amber-200 bg-amber-50 !text-amber-800";
}

function getTimelineIntro(viewer: VisitUpdateTimelineProps["viewer"]) {
  if (viewer === "guru") {
    return "Add each important care moment as it happens so the Pet Parent can follow along and trust the visit.";
  }

  if (viewer === "admin") {
    return "Review the full PawReport timeline for this booking, including photos, care notes, and completion status.";
  }

  return "Your Guru will share photos, potty updates, food and water confirmations, and care notes here.";
}

function countUpdates(updates: VisitUpdate[], type: string) {
  return updates.filter((update) => update.update_type === type).length;
}

export default function VisitUpdateTimeline({
  session,
  updates,
  viewer = "customer",
}: VisitUpdateTimelineProps) {
  const completed = session?.status === "completed";
  const inProgress = session?.status === "in_progress";
  const photos = updates.filter((update) => update.photo_url);
  const careNotes = updates.filter((update) => update.note?.trim()).length;

  return (
    <section className="space-y-5 !text-[#061638]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 !bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_52%,#e0f2fe_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">
                SitGuru PawReport™
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] !text-[#061638] sm:text-4xl">
                {completed
                  ? "PawReport complete"
                  : inProgress
                    ? "PawReport live now"
                    : "PawReport ready"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 !text-slate-700 sm:text-base">
                Photos, potty updates, food and water confirmations, care notes,
                and visit timing in one warm, easy-to-read report.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${getStatusClassName(
                session,
              )}`}
            >
              {getStatusLabel(session)}
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-600">
              Started
            </p>
            <p className="mt-1 text-base font-black !text-[#061638]">
              {formatDateTime(session?.started_at ?? null)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-600">
              Completed
            </p>
            <p className="mt-1 text-base font-black !text-[#061638]">
              {formatDateTime(session?.ended_at ?? null)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-600">
              Duration
            </p>
            <p className="mt-1 text-base font-black !text-[#061638]">
              {getDuration(
                session?.started_at ?? null,
                session?.ended_at ?? null,
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-4 sm:px-6 sm:pb-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-emerald-700">
              Photos
            </p>
            <p className="mt-1 text-3xl font-black !text-[#061638]">
              {photos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-cyan-700">
              Potty
            </p>
            <p className="mt-1 text-3xl font-black !text-[#061638]">
              {countUpdates(updates, "pee") + countUpdates(updates, "poop")}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-orange-700">
              Food / Water
            </p>
            <p className="mt-1 text-3xl font-black !text-[#061638]">
              {countUpdates(updates, "food") + countUpdates(updates, "water")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-slate-600">
              Notes
            </p>
            <p className="mt-1 text-3xl font-black !text-[#061638]">
              {careNotes}
            </p>
          </div>
        </div>

        {session?.final_note ? (
          <div className="mx-5 mb-5 rounded-2xl border border-emerald-200 !bg-emerald-50 p-5 sm:mx-6 sm:mb-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-700">
              Final care summary
            </p>
            <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 !text-emerald-950">
              {session.final_note}
            </p>
          </div>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <div className="rounded-[2rem] border border-slate-200 !bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                Visit Photos
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] !text-[#061638]">
                PawReport photos
              </h2>
            </div>
            <p className="text-sm font-bold !text-slate-600">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.photo_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-200 !bg-slate-100 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url || ""}
                  alt="PawReport update"
                  className="aspect-square h-full w-full object-cover transition group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 !bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
              Live Care Timeline
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] !text-[#061638]">
              PawReport timeline
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 !text-slate-700">
              {getTimelineIntro(viewer)}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
            {updates.length} update{updates.length === 1 ? "" : "s"}
          </span>
        </div>

        {updates.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 !bg-slate-50 p-8 text-center">
            <p className="text-4xl !text-[#061638]">🐾</p>
            <h3 className="mt-3 text-xl font-black !text-[#061638]">
              No PawReport updates yet
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 !text-slate-700">
              Once the PawReport starts, care updates will appear here for this
              booking.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {updates.map((update) => {
              const style = getUpdateStyle(update.update_type);

              return (
                <div
                  key={update.id}
                  className="relative rounded-[1.5rem] border border-slate-200 !bg-slate-50 p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ring-1 ${style.iconClassName}`}
                    >
                      {style.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-black !text-[#061638]">
                            {style.label}
                          </h3>
                          <p className="mt-1 text-sm font-bold !text-slate-600">
                            {style.helper}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${style.chipClassName}`}
                          >
                            {formatTime(update.created_at)}
                          </span>
                        </div>
                      </div>

                      {update.note ? (
                        <p className="mt-3 whitespace-pre-line rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-7 !text-slate-800">
                          {update.note}
                        </p>
                      ) : null}

                      {update.photo_url ? (
                        <a
                          href={update.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black !text-sky-800 transition hover:bg-sky-100"
                        >
                          View photo →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
