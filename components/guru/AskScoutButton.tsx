"use client";

import { openCompanionChat } from "@/lib/companions/open-companion-chat";

export default function AskScoutButton({
  label = "Ask Scout",
  className = "inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => openCompanionChat("scout")}>
      {label}
    </button>
  );
}
