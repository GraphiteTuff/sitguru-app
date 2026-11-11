"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { MessageCircle, Minus, Send, X } from "lucide-react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";
import { deskInitials } from "@/lib/portal/desk-ui";

const DESK_CHAT_OPEN_ATTR = "data-desk-chat-open";

type Person = {
  id: string;
  firstName: string;
  avatarUrl: string;
  detail: string;
  online?: boolean;
  canChat?: boolean;
};
type ChatMessage = { id: string; author: string; avatarUrl: string; body: string; createdAt?: string; own?: boolean };
type InboxThread = {
  id: string;
  name: string;
  avatarUrl: string;
  detail: string;
  preview: string;
  unread: number;
  recipientId: string;
};

const MANAGER_AUDIENCES = [
  { id: "staff", label: "Staff" },
  { id: "intern", label: "Interns" },
  { id: "parent", label: "Pet Parents" },
  { id: "guru", label: "Gurus" },
  { id: "ambassador", label: "Ambassadors" },
  { id: "admin", label: "Admins" },
] as const;

const INTERN_AUDIENCES = MANAGER_AUDIENCES;

function Face({
  name,
  src,
  size = "md",
  online,
}: {
  name: string;
  src?: string;
  size?: "md" | "lg";
  online?: boolean;
}) {
  const box = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <span className={`relative inline-flex ${box} shrink-0`}>
      <span className={`relative inline-flex h-full w-full overflow-hidden rounded-full bg-white ring-2 ring-white shadow-sm`}>
        <span className="absolute inset-0 bg-white" />
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={src} className="relative z-[1] h-full w-full object-cover object-[center_18%]" />
        ) : (
          <span className="relative z-[1] m-auto text-[11px] font-black text-[#1D4ED8]">{deskInitials(name)}</span>
        )}
      </span>
      {typeof online === "boolean" ? (
        <span
          className={`absolute bottom-0 right-0 z-[2] h-3 w-3 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-300"}`}
          title={online ? "Online" : "Offline"}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

export default function DeskChatDock({
  mode = "manager",
  /** Lift the FAB above WebappBottomNav so More stays tappable on phone. */
  aboveBottomNav = false,
}: {
  mode?: "manager" | "intern";
  aboveBottomNav?: boolean;
}) {
  useBrowserChromeInset();
  const audiences = mode === "intern" ? INTERN_AUDIENCES : MANAGER_AUDIENCES;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"inbox" | "people">(mode === "intern" ? "people" : "inbox");
  const [audience, setAudience] = useState<(typeof audiences)[number]["id"]>("staff");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [waiting, setWaiting] = useState(0);
  const [threadId, setThreadId] = useState("");
  const [peer, setPeer] = useState<Person | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<InboxThread | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seenPreviews = useRef<Map<string, string> | null>(null);
  const openThreadId = useRef("");

  useEffect(() => {
    openThreadId.current = threadId;
  }, [threadId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) document.body.setAttribute(DESK_CHAT_OPEN_ATTR, "1");
    else document.body.removeAttribute(DESK_CHAT_OPEN_ATTR);
    return () => document.body.removeAttribute(DESK_CHAT_OPEN_ATTR);
  }, [open]);

  useEffect(() => {
    const beat = () => {
      void fetch("/api/messaging/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isOnline: true, deviceLabel: mode === "intern" ? "intern-desk" : "manager-desk" }),
      });
    };
    beat();
    const timer = window.setInterval(beat, 45_000);
    const offline = () => {
      void fetch("/api/messaging/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isOnline: false, deviceLabel: mode === "intern" ? "intern-desk" : "manager-desk" }),
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", offline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", offline);
    };
  }, [mode]);

  useEffect(() => {
    const pull = () => {
      void fetch("/api/messaging/inbox", { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { threads?: InboxThread[]; waiting?: number }) => {
          const next = payload.threads || [];
          const previous = seenPreviews.current;
          if (previous) {
            const incoming = next.find((thread) => {
              if (!thread.unread || !thread.preview) return false;
              if (thread.id === openThreadId.current) return false;
              return previous.get(thread.id) !== thread.preview;
            });
            if (incoming) setAlert(incoming);
          }
          seenPreviews.current = new Map(next.map((thread) => [thread.id, thread.preview]));
          setThreads(next);
          setWaiting(payload.waiting || 0);
        })
        .catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open || threadId || view !== "people") return;
    let cancelled = false;
    const pull = () => {
      void fetch(`/api/messaging/people?audience=${audience}&q=${encodeURIComponent(query)}`, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { people?: Person[] }) => {
          if (!cancelled) setPeople(payload.people || []);
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        });
    };
    const debounce = window.setTimeout(pull, 180);
    const refresh = audience === "staff" || audience === "admin" || audience === "intern"
      ? window.setInterval(pull, 20_000)
      : 0;
    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
      if (refresh) window.clearInterval(refresh);
    };
  }, [audience, open, query, threadId, view]);

  useEffect(() => {
    if (!open || !threadId || threadId.startsWith("new-")) return;
    const pull = () => {
      void fetch(`/api/messaging/thread?id=${encodeURIComponent(threadId)}`, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { messages?: ChatMessage[] }) => {
          if (payload.messages) setMessages(payload.messages);
        })
        .catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 2500);
    return () => window.clearInterval(timer);
  }, [open, threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, open, threadId]);

  function choose(person: Person) {
    if (person.canChat === false || person.id.startsWith("pending:")) {
      setError(`${person.firstName} is not on SitGuru chat yet.`);
      return;
    }
    setPeer(person);
    setThreadId(`new-${person.id}`);
    setMessages([]);
    setError("");
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  function openThread(thread: InboxThread) {
    setAlert(null);
    setOpen(true);
    setPeer({
      id: thread.recipientId,
      firstName: thread.name,
      avatarUrl: thread.avatarUrl,
      detail: thread.detail,
    });
    setThreadId(thread.id);
    setError("");
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !peer) return;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      author: "You",
      avatarUrl: "",
      body: text,
      createdAt: new Date().toISOString(),
      own: true,
    };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    composerRef.current?.focus();
    const response = await fetch("/api/messaging/staff-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        conversationId: threadId.startsWith("new-") ? "" : threadId,
        recipientId: peer.id,
        audience,
        subject: peer.detail === "Needs a live answer" ? peer.firstName : peer.firstName,
        body: text,
      }),
    });
    const payload = await response.json() as { ok?: boolean; error?: string; conversationId?: string; message?: ChatMessage };
    if (!response.ok || !payload.message || !payload.conversationId) {
      setError(payload.error || "The message could not be sent.");
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setDraft(text);
      return;
    }
    setThreadId(payload.conversationId);
    setMessages((current) => current.filter((item) => item.id !== optimistic.id).concat({ ...payload.message!, own: true }));
    composerRef.current?.focus();
  }

  const subtitle = threadId
    ? [
        peer?.detail || "Chat",
        typeof peer?.online === "boolean" ? (peer.online ? "Online" : "Offline") : "",
      ].filter(Boolean).join(" · ")
    : mode === "intern"
      ? "Message Admin or Ava"
      : "Live alerts, staff, interns, pet parents, Gurus, Ambassadors";

  function minimizeChat() {
    setOpen(false);
  }

  // Keep the FAB clear of WebappBottomNav + iOS Safari chrome on phone.
  // Inline style beats Tailwind purge on nested calc()/var() offsets.
  const dockStyle = aboveBottomNav
    ? ({
        bottom:
          "calc(5.5rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))",
        paddingBottom: "0.5rem",
      } as const)
    : ({
        bottom: 0,
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      } as const);

  return (
    <div
      className="desk-chat-dock fixed inset-x-0 z-[90] flex flex-col items-end px-3 sm:px-4 xl:!bottom-6 xl:right-6 xl:left-auto xl:w-auto xl:px-0 xl:!pb-0"
      style={dockStyle}
      data-desk-chat-above-nav={aboveBottomNav ? "true" : undefined}
    >
      {open ? (
        <section className="relative mb-3 flex h-[min(36rem,calc(100dvh-8.5rem))] w-full max-w-[24rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,39,68,0.22)] sm:ml-auto supports-[height:100svh]:h-[min(36rem,calc(100svh-8.5rem))]">
          <button
            type="button"
            aria-label="Minimize chat"
            title="Minimize"
            onClick={minimizeChat}
            className="absolute left-1/2 top-1.5 z-20 inline-flex h-7 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-black/15 text-white transition hover:bg-black/25"
          >
            <Minus size={16} strokeWidth={3} />
          </button>
          {/* div — not header — so .admin-theme header overrides cannot wipe the green bar */}
          <div
            className="public-dark-section flex items-center gap-2 px-3 pb-3 pt-8"
            data-desk-chat-header
            data-brand-green
            style={{ background: "#0D5C3A", color: "#fff" }}
          >
            {threadId ? (
              <button
                type="button"
                className="shrink-0 rounded-full px-2 py-1 text-sm font-bold"
                style={{ color: "#fff" }}
                onClick={() => {
                  setThreadId("");
                  setPeer(null);
                }}
              >
                Back
              </button>
            ) : null}
            {peer ? <Face name={peer.firstName} src={peer.avatarUrl} online={peer.online} /> : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white">
                SG
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black" style={{ color: "#fff" }}>
                {peer?.firstName || "Chat"}
              </p>
              <p className="truncate text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              title="Close"
              className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15"
              style={{ color: "#fff" }}
              onClick={minimizeChat}
            >
              <X size={18} />
            </button>
          </div>
          {threadId ? (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F4F7FB] px-3 py-3">
                {messages.map((message) => {
                  const own = Boolean(message.own) || message.id.startsWith("local-");
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${own ? "flex-row-reverse" : ""}`}>
                      <Face name={own ? "You" : message.author} src={message.avatarUrl} />
                      <div className="min-w-0 max-w-[78%]">
                        {own ? null : <p className="mb-1 text-[11px] font-bold text-[#0F2744]">{message.author}</p>}
                        <p className={`whitespace-pre-wrap break-words rounded-3xl px-3 py-2 text-left text-sm font-medium ${own ? "rounded-br-md bg-[#2563EB] !text-white" : "rounded-bl-md bg-white text-[#0F2744] shadow-sm"}`}>{message.body}</p>
                      </div>
                    </div>
                  );
                })}
                {!messages.length ? (
                  <div className="px-2 pt-8 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      {mode === "intern" ? `Tell ${peer?.firstName || "Admin"} what you need help with.` : `Say hello to ${peer?.firstName}.`}
                    </p>
                    {mode === "intern" ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {["Something is broken", "I need help with my profile"].map((prompt) => (
                          <button key={prompt} type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0F2744] shadow-sm" onClick={() => { setDraft(prompt); composerRef.current?.focus(); }}>
                            {prompt}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
              {error ? <p className="px-3 pb-1 text-xs font-semibold text-rose-700">{error}</p> : null}
              <form onSubmit={(event) => void send(event)} className="flex items-end gap-2 border-t border-slate-100 p-2">
                <textarea
                  ref={composerRef}
                  value={draft}
                  rows={1}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Message"
                  className="min-h-11 max-h-28 flex-1 resize-none rounded-full bg-[#F1F5F9] px-4 py-2.5 text-sm outline-none"
                />
                <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] !text-white" aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => { setView("inbox"); setError(""); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${view === "inbox" ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                  Inbox{waiting ? ` ${waiting}` : ""}
                </button>
                <button type="button" onClick={() => { setView("people"); setError(""); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${view === "people" ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                  People
                </button>
                {mode === "manager" ? (
                  <Link href="/manager/faqs" className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-bold text-[#0F2744]">
                    Approve FAQs
                  </Link>
                ) : null}
              </div>
              {view === "inbox" ? (
                <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                  {threads.map((thread) => (
                    <li key={thread.id}>
                      <button type="button" onClick={() => openThread(thread)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-[#F8FAFC]">
                        <Face name={thread.name} src={thread.avatarUrl} size="lg" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold text-[#0F2744]">{thread.name}</span>
                            {thread.unread ? <span className="rounded-full bg-[#2563EB] px-1.5 text-[10px] font-black !text-white">{thread.unread}</span> : null}
                          </span>
                          <span className="block text-xs font-semibold text-[#1D4ED8]">{thread.detail}</span>
                          <span className="block truncate text-xs text-slate-500">{thread.preview || "Open the chat"}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {!threads.length ? <li className="px-2 py-8 text-center text-sm font-medium text-slate-500">No live alerts yet. New problems from chat show up here.</li> : null}
                </ul>
              ) : (
                <>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {audiences.map((item) => (
                      <button key={item.id} type="button" onClick={() => setAudience(item.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${audience === item.id ? "bg-[#0D5C3A] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" className="mt-2 min-h-11 w-full rounded-full bg-[#F1F5F9] px-4 text-sm outline-none" />
                  <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {people.map((person) => {
                      const locked = person.canChat === false || person.id.startsWith("pending:");
                      return (
                        <li key={`${person.detail}-${person.id}`}>
                          <button
                            type="button"
                            onClick={() => choose(person)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-[#F8FAFC] ${locked ? "opacity-80" : ""}`}
                          >
                            <Face name={person.firstName} src={person.avatarUrl} size="lg" online={locked ? false : person.online} />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-[#0F2744]">{person.firstName}</span>
                              <span className="text-xs font-semibold text-slate-500">
                                {person.detail}
                                {locked
                                  ? ""
                                  : typeof person.online === "boolean"
                                    ? ` · ${person.online ? "Online" : "Offline"}`
                                    : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {error && view === "people" && !threadId ? (
                      <li className="px-2 pt-2 text-xs font-semibold text-rose-700">{error}</li>
                    ) : null}
                    {!people.length ? (
                      <li className="px-2 py-8 text-center text-sm font-medium text-slate-500">
                        {audience === "staff" || audience === "admin"
                          ? "No other staff on this chat yet."
                          : "No one with that first name yet."}
                      </li>
                    ) : null}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      ) : null}
      {alert ? (
        <div className="mb-3 flex w-full max-w-[24rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_18px_50px_rgba(15,39,68,0.22)]" role="status">
          <button type="button" onClick={() => openThread(alert)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <Face name={alert.name} src={alert.avatarUrl} size="lg" />
            <span className="min-w-0">
              <span className="block text-xs font-black uppercase tracking-wide text-[#0D5C3A]">New message</span>
              <span className="block truncate text-sm font-bold text-[#0F2744]">{alert.name}</span>
              <span className="block truncate text-xs text-slate-500">{alert.preview}</span>
            </span>
          </button>
          <button type="button" className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-slate-500" onClick={() => setAlert(null)}>
            Close
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && waiting ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F05A4A] px-1 text-[10px] font-black text-white">
            {waiting > 9 ? "9+" : waiting}
          </span>
        ) : null}
      </button>
    </div>
  );
}
