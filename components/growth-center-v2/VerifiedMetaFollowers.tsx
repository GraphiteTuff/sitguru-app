import type { SocialConnectorStatus } from "@/lib/growth-center-v2/types";

/** Server-rendered, source-labeled Meta follower counts for Manager Live Results. */
export default function VerifiedMetaFollowers({
  social,
}: {
  social: SocialConnectorStatus[];
}) {
  const meta = social.filter(
    (item) => item.platform === "facebook" || item.platform === "instagram",
  );

  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white shadow-sm sm:p-5" aria-label="Verified social followers">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
          Official Meta API
        </p>
        <h2 className="mt-1 text-xl font-black">Facebook &amp; Instagram followers</h2>
        <p className="mt-1 text-sm text-slate-300">
          Last verified follower snapshots, not website visits or estimated reach.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {meta.map((item) => {
          const available = item.status === "connected" && item.followers != null;
          return (
            <article key={item.platform} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{item.label}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                  available ? "bg-emerald-300/20 text-emerald-200" : "bg-amber-200/10 text-amber-200"
                }`}>
                  {available ? "Verified" : item.status === "error" ? "Stale" : "Not connected"}
                </span>
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums">
                {available ? item.followers!.toLocaleString() : "—"}
              </div>
              <p className="mt-1 text-xs text-slate-300">{item.accountLabel}</p>
              <p className="mt-2 text-xs text-slate-400">
                {item.lastSyncedAt
                  ? `Synced ${new Date(item.lastSyncedAt).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })} ET`
                  : "Awaiting first authenticated sync"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
