// components/guru/walk/GuruWalkMetricsBar.tsx
"use client";

type GuruWalkMetricsBarProps = {
  petName: string;
  distanceMiles: number;
  elapsedLabel: string;
  banner: {
    label: string;
    tone: "live" | "paused" | "reconnect" | "idle" | "ended";
  };
  gpsMessage: string;
};

function bannerClasses(tone: GuruWalkMetricsBarProps["banner"]["tone"]) {
  switch (tone) {
    case "live":
      return "bg-emerald-500/20 text-emerald-50 border-emerald-300/30";
    case "paused":
      return "bg-sky-400/20 text-sky-50 border-sky-200/30";
    case "reconnect":
      return "bg-amber-400/25 text-amber-50 border-amber-200/40";
    case "ended":
      return "bg-white/15 text-white border-white/20";
    default:
      return "bg-white/10 text-emerald-50 border-white/15";
  }
}

export default function GuruWalkMetricsBar({
  petName,
  distanceMiles,
  elapsedLabel,
  banner,
  gpsMessage,
}: GuruWalkMetricsBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-[0_14px_40px_rgba(2,44,34,0.45)]">
      <div className="px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/90">
          Guru live publisher
        </p>
        <h1 className="mt-1 truncate text-[clamp(1.3rem,5.4vw,1.8rem)] font-black tracking-[-0.04em]">
          {petName}&apos;s walk
        </h1>

        <div
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${bannerClasses(banner.tone)}`}
        >
          {banner.tone === "live" ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />
          )}
          {banner.label}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/80">
              Distance
            </p>
            <p className="mt-1 text-[clamp(1.25rem,5vw,1.6rem)] font-black tabular-nums tracking-[-0.03em]">
              {distanceMiles.toFixed(2)}
              <span className="ml-1 text-xs font-bold text-emerald-100/80">
                mi
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/80">
              Elapsed
            </p>
            <p className="mt-1 font-mono text-[clamp(1.25rem,5vw,1.6rem)] font-black tracking-[-0.03em]">
              {elapsedLabel}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold text-emerald-100/85">
          {gpsMessage}
        </p>
      </div>
    </header>
  );
}
