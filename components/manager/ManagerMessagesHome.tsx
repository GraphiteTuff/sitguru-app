"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Flag,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Users,
  Video,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { reportMessage } from "@/lib/messaging/staff-actions";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

type Attachment = { url: string; mimeType: string; name: string };
type Message = {
  id: string;
  internal: boolean;
  author: string;
  avatarUrl: string;
  body: string;
  createdAt?: string;
  attachments: Attachment[];
};
type Conversation = {
  id: string;
  subject: string;
  peerName?: string;
  peerAvatar?: string;
  fullSubject: string;
  typeLabel: string;
  statusLabel: string;
  preview: string;
  updatedAt?: string;
  unreadCount?: number;
  recipientId?: string;
  messages: Message[];
};

const ZONE = "America/New_York";

function clock(value?: string) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "";
  return new Date(time).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONE,
  });
}

function whenLabel(value?: string) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  const now = new Date();
  const day = date.toLocaleDateString("en-US", { timeZone: ZONE });
  const today = now.toLocaleDateString("en-US", { timeZone: ZONE });
  if (day === today) return clock(value);
  const yesterday = new Date(now.getTime() - 86_400_000).toLocaleDateString("en-US", { timeZone: ZONE });
  if (day === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: ZONE });
}

function unread(conversation: Conversation) {
  return (conversation.unreadCount || 0) > 0;
}

export default function ManagerMessagesHome({
  me,
  conversations,
  showAdminRecord,
  returnTo = "/manager/messages",
  notice,
  noticeError = false,
  audience = "manager",
}: {
  me: { firstName: string; avatarUrl: string };
  conversations: Conversation[];
  showAdminRecord: boolean;
  returnTo?: string;
  notice?: string | null;
  noticeError?: boolean;
  audience?: "manager" | "intern";
}) {
  const marked = useRef(new Set<string>());
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState(conversations);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [fileLabel, setFileLabel] = useState("");
  const [media, setMedia] = useState<Attachment[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [people, setPeople] = useState<{ id: string; firstName: string; avatarUrl: string; detail: string }[]>([]);
  const [audiencePick, setAudiencePick] = useState("intern");
  const [personQuery, setPersonQuery] = useState("");
  useEffect(() => { setThreads(conversations); }, [conversations]);
  const selected = threads.find((item) => item.id === selectedId) || null;
  const messageFiles = (message: Message) => message.attachments || [];
  const teamCount = useMemo(() => {
    const names = new Set<string>();
    threads.forEach((conversation) => {
      names.add(conversation.peerName || conversation.subject);
      (conversation.messages || []).forEach((message) => names.add(message.author));
    });
    return names.size;
  }, [threads]);
  const unreadCount = threads.filter(unread).length;
  const announcements = threads.filter((item) => /announce|broadcast/i.test(`${item.typeLabel} ${item.fullSubject}`)).length;
  const visible = threads.filter((item) => {
    const haystack = `${item.subject} ${item.peerName || ""} ${item.fullSubject} ${item.preview}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    if (filter === "unread") return unread(item);
    if (filter === "announcements") return /announce|broadcast/i.test(`${item.typeLabel} ${item.fullSubject}`);
    return true;
  });
  const files = (selected?.messages || []).reduce((sum, message) => sum + messageFiles(message).length, 0);
  const base = audience === "intern" ? "/intern" : "/manager";
  useEffect(() => {
    if (!selectedId || selectedId.startsWith("new-") || marked.current.has(selectedId)) return;
    marked.current.add(selectedId);
    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ conversationId: selectedId }),
    })
      .then((response) => response.json())
      .then((payload: { marked?: number }) => {
        if ((payload.marked || 0) > 0) {
          setThreads((current) => current.map((item) => item.id === selectedId ? { ...item, unreadCount: 0 } : item));
        }
      })
      .catch(() => undefined);
  }, [selectedId]);

  const mine = (author: string) => author.toLowerCase() === me.firstName.toLowerCase();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [selected?.messages.length, selectedId]);

  useEffect(() => {
    if (!selectedId || selectedId.startsWith("new-")) return;
    const timer = window.setInterval(() => {
      void fetch(`/api/messaging/thread?id=${encodeURIComponent(selectedId)}`, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { messages?: Message[] }) => {
          if (!payload.messages?.length) return;
          const messages = payload.messages.map((message) => ({
            ...message,
            attachments: message.attachments || [],
            internal: Boolean(message.internal),
          }));
          setThreads((current) => current.map((item) => item.id === selectedId ? { ...item, messages } : item));
        })
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [selectedId]);

  useEffect(() => {
    if (audience !== "manager" || selectedId) return;
    const timer = window.setTimeout(() => {
      void fetch(`/api/messaging/people?audience=${audiencePick}&q=${encodeURIComponent(personQuery)}`, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { people?: { id: string; firstName: string; avatarUrl: string; detail: string }[] }) => setPeople(payload.people || []))
        .catch(() => setPeople([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [audience, audiencePick, personQuery, selectedId]);

  async function sendLive(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (sending || (!text && !media.length)) return;
    setSending(true);
    setError("");
    const optimisticId = `local-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      internal: false,
      author: me.firstName,
      avatarUrl: me.avatarUrl,
      body: text || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment"),
      createdAt: new Date().toISOString(),
      attachments: media,
    };
    if (selectedId) {
      setThreads((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        preview: optimistic.body,
        updatedAt: optimistic.createdAt,
        messages: [...item.messages, optimistic],
      } : item));
    }
    setDraft("");
    const sentMedia = media;
    setMedia([]);
    setFileLabel("");
    composerRef.current?.focus();
    const response = await fetch("/api/messaging/staff-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        conversationId: selectedId.startsWith("new-") ? "" : selectedId,
        body: text,
        media: sentMedia,
        recipientId: selected?.recipientId,
        audience: audiencePick,
      }),
    });
    const payload = await response.json() as { ok?: boolean; error?: string; conversationId?: string; message?: Message; peerName?: string; peerAvatar?: string };
    setSending(false);
    if (!response.ok || !payload.ok || !payload.message || !payload.conversationId) {
      setError(payload.error || "The message could not be sent.");
      setDraft(text);
      return;
    }
    setThreads((current) => {
      const id = payload.conversationId || selectedId;
      const existing = current.find((item) => item.id === selectedId || item.id === id);
      const nextMessages = (existing?.messages || []).filter((item) => item.id !== optimisticId).concat(payload.message!);
      const next = {
        id,
        subject: payload.peerName || existing?.subject || "Chat",
        peerName: payload.peerName || existing?.peerName,
        peerAvatar: payload.peerAvatar || existing?.peerAvatar,
        fullSubject: existing?.fullSubject || payload.peerName || "SitGuru chat",
        typeLabel: existing?.typeLabel || "chat",
        statusLabel: existing?.statusLabel || "open",
        preview: payload.message!.body,
        updatedAt: payload.message!.createdAt,
        unreadCount: 0,
        messages: nextMessages,
      };
      return [next, ...current.filter((item) => item.id !== selectedId && item.id !== id)];
    });
    if (payload.conversationId) setSelectedId(payload.conversationId);
    composerRef.current?.focus();
  }

  function startWith(person: { id: string; firstName: string; avatarUrl: string; detail: string }) {
    const id = `new-${person.id}`;
    setShowMobileThread(true);
    setThreads((current) => [{
      id,
      subject: person.firstName,
      peerName: person.firstName,
      peerAvatar: person.avatarUrl,
      fullSubject: person.firstName,
      typeLabel: person.detail,
      statusLabel: "open",
      preview: "",
      unreadCount: 0,
      recipientId: person.id,
      messages: [],
    }, ...current.filter((item) => item.id !== id)]);
    setSelectedId(id);
    composerRef.current?.focus();
  }

  async function attach(file: File, conversationId: string) {
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("conversationId", conversationId || "staff");
    const response = await fetch("/api/messaging/upload", {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });
    const payload = (await response.json()) as { error?: string; media?: Attachment };
    if (!response.ok || !payload.media?.url) {
      setError(payload.error || "That file could not be attached.");
      return;
    }
    setMedia((current) => [...current, payload.media!]);
    setFileLabel(payload.media.name || file.name);
  }

  function openConversation(id: string) {
    setSelectedId(id);
    setShowMobileThread(true);
    setMedia([]);
    setFileLabel("");
  }

  return (
    <div className="space-y-4 pb-28 lg:pb-6">
      <DeskPageHero
        icon={<MessageCircle size={22} />}
        title="Messages"
        subtitle={audience === "intern" ? "Message your manager by first name. Your notes stay in SitGuru." : "Stay connected with your team and interns."}
        banner={audience === "intern" ? "intern" : "manager"}
        quote={"Connected\nCommunities.\nHappier Pets."}
      />
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${noticeError ? "bg-rose-50 text-rose-800" : "bg-[#F0FDF4] text-[#166534]"}`}>{notice}</p>
      ) : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}

      <section className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <MiniStat icon={<MessageCircle size={18} />} tone="text-[#2563EB] bg-[#EFF6FF]" value={conversations.length} label="Total Conversations" />
        <MiniStat icon={<Mail size={18} />} tone="text-[#15803D] bg-[#F0FDF4]" value={unreadCount} label="Unread Messages" />
        <MiniStat icon={<Users size={18} />} tone="text-[#7C3AED] bg-[#F5F3FF]" value={teamCount} label="Team Members" />
        <MiniStat icon={<Send size={18} />} tone="text-[#C2410C] bg-[#FFF7ED]" value={announcements} label="Announcements" />
        <button
          type="button"
          onClick={() => openConversation("")}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-bold !text-white"
        >
          <Plus size={16} /> New Message
        </button>
      </section>

      <section className={`${DESK_UI.card} grid min-h-[680px] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_280px]`}>
        <aside className={`${showMobileThread ? "hidden" : "flex"} min-h-0 flex-col border-slate-100 lg:flex lg:border-r`}>
          <div className="flex gap-2 p-3">
            <label className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations..."
                className="min-h-10 w-full rounded-full bg-[#F1F5F9] pl-8 pr-3 text-sm font-medium outline-none"
              />
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="min-h-10 rounded-full bg-[#F1F5F9] px-3 text-sm font-bold text-[#0F2744]"
              aria-label="Filter conversations"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="announcements">Announcements</option>
            </select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((conversation) => {
              const hot = unread(conversation);
              const active = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => openConversation(conversation.id)}
                  className={`flex w-full gap-3 px-3 py-3 text-left ${active ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}
                >
                  <Face name={conversation.peerName || conversation.subject} src={conversation.peerAvatar} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-[#0F2744]">{conversation.peerName || conversation.subject}</span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">{whenLabel(conversation.updatedAt)}</span>
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{conversation.fullSubject}</span>
                    <span className="block truncate text-xs text-slate-400">{conversation.preview || conversation.typeLabel}</span>
                  </span>
                  {hot ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2563EB]" /> : null}
                </button>
              );
            })}
            {!visible.length ? (
              <p className="px-4 py-8 text-sm font-medium text-slate-500">No team conversations yet.</p>
            ) : null}
          </div>
        </aside>

        <div className={`${showMobileThread || !threads.length ? "flex" : "hidden"} min-h-[420px] flex-col lg:flex`}>
          <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <button type="button" className="lg:hidden" onClick={() => setShowMobileThread(false)} aria-label="Back to conversations">
              ←
            </button>
            <Face name={selected?.peerName || selected?.subject || "New"} src={selected?.peerAvatar || selected?.messages.find((message) => !mine(message.author))?.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-black text-[#0F2744]">{selected?.peerName || selected?.subject || "New message"}</p>
              <p className="text-xs font-medium text-slate-500">{selected?.fullSubject || "Internal team note"}</p>
            </div>
            {showAdminRecord && selected ? (
              <a href={`/admin/messages?c=${selected.id}`} className="ml-auto text-xs font-bold text-[#2563EB]">
                Admin record
              </a>
            ) : null}
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            {selected?.messages.map((message) => {
              const own = mine(message.author);
              return (
                <article key={message.id} className={`flex items-end gap-2 ${own ? "flex-row-reverse" : ""}`}>
                  <Face name={message.author} src={message.avatarUrl} />
                  <div className={`max-w-[78%] ${own ? "text-right" : ""}`}>
                    {own ? null : <p className="mb-1 text-xs font-bold text-[#0F2744]">{message.author}</p>}
                    <div className={`rounded-2xl px-3 py-2 text-left text-sm font-medium ${own ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      {messageFiles(message).map((file) => (
                        <a key={file.url} href={file.url} className={`mt-1 block text-xs font-bold underline ${own ? "!text-white" : "text-[#2563EB]"}`}>
                          {file.name}
                        </a>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">{clock(message.createdAt)}</p>
                  </div>
                </article>
              );
            })}
            {!selected && audience === "manager" ? (
              <div className="m-auto w-full max-w-md">
                <p className="text-center text-sm font-semibold text-slate-500">Start a chat. First names and photos stay with the message.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {["intern", "parent", "guru", "ambassador"].map((item) => (
                    <button key={item} type="button" onClick={() => setAudiencePick(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${audiencePick === item ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                      {item === "parent" ? "Pet Parents" : item === "intern" ? "Interns" : item === "guru" ? "Gurus" : "Ambassadors"}
                    </button>
                  ))}
                </div>
                <input value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} placeholder="Search by first name" className="mt-3 min-h-11 w-full rounded-full bg-[#F1F5F9] px-4 text-sm" />
                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                  {people.map((person) => (
                    <li key={person.id}>
                      <button type="button" onClick={() => void startWith(person)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-[#F8FAFC]">
                        <Face name={person.firstName} src={person.avatarUrl} />
                        <span>
                          <span className="block text-sm font-bold text-[#0F2744]">{person.firstName}</span>
                          <span className="text-xs text-slate-500">{person.detail}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : !selected?.messages.length ? (
              <p className="m-auto max-w-sm text-center text-sm font-medium text-slate-500">
                Write a note in SitGuru. Use first names.
              </p>
            ) : null}
            <div ref={endRef} />
          </div>
          {fileLabel ? <p className="px-4 text-xs font-bold text-[#166534]">Attached {fileLabel}</p> : null}
          <form onSubmit={(event) => void sendLive(event)} className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
                <Paperclip size={18} />
                <span className="sr-only">Attach a file</span>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.txt,.csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void attach(file, selected?.id || "staff");
                  }}
                />
              </label>
              <textarea
                ref={composerRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendLive();
                  }
                }}
                rows={1}
                autoFocus
                placeholder="Message"
                className="min-h-11 flex-1 resize-none rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium"
              />
              <button disabled={sending} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] !text-white disabled:opacity-50" aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

        <aside className="hidden border-l border-slate-100 p-4 lg:block">
          <h2 className="text-sm font-black text-[#0F2744]">Conversation Details</h2>
          {selected ? (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <Face name={selected.peerName || selected.subject} src={selected.peerAvatar} />
                <div>
                  <p className="font-bold text-[#0F2744]">{selected.peerName || selected.subject}</p>
                  <p className="text-xs text-slate-500">{selected.typeLabel}</p>
                  <p className="text-xs font-semibold text-[#166534]">{selected.statusLabel.replaceAll("_", " ")}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-500">
                <a href={sitguruTeamsHref()} className="rounded-2xl bg-[#F8FAFC] py-2"><Phone size={16} className="mx-auto text-[#2563EB]" />Call</a>
                <a href={sitguruTeamsHref()} className="rounded-2xl bg-[#F8FAFC] py-2"><Video size={16} className="mx-auto text-[#2563EB]" />Video</a>
                <Link href="/manager/messages" className="rounded-2xl bg-[#F8FAFC] py-2"><Mail size={16} className="mx-auto text-[#2563EB]" />Email</Link>
                <Link href={audience === "intern" ? "/intern/calendar" : "/manager/calendar"} className="rounded-2xl bg-[#F8FAFC] py-2"><CalendarDays size={16} className="mx-auto text-[#2563EB]" />Schedule</Link>
              </div>
              <h3 className="mt-5 text-sm font-black text-[#0F2744]">Related Information</h3>
              <ul className="mt-2 space-y-2 text-sm font-semibold text-slate-600">
                <li><Link href={`${base}/assignments`} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-slate-50"><span className="inline-flex items-center gap-2"><FileText size={14} /> Assignments</span><span>Open →</span></Link></li>
                <li><Link href={`${base}/check-ins`} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-slate-50"><span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Check-Ins</span><span>Open →</span></Link></li>
                <li><Link href={`${base}/milestones`} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-slate-50"><span className="inline-flex items-center gap-2"><Flag size={14} /> Milestones</span><span>Open →</span></Link></li>
                <li className="flex items-center justify-between px-1 py-1"><span className="inline-flex items-center gap-2"><Paperclip size={14} /> Files Shared</span><span>{files} Files</span></li>
              </ul>
              <h3 className="mt-5 text-sm font-black text-[#0F2744]">Quick Actions</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href={`${base}/calendar`} className="rounded-2xl bg-[#F8FAFC] px-2 py-3 text-center text-xs font-bold text-[#0F2744]">Schedule Meeting</Link>
                <button type="button" className="rounded-2xl bg-[#F8FAFC] px-2 py-3 text-xs font-bold text-[#0F2744]" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>Share Files</button>
                <Link href={audience === "intern" ? "/intern" : "/manager/team"} className="rounded-2xl bg-[#F8FAFC] px-2 py-3 text-center text-xs font-bold text-[#0F2744]">View Profile</Link>
                <span className="inline-flex items-center justify-center gap-1 rounded-2xl bg-[#F8FAFC] px-2 py-3 text-xs font-bold text-[#0F2744]"><MoreHorizontal size={14} /> More</span>
              </div>
              <form action={reportMessage} className="mt-4 grid gap-2">
                <input type="hidden" name="conversationId" value={selected.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <select name="reason" className="min-h-10 rounded-xl border border-slate-200 px-2 text-xs font-semibold">
                  <option>Harassment</option>
                  <option>Safety Concern</option>
                  <option>Confidential Information</option>
                  <option>Other</option>
                </select>
                <button className="min-h-10 rounded-xl border border-rose-200 text-xs font-bold text-rose-800">Report conversation</button>
              </form>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-slate-500">Choose a conversation to see details.</p>
          )}
        </aside>
      </section>
    </div>
  );
}

function MiniStat({ icon, tone, value, label }: { icon: ReactNode; tone: string; value: number; label: string }) {
  return (
    <article className={`${DESK_UI.card} flex items-center gap-3 px-4 py-3`}>
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>{icon}</span>
      <span>
        <span className="block text-2xl font-black leading-none text-[#0F2744]">{value}</span>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </span>
    </article>
  );
}

function Face({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-black text-[#1D4ED8] ring-1 ring-slate-200">
      <span className="absolute inset-0 bg-white" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} src={src} className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1]">{deskInitials(name)}</span>
      )}
    </span>
  );
}
