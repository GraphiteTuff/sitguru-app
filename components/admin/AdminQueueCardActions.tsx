"use client";

import { useState } from "react";
import { Archive, Loader2, Trash2, X } from "lucide-react";

type AdminQueueCardActionsProps = {
  conversationId: string;
  threadSubject?: string;
  onRemoved?: () => void;
};

export default function AdminQueueCardActions({
  conversationId,
  threadSubject,
  onRemoved,
}: AdminQueueCardActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function postAction(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || `Request failed (${response.status}).`);
    }

    return payload;
  }

  async function confirmDelete() {
    if (pendingDelete || pendingArchive) return;
    setError(null);
    setPendingDelete(true);

    try {
      await postAction("/api/admin/messages/delete");
      setConfirmDeleteOpen(false);
      onRemoved?.();
      // Hard navigation so Threads / Inquiry KPIs reload from the server.
      window.location.assign(
        `/admin/messages?compose_success=deleted&t=${Date.now()}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete request failed.");
      setPendingDelete(false);
    }
  }

  async function handleArchive() {
    if (pendingDelete || pendingArchive) return;
    setError(null);
    setPendingArchive(true);

    try {
      await postAction("/api/admin/messages/archive");
      onRemoved?.();
      window.location.assign(
        `/admin/messages?compose_success=archived&t=${Date.now()}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive request failed.");
      setPendingArchive(false);
    }
  }

  const busy = pendingDelete || pendingArchive;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid w-full gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleArchive}
          disabled={busy}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pendingArchive ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Archive size={14} />
          )}
          Archive
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirmDeleteOpen(true);
          }}
          disabled={busy}
          title="Permanently delete this conversation and its messages"
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {error ? (
        <p className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
          {error}
        </p>
      ) : null}

      {confirmDeleteOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-thread-title"
            className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">
                  Permanent delete
                </p>
                <h3
                  id="delete-thread-title"
                  className="mt-1 text-xl font-black text-slate-950"
                >
                  Are you sure you want to permanently delete this message
                  thread?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={pendingDelete}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {threadSubject ? (
                <>
                  This will permanently remove{" "}
                  <span className="font-black text-slate-900">
                    “{threadSubject}”
                  </span>{" "}
                  from the Message Center and KPIs. This cannot be undone.
                </>
              ) : (
                <>
                  This will permanently remove the thread from the Message
                  Center and KPIs. This cannot be undone.
                </>
              )}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={pendingDelete}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pendingDelete}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-800 disabled:opacity-60"
              >
                {pendingDelete ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Yes, delete forever
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
