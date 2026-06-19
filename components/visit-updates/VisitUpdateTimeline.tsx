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

function formatTime(value: string | null): string {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getUpdateLabel(type: string): string {
  if (type === "visit_started") return "Visit started";
  if (type === "visit_ended") return "Visit completed";
  if (type === "pee") return "Pee update";
  if (type === "poop") return "Poop update";
  if (type === "water") return "Water refreshed";
  if (type === "food") return "Food update";
  if (type === "photo") return "Photo added";
  if (type === "note") return "Care note";
  return "Visit update";
}

function getUpdateIcon(type: string): string {
  if (type === "visit_started") return "▶️";
  if (type === "visit_ended") return "✅";
  if (type === "pee") return "💧";
  if (type === "poop") return "🐾";
  if (type === "water") return "🥣";
  if (type === "food") return "🍽️";
  if (type === "photo") return "📷";
  if (type === "note") return "📝";
  return "🐶";
}

function getDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "In progress";

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const minutes = Math.max(0, Math.round((end - start) / 60000));

  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

export default function VisitUpdateTimeline({
  session,
  updates,
  viewer = "customer",
}: VisitUpdateTimelineProps) {
  const completed = session?.status === "completed";
  const inProgress = session?.status === "in_progress";
  const photos = updates.filter((update) => update.photo_url);

  return (
    <section className="space-y-5 !text-slate-950">
      <div className="overflow-hidden rounded-3xl border border-slate-200 !bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 sm:p-6">
          <p className="text-sm font-semibold !text-sky-700">
            SitGuru Visit Card
          </p>

          <h1 className="mt-1 text-2xl font-bold !text-slate-950 sm:text-3xl">
            {completed
              ? "Visit completed"
              : inProgress
                ? "Visit in progress"
                : "Visit updates"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm !text-slate-700 sm:text-base">
            Photos, care notes, potty updates, and visit timing in one simple
            place.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide !text-slate-600">
              Started
            </p>
            <p className="mt-1 font-bold !text-slate-950">
              {formatDateTime(session?.started_at ?? null)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide !text-slate-600">
              Ended
            </p>
            <p className="mt-1 font-bold !text-slate-950">
              {formatDateTime(session?.ended_at ?? null)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide !text-slate-600">
              Duration
            </p>
            <p className="mt-1 font-bold !text-slate-950">
              {getDuration(
                session?.started_at ?? null,
                session?.ended_at ?? null
              )}
            </p>
          </div>
        </div>

        {session?.final_note ? (
          <div className="mx-5 mb-5 rounded-2xl border border-emerald-200 !bg-emerald-50 p-4 sm:mx-6 sm:mb-6">
            <p className="text-xs uppercase tracking-wide !text-emerald-700">
              Final note
            </p>
            <p className="mt-1 text-sm leading-6 !text-emerald-950">
              {session.final_note}
            </p>
          </div>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 !bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold !text-slate-950">Visit photos</h2>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.photo_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-200 !bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url || ""}
                  alt="Visit update"
                  className="aspect-square h-full w-full object-cover transition group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 !bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-bold !text-slate-950">Visit timeline</h2>
          <p className="mt-1 text-sm !text-slate-700">
            {viewer === "guru"
              ? "Your updates appear here after you add them."
              : "Updates from your Guru will appear here."}
          </p>
        </div>

        {updates.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 !bg-slate-50 p-6 text-center">
            <p className="text-3xl !text-slate-950">🐾</p>
            <h3 className="mt-2 font-bold !text-slate-950">
              No visit updates yet
            </h3>
            <p className="mt-1 text-sm !text-slate-700">
              Once the visit starts, updates will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="flex gap-3 rounded-2xl border border-slate-200 !bg-slate-50 p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl !bg-white text-xl shadow-sm">
                  {getUpdateIcon(update.update_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-bold !text-slate-950">
                      {getUpdateLabel(update.update_type)}
                    </h3>
                    <p className="text-xs font-semibold !text-slate-600">
                      {formatTime(update.created_at)}
                    </p>
                  </div>

                  {update.note ? (
                    <p className="mt-1 text-sm leading-6 !text-slate-700">
                      {update.note}
                    </p>
                  ) : null}

                  {update.photo_url ? (
                    <a
                      href={update.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-bold !text-sky-700 hover:!text-sky-900"
                    >
                      View photo
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}