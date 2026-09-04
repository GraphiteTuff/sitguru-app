"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, Plus, Search } from "lucide-react";
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
        className="h-12 w-12 shrink-0 rounded-full border border-green-100 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800">
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
}) {
  const showThreadPane = Boolean(composeOpen || selectedThread);
  const listHiddenOnMobile = showThreadPane;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8f4]">
      {noticeSlot ? <div className="shrink-0 px-3 pt-2 sm:px-4">{noticeSlot}</div> : null}

      <div className="flex min-h-0 flex-1 overflow-hidden bg-white lg:border-t lg:border-[#e5ebe2]">
        <aside
          className={`min-h-0 w-full shrink-0 flex-col lg:flex lg:w-[min(100%,380px)] lg:border-r lg:border-[#e5ebe2] ${
            listHiddenOnMobile ? "hidden" : "flex"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5ebe2] px-3 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
                SitGuru HQ
              </p>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Messages
              </h1>
            </div>
            <Link
              href={composeHref}
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black text-white shadow-sm"
            >
              <Plus size={18} />
              <span className="sm:inline">New</span>
            </Link>
          </div>

          <form
            action="/admin/messages"
            className="shrink-0 border-b border-[#e5ebe2] px-3 py-2.5 sm:px-4"
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
                className="min-h-12 w-full rounded-2xl border border-[#dfe7df] bg-[#fbfcf9] pl-11 pr-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </label>
          </form>

          <div className="shrink-0 overflow-x-auto border-b border-[#e5ebe2] px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-1.5">
              {filters.map((filter) => {
                const active = filter.key === activeFilter;
                return (
                  <Link
                    key={filter.key}
                    href={filter.href}
                    className={`inline-flex min-h-12 items-center gap-1.5 rounded-2xl px-3.5 text-sm font-black transition ${
                      active
                        ? "bg-[#0D5C3A] text-white"
                        : "bg-[#f7faf6] text-slate-600"
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

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                return (
                  <Link
                    key={thread.id}
                    href={thread.href}
                    className={`flex min-h-16 items-center gap-3 border-b border-[#f0f4ef] px-3 py-3 sm:px-4 ${
                      active ? "bg-green-50" : "active:bg-[#f7faf6]"
                    }`}
                  >
                    <div className="relative">
                      <Avatar name={thread.title} src={thread.avatar} />
                      {thread.unreadCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#0D5C3A] ring-2 ring-white" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`truncate text-[17px] ${
                            thread.unreadCount > 0
                              ? "font-black text-slate-950"
                              : "font-bold text-slate-800"
                          }`}
                        >
                          {thread.title}
                        </p>
                        <span className="shrink-0 text-xs font-bold text-slate-400">
                          {thread.timeLabel}
                        </span>
                      </div>
                      <p className="truncate text-xs font-bold text-green-800">
                        {thread.subtitle}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-sm ${
                          thread.unreadCount > 0
                            ? "font-semibold text-slate-700"
                            : "font-medium text-slate-500"
                        }`}
                      >
                        {thread.preview}
                      </p>
                    </div>
                    {thread.unreadCount > 0 ? (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0D5C3A] px-1.5 text-[11px] font-black text-white">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })
            )}
          </div>

          <details className="hidden shrink-0 border-t border-[#e5ebe2] px-3 py-2 lg:block">
            <summary className="cursor-pointer list-none text-xs font-black text-slate-500 [&::-webkit-details-marker]:hidden">
              Admin tools
            </summary>
            <div className="mt-2 space-y-2">
              <Link
                href="/admin/messages/export"
                className="inline-flex min-h-11 items-center text-sm font-black text-green-800"
              >
                Export messages
              </Link>
              <ClearAllMessagesForm />
            </div>
          </details>
        </aside>

        <div
          className={`min-h-0 min-w-0 flex-1 flex-col ${
            showThreadPane ? "flex" : "hidden lg:flex"
          }`}
        >
          {composeOpen && composeSlot ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4">
              {composeSlot}
            </div>
          ) : selectedThread ? (
            <AdminThreadChat thread={selectedThread} inboxHref={inboxHref} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <MessageCircle size={26} />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">
                Select a conversation
              </h2>
              <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
                Pick a thread, or start a new message to a Pet Parent, Guru,
                Ambassador, or Admin.
              </p>
              <Link
                href={composeHref}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
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
