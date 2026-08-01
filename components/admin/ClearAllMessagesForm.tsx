"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { clearAllAdminMessageCenterAction } from "@/app/admin/messages/actions";

export default function ClearAllMessagesForm() {
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
    <form
      onSubmit={handleSubmit}
      className="mt-5 flex flex-col gap-3 rounded-[24px] border border-rose-200 bg-rose-50/70 p-4 sm:flex-row sm:items-end"
    >
      <label className="grid min-w-0 flex-1 gap-2">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-rose-800">
          Start from scratch
        </span>
        <input
          name="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Type CLEAR ALL to permanently wipe every thread"
          className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          autoComplete="off"
          disabled={pending}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        Clear all messages
      </button>
      {error ? (
        <p className="basis-full text-xs font-bold text-rose-800">{error}</p>
      ) : null}
    </form>
  );
}
