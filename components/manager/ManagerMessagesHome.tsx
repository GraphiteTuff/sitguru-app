"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Check, ChevronDown, FileText, Inbox,
  LoaderCircle, Mail, MessageCircle, Paperclip, Plus, RefreshCw,
  Search, Send, Users, X, ExternalLink, AlertCircle,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { reportMessage } from "@/lib/messaging/staff-actions";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

type Attachment = { url: string; mimeType: string; name: string };
type Message = {
  id: string;
  internal: boolean;
  own?: boolean;
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
type Person = {
  id: string;
  firstName: string;
  avatarUrl: string;
  detail: string;
  canChat?: boolean;
};

const ZONE = "America/New_York";
const AUDIENCES = [
  { value: "intern", label: "Interns" },
  { value: "staff", label: "Staff" },
  { value: "parent", label: "Pet Parents" },
  { value: "guru", label: "Gurus" },
  { value: "ambassador", label: "Ambassadors" },
  { value: "admin", label: "Admin" },
] as const;

function clock(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: ZONE });
}
function relativeTime(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  const date = new Date(value);
  const today = new Date();
  const day = date.toLocaleDateString("en-US", { timeZone: ZONE });
  if (day === today.toLocaleDateString("en-US", { timeZone: ZONE })) return clock(value);
  const yesterday = new Date(today.getTime() - 86400000).toLocaleDateString("en-US", { timeZone: ZONE });
  return day === yesterday ? "Yesterday" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: ZONE });
}
function Face({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" }) {
  return (
    <span className={"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white font-black text-[#1D4ED8] ring-1 ring-slate-200 " + (size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs")}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={src} className="h-full w-full object-cover object-center" />
      ) : <span aria-hidden="true">{deskInitials(name)}</span>}
    </span>
  );
}
function isAnnouncement(item: Conversation) {
  return /announce|broadcast/i.test(item.typeLabel + " " + item.fullSubject);
}
function initialSort(items: Conversation[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""));
}

export default function ManagerMessagesHome({
  me,
  conversations,
  showAdminRecord,
  returnTo = "/manager/messages",
  notice,
  noticeError = false,
  audience = "manager",
  initialConversationId = "",
}: {
  me: { firstName: string; avatarUrl: string };
  conversations: Conversation[];
  showAdminRecord: boolean;
  returnTo?: string;
  notice?: string | null;
  noticeError?: boolean;
  audience?: "manager" | "intern";
  initialConversationId?: string;
}) {
  const [threads, setThreads] = useState(() => initialSort(conversations));
  const [selectedId, setSelectedId] = useState(() => conversations.some(item => item.id === initialConversationId) ? initialConversationId : "");
  const [newConversation, setNewConversation] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(() => conversations.some(item => item.id === initialConversationId));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "announcements">("all");
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [audiencePick, setAudiencePick] = useState(audience === "manager" ? "intern" : "staff");
  const [personQuery, setPersonQuery] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const reading = useRef(new Set<string>());

  useEffect(() => { setThreads(initialSort(conversations)); }, [conversations]);
  const selected = threads.find(item => item.id === selectedId) || null;
  const unreadThreads = threads.filter(item => (item.unreadCount || 0) > 0).length;
  const unreadMessages = threads.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const uniquePeople = new Set(threads.map(item => item.peerName || item.subject)).size;
  const visible = useMemo(() => initialSort(threads.filter(item => {
    if (filter === "unread" && !(item.unreadCount || 0)) return false;
    if (filter === "announcements" && !isAnnouncement(item)) return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return [
      item.peerName, item.subject, item.fullSubject, item.preview, item.typeLabel,
      ...item.messages.map(message => message.body),
    ].join(" ").toLowerCase().includes(search);
  })), [threads, filter, query]);

  const refreshInbox = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch("/api/messaging/staff-inbox", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json() as { conversations?: Conversation[]; error?: string };
      if (!response.ok || !Array.isArray(data.conversations)) throw Error(data.error || "Unable to refresh messages.");
      setThreads(current => {
        const pending = current.filter(item => item.id.startsWith("new-"));
        const incoming = data.conversations || [];
        return initialSort([...pending.filter(item => !incoming.some(remote => remote.id === item.id)), ...incoming]);
      });
      setLastSync(new Date().toISOString());
      if (manual) setError("");
    } catch (problem) {
      if (manual) setError(problem instanceof Error ? problem.message : "Unable to refresh the inbox.");
    } finally {
      if (manual) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === "visible") void refreshInbox(); };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshInbox();
    }, 18000);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [refreshInbox]);

  // Mark read only after the user opens a conversation. Do not auto-mark the first
  // inbox item on mobile while its chat pane remains hidden.
  useEffect(() => {
    if (!selected || selected.id.startsWith("new-") || !(selected.unreadCount || 0)) return;
    if (reading.current.has(selected.id)) return;
    reading.current.add(selected.id);
    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ conversationId: selected.id }),
    }).then(response => {
      if (!response.ok) return;
      setThreads(current => current.map(item => item.id === selected.id ? { ...item, unreadCount: 0 } : item));
    }).catch(() => undefined).finally(() => { reading.current.delete(selected.id); });
  }, [selected?.id, selected?.unreadCount]);

  useEffect(() => {
    if (!selectedId || selectedId.startsWith("new-")) return;
    let active = true;
    async function loadThread() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/messaging/thread?id=" + encodeURIComponent(selectedId), {
          credentials: "same-origin", cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json() as { messages?: Message[] };
        if (!active || !Array.isArray(data.messages)) return;
        setThreads(current => current.map(item => {
          if (item.id !== selectedId) return item;
          const local = item.messages.filter(message => message.id.startsWith("local-") && !data.messages?.some(remote => remote.id === message.id));
          return { ...item, messages: [...data.messages!, ...local] };
        }));
      } catch { /* preserve the last good thread while offline */ }
    }
    void loadThread();
    const timer = window.setInterval(() => { void loadThread(); }, 8500);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId]);

  useEffect(() => {
    if (!newConversation) return;
    let active = true;
    setPeopleLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/messaging/people?audience=" + encodeURIComponent(audiencePick) +
          "&q=" + encodeURIComponent(personQuery), { credentials: "same-origin", cache: "no-store" });
        const data = await response.json() as { people?: Person[] };
        if (active) setPeople(response.ok && Array.isArray(data.people) ? data.people : []);
      } catch { if (active) setPeople([]); }
      finally { if (active) setPeopleLoading(false); }
    }, 220);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [newConversation, audiencePick, personQuery]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "auto" }); }, [selected?.messages.length, selectedId]);

  function openConversation(id: string) {
    setSelectedId(id);
    setNewConversation(false);
    setShowMobileThread(true);
    setMedia([]);
    setError("");
  }
  function beginNew() {
    setSelectedId("");
    setNewConversation(true);
    setShowMobileThread(true);
    setMedia([]);
    setError("");
    setPersonQuery("");
  }
  function choosePerson(person: Person) {
    if (person.canChat === false || !person.id || person.id.startsWith("pending:")) return;
    const id = "new-" + person.id;
    setThreads(current => [{
      id, subject: person.firstName, peerName: person.firstName, peerAvatar: person.avatarUrl,
      fullSubject: person.detail, typeLabel: person.detail, statusLabel: "open",
      preview: "", unreadCount: 0, recipientId: person.id, messages: [],
    }, ...current.filter(item => item.id !== id)]);
    setSelectedId(id);
    setNewConversation(false);
    setShowMobileThread(true);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  async function attach(file: File) {
    if (uploading) return;
    if (file.size > 25 * 1024 * 1024) {
      setError("Files must be smaller than 25 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("conversationId", selectedId.startsWith("new-") ? "staff" : selectedId || "staff");
      const response = await fetch("/api/messaging/upload", {
        method: "POST", credentials: "same-origin", body: form,
      });
      const data = await response.json() as { error?: string; media?: Attachment };
      if (!response.ok || !data.media?.url) throw Error(data.error || "The file could not be uploaded.");
      setMedia(current => [...current, data.media!]);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "File upload failed.");
    } finally { setUploading(false); }
  }

  async function sendLive(event?: FormEvent) {
    event?.preventDefault();
    if (sending || uploading) return;
    if (!selected) { setError("Choose a conversation or recipient first."); return; }
    const text = draft.trim();
    if (!text && !media.length) return;
    const before = selectedId;
    const currentMedia = media;
    const localId = "local-" + Date.now();
    const now = new Date().toISOString();
    const optimistic: Message = {
      id: localId, author: me.firstName, own: true, internal: false,
      avatarUrl: me.avatarUrl, body: text || (media[0]?.name ? "Attached " + media[0].name : "Attachment"),
      createdAt: now, attachments: currentMedia,
    };
    setSending(true);
    setError("");
    setThreads(current => current.map(item => item.id === before ? {
      ...item, messages: [...item.messages, optimistic], preview: optimistic.body, updatedAt: now,
    } : item));
    try {
      const response = await fetch("/api/messaging/staff-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          conversationId: before.startsWith("new-") ? "" : before,
          recipientId: selected.recipientId,
          audience: audiencePick,
          body: text,
          media: currentMedia,
        }),
      });
      const data = await response.json() as {
        ok?: boolean; error?: string; conversationId?: string;
        message?: Message; peerName?: string; peerAvatar?: string;
      };
      if (!response.ok || !data.ok || !data.message || !data.conversationId) {
        throw Error(data.error || "The message could not be sent.");
      }
      setThreads(current => {
        const previous = current.find(item => item.id === before || item.id === data.conversationId);
        const resultId = data.conversationId!;
        const next: Conversation = {
          ...previous!,
          id: resultId,
          subject: data.peerName || previous?.subject || "Chat",
          peerName: data.peerName || previous?.peerName || "Chat",
          peerAvatar: data.peerAvatar || previous?.peerAvatar || "",
          fullSubject: previous?.fullSubject || data.peerName || "SitGuru conversation",
          typeLabel: previous?.typeLabel || "chat",
          statusLabel: previous?.statusLabel || "open",
          preview: data.message!.body,
          updatedAt: data.message!.createdAt,
          unreadCount: 0,
          messages: [...(previous?.messages || []).filter(item => item.id !== localId && item.id !== data.message!.id), { ...data.message!, own: true }],
        };
        return [next, ...current.filter(item => item.id !== before && item.id !== resultId)];
      });
      setDraft("");
      setMedia([]);
      setSelectedId(data.conversationId);
      setLastSync(new Date().toISOString());
      window.setTimeout(() => composerRef.current?.focus(), 0);
    } catch (problem) {
      setThreads(current => current.map(item => item.id === before ? {
        ...item, messages: item.messages.filter(message => message.id !== localId),
      } : item));
      setError(problem instanceof Error ? problem.message : "Unable to send. Your draft is still here.");
    } finally { setSending(false); }
  }

  const attachments = selected?.messages.reduce((count, message) => count + (message.attachments || []).length, 0) || 0;
  const base = audience === "intern" ? "/intern" : "/manager";

  return (
    <div className="min-w-0 space-y-4 pb-24 lg:pb-8">
      <DeskPageHero
        icon={<MessageCircle size={22} />}
        title="Team Messages"
        subtitle={audience === "intern"
          ? "Stay in touch with your manager. Messages are saved in your SitGuru workspace."
          : "An easier way to communicate with interns, staff, Gurus and the SitGuru team."}
        banner={audience === "intern" ? "intern" : "manager"}
        quote="Better conversations. Stronger communities."
      />
      {notice ? (
        <p role={noticeError ? "alert" : "status"} className={"rounded-xl px-4 py-3 text-sm font-bold " +
          (noticeError ? "bg-rose-50 text-rose-800" : "bg-[#F0FDF4] text-[#166534]")}>{notice}</p>
      ) : null}
      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" aria-label="Dismiss message error" onClick={() => setError("")}><X size={17} /></button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#0F2744]">
          <Inbox size={17} className="text-[#2563EB]" aria-hidden="true" /> {threads.length} conversations
        </span>
        <button type="button" onClick={() => setFilter("unread")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#0F2744] hover:bg-[#EFF6FF]">
          <Mail size={17} className="text-[#0D5C3A]" aria-hidden="true" /> {unreadMessages} unread messages
        </button>
        <span className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#0F2744] sm:inline-flex">
          <Users size={17} className="text-[#7C3AED]" aria-hidden="true" /> {uniquePeople} contacts
        </span>
        <button type="button" onClick={() => void refreshInbox(true)} disabled={refreshing} aria-label="Refresh conversations"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#2563EB] hover:bg-[#EFF6FF] disabled:opacity-50">
          <RefreshCw size={16} aria-hidden="true" className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
        <button type="button" onClick={beginNew}
          className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">
          <Plus size={17} aria-hidden="true" /> New message
        </button>
      </div>
      <section className={DESK_UI.card + " grid min-w-0 overflow-hidden lg:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]"} aria-label="SitGuru conversations">
        <aside className={(showMobileThread ? "hidden " : "flex ") + "min-h-0 flex-col border-r border-slate-100 lg:flex"}>
          <div className="sticky top-0 z-10 space-y-3 border-b border-slate-100 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-[#0F2744]">Inbox</h2>
              <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-black text-[#2563EB]">{unreadThreads} unread</span>
            </div>
            <label className="relative block">
              <span className="sr-only">Search conversations</span>
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]" />
              <input type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
                placeholder="Search people or messages..."
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2 pl-10 pr-10 text-sm font-semibold text-[#0F2744] outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]" />
              {query ? <button aria-label="Clear conversation search" type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-slate-500"><X size={17} /></button> : null}
            </label>
            <div className="flex flex-wrap gap-2" aria-label="Filter conversations">
              {([
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "announcements", label: "Announcements" },
              ] as const).map(option => (
                <button key={option.key} type="button" aria-pressed={filter === option.key} onClick={() => setFilter(option.key)}
                  className={"min-h-9 rounded-xl px-3 text-xs font-black " +
                    (filter === option.key ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744] hover:bg-[#DBEAFE]")}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[60dvh] min-h-[280px] flex-1 overflow-y-auto lg:max-h-[640px]" role="list">
            {visible.map(item => {
              const active = item.id === selectedId && !newConversation;
              const hot = (item.unreadCount || 0) > 0;
              return (
                <button role="listitem" key={item.id} type="button" onClick={() => openConversation(item.id)}
                  aria-current={active ? "true" : undefined}
                  className={"flex min-h-20 w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors sm:px-4 " +
                    (active ? "bg-[#EFF6FF] shadow-[inset_3px_0_0_#2563EB]" : "hover:bg-[#F8FAFC]")}>
                  <Face name={item.peerName || item.subject} src={item.peerAvatar} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={"truncate text-sm text-[#0F2744] " + (hot ? "font-black" : "font-bold")}>{item.peerName || item.subject}</span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-500">{relativeTime(item.updatedAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{item.fullSubject}</span>
                    <span className={"mt-1 block truncate text-xs " + (hot ? "font-bold text-[#0F2744]" : "font-medium text-slate-500")}>{item.preview || "Start a conversation"}</span>
                  </span>
                  {hot ? <span aria-label={item.unreadCount + " unread messages"} className="mt-4 rounded-full bg-[#2563EB] px-2 py-1 text-[10px] font-black !text-white">{item.unreadCount}</span> : null}
                </button>
              );
            })}
            {!visible.length ? (
              <div className="px-5 py-12 text-center">
                <Inbox size={30} aria-hidden="true" className="mx-auto text-[#2563EB]" />
                <p className="mt-3 text-sm font-black text-[#0F2744]">{threads.length ? "No matching conversations" : "Your inbox is ready"}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                  {threads.length ? "Clear the search or change the filter." : "Start a conversation with an authorized team member."}
                </p>
                {threads.length ? <button type="button" className="mt-3 text-xs font-black text-[#2563EB]" onClick={() => { setQuery(""); setFilter("all"); }}>Show all conversations</button> : null}
              </div>
            ) : null}
          </div>
          <p className="border-t border-slate-100 p-3 text-[11px] font-medium text-slate-500">
            {lastSync ? "Updated " + relativeTime(lastSync) : "Automatically checks for new messages while this page is open"}
          </p>
        </aside>

        <section className={(showMobileThread ? "flex " : "hidden ") + "min-h-[440px] min-w-0 flex-col lg:flex"} aria-label="Selected conversation">
          {selected ? (
            <>
              <header className="flex min-w-0 flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-4">
                <button type="button" aria-label="Back to inbox" onClick={() => setShowMobileThread(false)} className="grid h-11 w-11 place-items-center rounded-xl text-[#2563EB] hover:bg-[#EFF6FF] lg:hidden">
                  <ArrowLeft size={22} />
                </button>
                <Face name={selected.peerName || selected.subject} src={selected.peerAvatar} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-black text-[#0F2744]">{selected.peerName || selected.subject}</h2>
                  <p className="truncate text-xs font-semibold text-slate-600">{selected.fullSubject}</p>
                </div>
                {showAdminRecord && !selected.id.startsWith("new-") ? (
                  <Link href={"/admin/messages?c=" + encodeURIComponent(selected.id)} className="inline-flex min-h-10 items-center gap-1 text-xs font-black text-[#2563EB]">Admin record <ExternalLink size={14} /></Link>
                ) : null}
              </header>
              <div className="min-h-[260px] max-h-[54dvh] flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] px-3 py-5 sm:px-5 lg:max-h-[590px]" aria-live="polite" aria-relevant="additions">
                {(selected.messages || []).map(message => {
                  const own = message.own === true || (message.id.startsWith("local-") && message.author === me.firstName);
                  return (
                    <article key={message.id} className={"flex items-end gap-2 " + (own ? "flex-row-reverse" : "")}>
                      <Face name={message.author} src={message.avatarUrl} size="sm" />
                      <div className="max-w-[85%] min-w-0 sm:max-w-[75%]">
                        {!own ? <p className="mb-1 text-xs font-black text-[#0F2744]">{message.author}</p> : null}
                        <div className={"rounded-2xl px-3 py-2.5 text-left text-sm font-medium leading-6 shadow-sm " +
                          (own ? "bg-[#2563EB] !text-white" : "border border-slate-200 bg-white text-[#0F2744]")}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          {(message.attachments || []).map(file => (
                            <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer"
                              className={"mt-2 inline-flex max-w-full items-center gap-2 break-all text-xs font-black underline " +
                                (own ? "!text-white" : "text-[#2563EB]")}>
                              <Paperclip size={13} aria-hidden="true" /> {file.name || "Attachment"}
                            </a>
                          ))}
                          {message.id.startsWith("local-") ? <span className="mt-1 block text-[11px] font-bold opacity-75">Sending…</span> : null}
                        </div>
                        <p className={"mt-1 text-[11px] font-medium text-slate-500 " + (own ? "text-right" : "")}>{clock(message.createdAt)}</p>
                      </div>
                    </article>
                  );
                })}
                {!selected.messages.length ? (
                  <div className="mx-auto max-w-sm py-12 text-center">
                    <MessageCircle size={30} aria-hidden="true" className="mx-auto text-[#2563EB]" />
                    <p className="mt-3 text-sm font-black text-[#0F2744]">Start the conversation</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Write a helpful note below. Your message will be saved in SitGuru.</p>
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
              <details className="border-t border-slate-100 bg-white px-3 py-2 sm:px-4">
                <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-black text-[#0F2744]">
                  <ChevronDown size={16} className="text-[#2563EB]" aria-hidden="true" />
                  Conversation details and related work
                </summary>
                <div className="mt-2 flex flex-wrap gap-2 pb-2">
                  <Link href={base + "/assignments"} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#EFF6FF] px-3 text-xs font-black text-[#1D4ED8]"><FileText size={15} /> Assignments</Link>
                  <Link href={base + "/check-ins"} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#F0FDF4] px-3 text-xs font-black text-[#166534]"><Check size={15} /> Check-ins</Link>
                  <Link href={base + "/milestones"} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#F8FAFC] px-3 text-xs font-black text-[#0F2744]"><CalendarDays size={15} /> Milestones</Link>
                  <a href={sitguruTeamsHref()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#F8FAFC] px-3 text-xs font-black text-[#0F2744]">Microsoft Teams <ExternalLink size={13} /></a>
                </div>
                <p className="text-xs font-medium text-slate-600">{attachments} shared files · {selected.statusLabel.replaceAll("_", " ")} · Formal approvals happen in the relevant SitGuru workspace, not here.</p>
                {!selected.id.startsWith("new-") ? (
                  <form action={reportMessage} className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 py-3">
                    <input type="hidden" name="conversationId" value={selected.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <select name="reason" aria-label="Reason for reporting" className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold">
                      <option>Harassment</option><option>Safety Concern</option><option>Confidential Information</option><option>Other</option>
                    </select>
                    <button type="submit" className="min-h-10 rounded-xl border border-rose-200 px-3 text-xs font-black text-rose-800 hover:bg-rose-50">Report conversation</button>
                  </form>
                ) : null}
              </details>
              <form onSubmit={event => void sendLive(event)} className="border-t border-slate-200 bg-white p-3 sm:p-4">
                {media.length ? (
                  <div className="mb-2 flex flex-wrap gap-2" aria-label="Attachments awaiting send">
                    {media.map((file, index) => (
                      <span key={file.url + index} className="inline-flex max-w-full items-center gap-2 rounded-xl bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#1D4ED8]">
                        <Paperclip size={14} /> <span className="max-w-36 truncate">{file.name || "Attachment"}</span>
                        <button type="button" disabled={sending} aria-label={"Remove " + (file.name || "attachment")} onClick={() => setMedia(current => current.filter((_, i) => i !== index))}><X size={16} /></button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex min-w-0 items-end gap-2">
                  <input ref={attachRef} type="file" className="sr-only" accept="image/*,video/mp4,video/quicktime,video/webm,.pdf,.txt,.csv"
                    aria-label="Choose a file to attach"
                    onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void attach(file); }} />
                  <button type="button" onClick={() => attachRef.current?.click()} disabled={uploading || sending} title="Add image, video, PDF or text file (25 MB maximum)" aria-label="Attach a file"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 text-[#2563EB] hover:bg-[#EFF6FF] disabled:opacity-50">
                    {uploading ? <LoaderCircle size={20} className="animate-spin" /> : <Paperclip size={20} />}
                  </button>
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Write your message</span>
                    <textarea ref={composerRef} rows={2} value={draft} onChange={event => setDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault(); void sendLive();
                        }
                      }}
                      placeholder={"Message " + (selected.peerName || selected.subject) + "…"}
                      className="max-h-36 min-h-12 w-full resize-y rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2.5 text-sm font-medium leading-6 text-[#0F2744] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]" />
                  </label>
                  <button type="submit" disabled={sending || uploading || (!draft.trim() && !media.length)} aria-label="Send message"
                    className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-3 text-xs font-black !text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50">
                    {sending ? <LoaderCircle size={19} className="animate-spin" /> : <Send size={19} />}
                    <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-500">Enter to send · Shift+Enter for a new line · No passwords or financial details</p>
              </form>
            </>
          ) : newConversation ? (
            <div className="flex min-h-[420px] flex-col p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Back to inbox" onClick={() => { setNewConversation(false); setShowMobileThread(false); }} className="grid h-11 w-11 place-items-center rounded-xl text-[#2563EB] hover:bg-[#EFF6FF] lg:hidden"><ArrowLeft size={21} /></button>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-[#0F2744]">New message</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">Choose who you want to contact. Only authorized accounts can receive messages.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(audience === "manager" ? AUDIENCES : AUDIENCES.filter(item => item.value === "staff" || item.value === "admin")).map(option => (
                  <button key={option.value} type="button" aria-pressed={audiencePick === option.value}
                    onClick={() => { setAudiencePick(option.value); setPersonQuery(""); }}
                    className={"min-h-10 rounded-xl px-3 text-xs font-black " +
                      (audiencePick === option.value ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744] hover:bg-[#EFF6FF]")}>
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="relative mt-4">
                <span className="sr-only">Find a recipient</span>
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]" aria-hidden="true" />
                <input type="search" value={personQuery} onChange={event => setPersonQuery(event.target.value)}
                  placeholder="Search by name..."
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-3 text-sm font-semibold text-[#0F2744] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]" />
              </label>
              <div className="mt-3 max-h-[55dvh] overflow-y-auto">
                {peopleLoading ? <p role="status" className="flex items-center gap-2 py-4 text-sm font-semibold text-[#2563EB]"><LoaderCircle size={18} className="animate-spin" /> Finding people…</p> : null}
                {!peopleLoading && !people.length ? <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm font-medium text-slate-600">No available recipients match this search. Some interns may still need their SitGuru account activated.</p> : null}
                {people.map(person => (
                  <button type="button" key={person.id} onClick={() => choosePerson(person)}
                    disabled={person.canChat === false || person.id.startsWith("pending:")}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl border-b border-slate-100 px-3 py-2 text-left hover:bg-[#EFF6FF] disabled:opacity-50">
                    <Face name={person.firstName} src={person.avatarUrl} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-[#0F2744]">{person.firstName}</span>
                      <span className="block truncate text-xs font-semibold text-slate-500">{person.detail}{person.canChat === false ? " · Account not ready" : ""}</span></span>
                    <Plus size={17} className="text-[#2563EB]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden min-h-[460px] flex-col items-center justify-center px-6 text-center lg:flex">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-[#EFF6FF]"><MessageCircle size={30} className="text-[#2563EB]" /></span>
              <h2 className="mt-4 text-xl font-black text-[#0F2744]">Your conversations, organized</h2>
              <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">Choose a conversation to read and reply, or start a new one. Unread messages stay unread until you open them.</p>
              <button type="button" onClick={beginNew} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-black !text-white"><Plus size={18} /> Start a message</button>
            </div>
          )}
        </section>
      </section>
      <p className="text-xs font-medium leading-5 text-slate-500">
        Messages are internal SitGuru conversations, not Microsoft Teams or email messages. Use the dedicated SitGuru review controls for internship approvals; Teams and email permissions remain separate.
      </p>
    </div>
  );
}
