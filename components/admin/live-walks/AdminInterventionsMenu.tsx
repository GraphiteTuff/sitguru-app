// components/admin/live-walks/AdminInterventionsMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminOverrideAction } from "@/components/admin/live-walks/types";

type AdminInterventionsMenuProps = {
  disabled?: boolean;
  onAction: (action: AdminOverrideAction) => void;
};

export default function AdminInterventionsMenu({
  disabled,
  onAction,
}: AdminInterventionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-50"
      >
        Admin Interventions
        <span aria-hidden="true" className="text-xs opacity-80">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-3 text-left text-sm font-bold text-rose-800 hover:bg-rose-50"
            onClick={() => {
              setOpen(false);
              onAction("force_end");
            }}
          >
            Force End Walk Session
          </button>
          <button
            type="button"
            className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onAction("send_guru_sms");
            }}
          >
            Send SMS Broadcast to Guru
          </button>
          <button
            type="button"
            className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onAction("append_timeline");
            }}
          >
            Add Internal Compliance Note
          </button>
        </div>
      ) : null}
    </div>
  );
}
