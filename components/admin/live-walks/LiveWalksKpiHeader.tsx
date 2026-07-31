// components/admin/live-walks/LiveWalksKpiHeader.tsx
import type { AdminLiveWalkStats } from "@/components/admin/live-walks/types";

type LiveWalksKpiHeaderProps = {
  stats: AdminLiveWalkStats;
};

export default function LiveWalksKpiHeader({ stats }: LiveWalksKpiHeaderProps) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
            Total Active Walks
          </p>
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        </div>
        <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
          {stats.totalActiveWalks}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          in_progress + paused fleet sessions
        </p>
      </article>

      <article className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-700">
          Active Alerts / Dead Zones
        </p>
        <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-rose-950">
          {stats.activeAlerts}
        </p>
        <p className="mt-1 text-xs font-semibold text-rose-800/80">
          No GPS ping for &gt;15 minutes
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
          Gurus En Route
        </p>
        <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
          {stats.gurusEnRoute}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          PRE_WALK setup / travel state
        </p>
      </article>

      <article className="rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
          Distance Traveled Today
        </p>
        <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
          {stats.totalDistanceTrackedTodayMiles.toFixed(1)}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          total miles across all walks
        </p>
      </article>
    </section>
  );
}
