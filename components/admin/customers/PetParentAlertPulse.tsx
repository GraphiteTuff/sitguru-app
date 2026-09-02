"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AlertPayload = {
  new24h: number;
  newest: { id: string; name: string; createdAt: string | null }[];
};

export default function PetParentAlertPulse({
  initialNew24h,
}: {
  initialNew24h: number;
}) {
  const [latest, setLatest] = useState<AlertPayload>({
    new24h: initialNew24h,
    newest: [],
  });
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const response = await fetch("/api/admin/pet-parent-alerts", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as AlertPayload;
        if (cancelled) return;
        setLatest((prev) => {
          if (data.new24h > prev.new24h) setFresh(true);
          return data;
        });
      } catch {
        // Stay on last known count.
      }
    };

    const id = window.setInterval(tick, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!latest.new24h && !fresh) return null;

  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-4 ${
        fresh
          ? "border-amber-300 bg-amber-50"
          : "border-emerald-100 bg-emerald-50"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
        {fresh ? "Just now" : "New registrations"}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">
        {latest.new24h} Pet Parent{latest.new24h === 1 ? "" : "s"} joined in the
        last 24 hours.
      </p>
      {latest.newest[0] ? (
        <Link
          href={`/admin/customers/${latest.newest[0].id}`}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-black text-[#0D5C3A]"
        >
          Open {latest.newest[0].name} →
        </Link>
      ) : null}
    </div>
  );
}
