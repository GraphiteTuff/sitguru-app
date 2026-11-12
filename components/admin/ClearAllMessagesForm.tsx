"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { clearAllAdminMessageCenterAction } from "@/app/admin/messages/actions";

export default function ClearAllMessagesForm({ compact = false }: { compact?: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await clearAllAdminMessageCenterAction(confirmation);
      if (!result.ok) {
        setError(result.error || "Clear failed.");
        return;
      }
      setConfirmation("");
      window.location.assign(
        `/admin/messages?compose_success=cleared&t=${Date.now()}`,
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex min-w-0 flex-col gap-2">
      <label className="grid min-w-0 flex-1 gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-800">
          Wipe inbox
        </span>
        <input
          name="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Type CLEAR ALL"
          className={`w-full rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 ${
            compact ? "min-h-10 py-2" : "min-h-11 py-2.5"
          }`}
          autoComplete="off"
          disabled={pending}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-700 px-4 text-xs font-black text-white shadow-sm transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "min-h-10" : "min-h-11"
        }`}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        Clear all messages
      </button>
      {error ? (
        <p className="text-xs font-bold text-rose-800">{error}</p>
      ) : null}
    </form>
  );
}
