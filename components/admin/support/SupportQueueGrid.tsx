"use client";

import {
  PriorityBadge,
  StatusBadge,
  UserTypeBadge,
} from "@/components/admin/support/SupportBadges";
import type { SupportAdminOption } from "@/lib/admin/support/data";
import type { SupportCase } from "@/lib/admin/support/types";
import { formatDateTime } from "@/lib/admin/support/utils";
import { MessageCircle, UserRoundCheck } from "lucide-react";

type SupportQueueGridProps = {
  cases: SupportCase[];
  assignees: SupportAdminOption[];
  selectedId: string | null;
  pendingId: string | null;
  highlightCaseId?: string;
  onOpen: (item: SupportCase) => void;
  onResolve: (item: SupportCase) => void;
  onEscalate: (item: SupportCase) => void;
  onReassign: (item: SupportCase, assignee: string) => void;
};

function isHighlighted(item: SupportCase, caseId?: string) {
  if (!caseId) return false;
  const needle = caseId.toLowerCase();
  return item.id === caseId || item.intakeNumber.toLowerCase() === needle;
}

export default function SupportQueueGrid({
  cases,
  assignees,
  selectedId,
  pendingId,
  highlightCaseId,
  onOpen,
  onResolve,
  onEscalate,
  onReassign,
}: SupportQueueGridProps) {
  if (!cases.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-bold text-emerald-900">
        No support tickets match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cases.map((item) => {
        const busy = pendingId === item.id;
        const selected = selectedId === item.id;
        const highlighted = isHighlighted(item, highlightCaseId);

        return (
          <article
            key={item.id}
            className={`rounded-[24px] border bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5 ${
              selected
                ? "border-emerald-300 ring-4 ring-emerald-100"
                : highlighted
                  ? "border-sky-200 bg-sky-50/40"
                  : "border-slate-200"
            }`}
          >
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.95fr_auto] xl:items-center">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="min-w-0 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black text-slate-950">
                    {item.intakeNumber}
                  </h3>
                  <UserTypeBadge userType={item.userType} />
                </div>
                <p className="mt-2 truncate text-sm font-black text-slate-800">
                  {item.subject || "No subject"}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {item.senderName || "Unknown sender"}
                  {item.senderEmail ? ` · ${item.senderEmail}` : ""}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {item.caseTypeLabel}
                </p>
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Priority & status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Last action: {formatDateTime(item.updatedAt || item.createdAt)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Assignee: {item.assignedTo || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Next action
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {item.status === "closed"
                    ? "Already resolved"
                    : item.priority === "urgent"
                      ? "Reply or escalate to disputes"
                      : "Open ticket and reply"}
                </p>
                <label className="mt-3 block">
                  <span className="sr-only">Reassign</span>
                  <select
                    disabled={busy}
                    defaultValue={item.assignedTo}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      onReassign(item, event.target.value)
                    }
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:opacity-40"
                  >
                    <option value="">Unassigned</option>
                    {item.assignedTo &&
                    !assignees.some(
                      (admin) => admin.label === item.assignedTo,
                    ) ? (
                      <option value={item.assignedTo}>{item.assignedTo}</option>
                    ) : null}
                    {assignees.map((admin) => (
                      <option
                        key={admin.id || admin.email}
                        value={admin.label}
                      >
                        {admin.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                className="grid min-w-[170px] gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                >
                  <MessageCircle size={16} />
                  Open ticket
                </button>
                <button
                  type="button"
                  disabled={busy || item.status === "closed"}
                  onClick={() => onResolve(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-40"
                >
                  <UserRoundCheck size={15} />
                  Resolved
                </button>
                <button
                  type="button"
                  disabled={busy || item.priority === "urgent"}
                  onClick={() => onEscalate(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-800 transition hover:bg-rose-100 disabled:opacity-40"
                >
                  Escalate
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
