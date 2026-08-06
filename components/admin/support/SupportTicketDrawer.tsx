"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PriorityBadge,
  StatusBadge,
  UserTypeBadge,
} from "@/components/admin/support/SupportBadges";
import { useEscapeKey } from "@/components/admin/support/SupportToast";
import type { SupportAdminOption } from "@/lib/admin/support/data";
import type {
  SupportCase,
  SupportSenderProfile,
} from "@/lib/admin/support/types";
import { QUICK_STATUS_OPTIONS } from "@/lib/admin/support/types";
import {
  buildConversationTimeline,
  formatDateTime,
} from "@/lib/admin/support/utils";

type SupportTicketDrawerProps = {
  open: boolean;
  item: SupportCase | null;
  sender: SupportSenderProfile | null;
  assignees: SupportAdminOption[];
  pending: boolean;
  onClose: () => void;
  onPatch: (payload: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    notes?: string;
    replyBody?: string;
    sendEmail?: boolean;
  }) => Promise<void>;
};

export default function SupportTicketDrawer({
  open,
  item,
  sender,
  assignees,
  pending,
  onClose,
  onPatch,
}: SupportTicketDrawerProps) {
  const [replyBody, setReplyBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [notes, setNotes] = useState("");

  useEscapeKey(open, onClose);

  const timeline = useMemo(
    () => (item ? buildConversationTimeline(item) : []),
    [item]
  );

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        aria-label="Close ticket workspace"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#07111f] shadow-2xl">
        <header className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Ticket workspace
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {item.intakeNumber}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                {item.subject}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <UserTypeBadge userType={item.userType} />
            <PriorityBadge priority={item.priority} />
            <StatusBadge status={item.status} />
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Associated account
            </p>
            {sender ? (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-black text-white">{sender.fullName}</p>
                <p className="text-slate-400">{sender.email}</p>
                <p className="text-slate-500">
                  Role: {sender.role} · Status: {sender.status}
                </p>
                {sender.phone ? (
                  <p className="text-slate-500">{sender.phone}</p>
                ) : null}
                {sender.id ? (
                  <Link
                    href={`/admin/users?user=${sender.id}`}
                    className="mt-2 inline-flex text-xs font-bold text-sky-300 hover:text-sky-200"
                  >
                    Open user directory →
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-black text-white">{item.senderName}</p>
                <p className="text-slate-400">
                  {item.senderEmail || "No email on file"}
                </p>
                <p className="text-slate-500">
                  No linked SitGuru profile found for this sender.
                </p>
              </div>
            )}
            {item.relatedBookingId ? (
              <Link
                href={`/admin/bookings?booking=${item.relatedBookingId}`}
                className="mt-3 inline-flex text-xs font-bold text-emerald-300 hover:text-emerald-200"
              >
                Related booking →
              </Link>
            ) : null}
          </section>

          <section>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Conversational history
            </p>
            <div className="mt-3 space-y-3">
              {timeline.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    message.authorRole === "admin"
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : message.authorRole === "system"
                        ? "border-amber-400/20 bg-amber-400/10"
                        : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-white">
                      {message.author}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {message.body}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {message.channel} · {message.authorRole}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Quick modifiers
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </span>
                <select
                  value={item.status === "converted" ? "closed" : item.status}
                  disabled={pending}
                  onChange={(event) => onPatch({ status: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-300/50"
                >
                  {QUICK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Priority
                </span>
                <select
                  value={
                    item.priority === "high"
                      ? "urgent"
                      : item.priority === "medium"
                        ? "normal"
                        : item.priority
                  }
                  disabled={pending}
                  onChange={(event) =>
                    onPatch({ priority: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-300/50"
                >
                  <option value="low">Low</option>
                  <option value="normal">Medium</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Assign to
                </span>
                <select
                  value={item.assignedTo}
                  disabled={pending}
                  onChange={(event) =>
                    onPatch({ assignedTo: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-300/50"
                >
                  <option value="">Unassigned</option>
                  {item.assignedTo &&
                  !assignees.some((admin) => admin.label === item.assignedTo) ? (
                    <option value={item.assignedTo}>{item.assignedTo}</option>
                  ) : null}
                  {assignees.map((admin) => (
                    <option key={admin.id || admin.email} value={admin.label}>
                      {admin.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onPatch({ status: "closed" })}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
              >
                Mark Resolved
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onPatch({ priority: "urgent" })}
                className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-40"
              >
                Escalate Priority
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onPatch({ status: "waiting_response" })}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-40"
              >
                Mark Pending
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">
              Message dispatch console
            </p>
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="Draft reply to the sender…"
              className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
            />
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Internal note (optional)"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
            />
            <label className="mt-3 flex items-center gap-3 text-xs font-bold text-emerald-50/90">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(event) => setSendEmail(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-emerald-500"
              />
              Send email reply to sender
            </label>
            <button
              type="button"
              disabled={pending || !replyBody.trim()}
              onClick={async () => {
                await onPatch({
                  replyBody: replyBody.trim(),
                  notes: notes.trim() || undefined,
                  sendEmail,
                  status:
                    item.status === "new" ? "in_review" : item.status,
                });
                setReplyBody("");
                setNotes("");
              }}
              className="mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
            >
              {pending ? "Dispatching…" : "Dispatch reply"}
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
