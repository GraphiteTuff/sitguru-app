"use client";

import { useEffect, useState } from "react";

export default function LiveResultsClock() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      setLabel(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/New_York",
        }),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#166534]">
      <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
      Live{label ? ` · ${label}` : ""}
    </span>
  );
}
