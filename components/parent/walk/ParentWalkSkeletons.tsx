// components/parent/walk/ParentWalkSkeletons.tsx
export function ParentWalkHeroSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-b-3xl bg-emerald-900 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="h-3 w-24 rounded bg-emerald-700/70" />
      <div className="h-8 w-40 rounded bg-emerald-700/80" />
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="h-16 rounded-2xl bg-emerald-800/80" />
        <div className="h-16 rounded-2xl bg-emerald-800/80" />
        <div className="h-16 rounded-2xl bg-emerald-800/80" />
      </div>
    </div>
  );
}

export function ParentWalkMapSkeleton() {
  return (
    <div className="mx-3 mt-3 h-[52dvh] min-h-[280px] animate-pulse rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-100" />
  );
}

export function ParentWalkDeadZoneCard() {
  return (
    <div className="mx-3 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 shadow-sm">
      Connection dropped temporarily. We&apos;ll reconnect automatically when
      signal returns — your walk history stays safe.
    </div>
  );
}
