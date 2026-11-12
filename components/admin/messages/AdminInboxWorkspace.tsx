"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import ClearAllMessagesForm from "@/components/admin/ClearAllMessagesForm";
import type { AdminInboxFilter, AdminInboxThread, AdminSelectedThread } from "./types";
import AdminThreadChat from "./AdminThreadChat";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={src}
        className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-white object-cover sm:h-12 sm:w-12"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-800 sm:h-12 sm:w-12">
      {initials(name)}
    </div>
  );
}

export default function AdminInboxWorkspace({
  threads,
  filters,
  activeFilter,
  query,
  unreadTotal,
  selectedThreadId,
  selectedThread,
  composeOpen,
  composeSlot,
  noticeSlot,
  inboxHref,
  composeHref,
  canDelete = false,
}: {
  threads: AdminInboxThread[];
  filters: AdminInboxFilter[];
  activeFilter: string;
  query: string;
  unreadTotal: number;
  selectedThreadId?: string;
  selectedThread?: AdminSelectedThread | null;
  composeOpen?: boolean;
  composeSlot?: ReactNode;
  noticeSlot?: ReactNode;
  inboxHref: string;
  composeHref: string;
  canDelete?: boolean;
}) {
  const showThreadPane = Boolean(composeOpen || selectedThread);
  const selectedUnreadCount =
    threads.find((thread) => thread.id === selectedThreadId)?.unreadCount || 0;
  const displayFilters = filters.map((filter) => {
    if (filter.key !== "unread" || selectedUnreadCount <= 0) return filter;
    return { ...filter, count: Math.max(0, filter.count - 1) };
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [pendingBulk, startBulk] = useTransition();

  const allVisibleIds = useMemo(() => threads.map((thread) => thread.id), [threads]);
  const selectedCount = selectedIds.size;
  const allSelected =
    allVisibleIds.length > 0 && selectedCount === allVisibleIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(allVisibleIds);
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [allVisibleIds]);

  function toggleId(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      if (current.size === allVisibleIds.length) return new Set();
      return new Set(allVisibleIds);
    });
  }

  function deleteSelected() {
    if (!canDelete || selectedCount === 0 || pendingBulk) return;
    const confirmed = window.confirm(
      `Delete ${selectedCount} conversation${selectedCount === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    setBulkError(null);
    startBulk(async () => {
      try {
        const response = await fetch("/api/admin/messages/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationIds: [...selectedIds] }),
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || `Delete failed (${response.status}).`);
        }
        window.location.assign(
          `/admin/messages?compose_success=deleted&t=${Date.now()}`,
        );
      } catch (err) {
        setBulkError(err instanceof Error ? err.message : "Bulk delete failed.");
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F4F7FB]">
      {noticeSlot ? (
        <div className="shrink-0 px-3 pt-2 sm:px-4">{noticeSlot}</div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden bg-white md:border-t md:border-slate-200">
        <aside
          className={`min-h-0 w-full shrink-0 flex-col border-slate-200 md:flex md:w-[min(100%,300px)] md:border-r lg:w-[320px] xl:w-[360px] ${
            showThreadPane ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                SitGuru HQ
              </p>
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Messages
              </h1>
            </div>
            <Link
              href={composeHref}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0D5C3A] px-3.5 text-sm font-black text-white shadow-sm"
            >
              <Plus size={18} />
              <span className="sm:inline">New</span>
            </Link>
          </div>

          <form
            action="/admin/messages"
            className="shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-4"
          >
            {activeFilter !== "all" ? (
              <input type="hidden" name="filter" value={activeFilter} />
            ) : null}
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search people and messages"
                autoComplete="off"
                enterKeyHint="search"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-11 pr-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </form>

          <div className="shrink-0 overflow-x-auto border-b border-slate-200 px-2 py-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-1.5">
              {displayFilters.map((filter) => {
                const active = filter.key === activeFilter;
                return (
                  <Link
                    key={filter.key}
                    href={filter.href}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-black transition ${
                      active
                        ? "bg-[#0D5C3A] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter.label}
                    {filter.count > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                        }`}
                      >
                        {filter.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Email-style bulk bar: select-all checkbox + delete when anything is checked */}
          {canDelete && threads.length > 0 ? (
            <div
              className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4 ${
                selectedCount > 0
                  ? "border-rose-100 bg-rose-50"
                  : "border-slate-100 bg-[#F8FAFC]"
              }`}
            >
              <label className="inline-flex min-h-10 items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-emerald-500"
                  aria-label="Select all conversations"
                />
                <span className="text-xs font-black text-slate-600">
                  {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
                </span>
              </label>
              {selectedCount > 0 ? (
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={pendingBulk}
                  className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-rose-700 px-3 text-xs font-black text-white disabled:opacity-50"
                >
                  {pendingBulk ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
          {bulkError ? (
            <p className="shrink-0 border-b border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 sm:px-4">
              {bulkError}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            {threads.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MessageCircle className="mx-auto mb-3 text-slate-300" size={32} />
                <p className="text-base font-black text-slate-900">No conversations</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {unreadTotal > 0
                    ? "Nothing matches this filter."
                    : "Start a message to a Pet Parent, Guru, Ambassador, or Admin."}
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const active = thread.id === selectedThreadId;
                const unreadCount = active ? 0 : thread.unreadCount;
                const checked = selectedIds.has(thread.id);
                const rowClass = `flex min-h-[4.25rem] items-center gap-2 border-b border-slate-100 px-2 py-2.5 transition sm:gap-3 sm:px-3 ${
                  checked
                    ? "bg-rose-50/70"
                    : active
                      ? "bg-emerald-50/80"
                      : "hover:bg-slate-50 active:bg-slate-100"
                }`;

                return (
                  <div key={thread.id} className={rowClass}>
                    {canDelete ? (
                      <label
                        className="inline-flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(thread.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-emerald-500"
                          aria-label={`Select ${thread.title}`}
                        />
                      </label>
                    ) : null}
                    <Link
                      href={thread.href}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="relative">
                        <Avatar name={thread.title} src={thread.avatar} />
                        {unreadCount > 0 ? (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#0D5C3A] ring-2 ring-white" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate text-[15px] sm:text-[16px] ${
                              unreadCount > 0
                                ? "font-black text-slate-950"
                                : "font-bold text-slate-800"
                            }`}
                          >
                            {thread.title}
                          </p>
                          <span className="shrink-0 text-[11px] font-bold text-slate-400">
                            {thread.timeLabel}
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                          {thread.subtitle}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-sm ${
                            unreadCount > 0
                              ? "font-semibold text-slate-700"
                              : "font-medium text-slate-500"
                          }`}
                        >
                          {thread.preview}
                        </p>
                      </div>
                      {unreadCount > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0D5C3A] px-1.5 text-[11px] font-black text-white">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          <details className="shrink-0 border-t border-slate-200 bg-[#F8FAFC] px-3 py-2">
            <summary className="cursor-pointer list-none py-1 text-xs font-black text-slate-500 [&::-webkit-details-marker]:hidden">
              Admin tools
            </summary>
            <div className="mt-1 space-y-2 pb-1">
              <Link
                href="/admin/messages/export"
                className="inline-flex min-h-10 items-center text-sm font-black text-emerald-800"
              >
                Export messages
              </Link>
              {canDelete ? <ClearAllMessagesForm compact /> : null}
            </div>
          </details>
        </aside>

        <div
          className={`min-h-0 min-w-0 flex-1 flex-col bg-[#F8FAFC] ${
            showThreadPane ? "flex" : "hidden md:flex"
          }`}
        >
          {composeOpen && composeSlot ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-5">
              <div className="mx-auto w-full max-w-3xl">{composeSlot}</div>
            </div>
          ) : selectedThread ? (
            <AdminThreadChat
              thread={selectedThread}
              inboxHref={inboxHref}
              canDelete={canDelete}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <MessageCircle size={26} />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">
                Select a conversation
              </h2>
              <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
                Check conversations to delete, or open a thread to reply.
              </p>
              <Link
                href={composeHref}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
              >
                <Plus size={16} />
                New message
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
