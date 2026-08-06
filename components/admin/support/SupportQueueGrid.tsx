"use client";

import {
  PriorityBadge,
  StatusBadge,
  UserTypeBadge,
} from "@/components/admin/support/SupportBadges";
import type { SupportAdminOption } from "@/lib/admin/support/data";
import type { SupportCase } from "@/lib/admin/support/types";
import { formatDateTime } from "@/lib/admin/support/utils";

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
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Ticket ID
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Sender Type
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Category
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Priority
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Status
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Last Action
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Quick Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 bg-slate-950/40">
            {cases.length ? (
              cases.map((item) => {
                const busy = pendingId === item.id;
                const selected = selectedId === item.id;
                const highlighted = isHighlighted(item, highlightCaseId);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onOpen(item)}
                    className={`cursor-pointer align-top transition hover:bg-white/5 ${
                      selected
                        ? "bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/30"
                        : highlighted
                          ? "bg-sky-400/5"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-black text-white">{item.intakeNumber}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {item.senderName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {item.subject}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <UserTypeBadge userType={item.userType} />
                    </td>

                    <td className="px-3 py-3 text-slate-300">
                      {item.caseTypeLabel}
                    </td>

                    <td className="px-3 py-3">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-3 py-3 text-slate-400">
                      <p className="text-xs font-semibold text-slate-300">
                        {formatDateTime(item.updatedAt || item.createdAt)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.assignedTo || "Unassigned"}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <div
                        className="flex min-w-[220px] flex-wrap gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={busy || item.status === "closed"}
                          onClick={() => onResolve(item)}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40"
                        >
                          Resolved
                        </button>
                        <button
                          type="button"
                          disabled={busy || item.priority === "urgent"}
                          onClick={() => onEscalate(item)}
                          className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-2.5 py-1.5 text-[11px] font-black text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-40"
                        >
                          Escalate
                        </button>
                        <select
                          disabled={busy}
                          defaultValue={item.assignedTo}
                          onChange={(event) =>
                            onReassign(item, event.target.value)
                          }
                          className="max-w-[140px] rounded-xl border border-white/10 bg-slate-950 px-2 py-1.5 text-[11px] font-bold text-white outline-none focus:border-emerald-300/50 disabled:opacity-40"
                        >
                          <option value="">Unassigned</option>
                          {item.assignedTo &&
                          !assignees.some(
                            (admin) => admin.label === item.assignedTo
                          ) ? (
                            <option value={item.assignedTo}>
                              {item.assignedTo}
                            </option>
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
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No support tickets match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
