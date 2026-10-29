"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { deskInitials } from "@/lib/portal/desk-ui";

type Person = { id: string; firstName: string; avatarUrl: string; detail: string };
type ChatMessage = { id: string; author: string; avatarUrl: string; body: string; createdAt?: string; own?: boolean };

const AUDIENCES = [
  { id: "intern", label: "Interns" },
  { id: "parent", label: "Pet Parents" },
  { id: "guru", label: "Gurus" },
  { id: "ambassador", label: "Ambassadors" },
] as const;

function Face({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
      <span className="absolute inset-0 bg-white" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} src={src} className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1] m-auto text-[11px] font-black text-[#1D4ED8]">{deskInitials(name)}</span>
      )}
    </span>
  );
}

export default function DeskChatDock() {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]["id"]>("intern");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [threadId, setThreadId] = useState("");
  const [peer, setPeer] = useState<Person | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || threadId) return;
    const timer = window.setTimeout(() => {
      void fetch(`/api/messaging/people?audience=${audience}&q=${encodeURIComponent(query)}`, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload: { people?: Person[] }) => setPeople(payload.people || []))
        .catch(() => setPeople([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [audience, open, query, threadId]);

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
  }, [messages.length, open]);

  function choose(person: Person) {
    setPeer(person);
    setThreadId(`new-${person.id}`);
    setMessages([]);
    setError("");
    composerRef.current?.focus();
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
        subject: peer.firstName,
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

  return (
    <div className="fixed bottom-24 right-3 z-50 xl:bottom-6 xl:right-6">
      {open ? (
        <section className="mb-3 flex h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,39,68,0.22)]">
          <header className="public-dark-section flex items-center gap-2 px-3 py-3" data-brand-green style={{ background: "#0D5C3A" }}>
            {threadId ? (
              <button type="button" className="text-sm font-bold !text-white" onClick={() => { setThreadId(""); setPeer(null); }}>Back</button>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black !text-white">{peer?.firstName || "Chat"}</p>
              <p className="truncate text-[11px] font-semibold !text-white/80">{peer?.detail || "Interns, pet parents, Gurus, Ambassadors"}</p>
            </div>
            <button type="button" aria-label="Close chat" className="rounded-full p-1 !text-white" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>
          {threadId ? (
            <>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#F4F7FB] px-3 py-3">
                {messages.map((message) => {
                  const own = Boolean(message.own) || message.id.startsWith("local-");
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${own ? "flex-row-reverse" : ""}`}>
                      <Face name={own ? "You" : message.author} src={message.avatarUrl} />
                      <div className={`max-w-[75%] ${own ? "text-right" : ""}`}>
                        {own ? null : <p className="mb-1 text-[11px] font-bold text-[#0F2744]">{message.author}</p>}
                        <p className={`rounded-3xl px-3 py-2 text-left text-sm font-medium ${own ? "rounded-br-md bg-[#2563EB] !text-white" : "rounded-bl-md bg-white text-[#0F2744]"}`}>{message.body}</p>
                      </div>
                    </div>
                  );
                })}
                {!messages.length ? <p className="pt-8 text-center text-sm font-medium text-slate-500">Say hello to {peer?.firstName}.</p> : null}
                <div ref={endRef} />
              </div>
              {error ? <p className="px-3 text-xs font-semibold text-rose-700">{error}</p> : null}
              <form onSubmit={(event) => void send(event)} className="flex items-end gap-2 border-t border-slate-100 p-2">
                <textarea
                  ref={composerRef}
                  value={draft}
                  rows={1}
                  autoFocus
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Message"
                  className="min-h-11 flex-1 resize-none rounded-full bg-[#F1F5F9] px-4 py-2.5 text-sm outline-none"
                />
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] !text-white" aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {AUDIENCES.map((item) => (
                  <button key={item.id} type="button" onClick={() => setAudience(item.id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${audience === item.id ? "bg-[#2563EB] !text-white" : "bg-[#F1F5F9] text-[#0F2744]"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by first name" className="mt-1 min-h-10 w-full rounded-full bg-[#F1F5F9] px-4 text-sm outline-none" />
              <ul className="mt-2 space-y-1">
                {people.map((person) => (
                  <li key={`${person.detail}-${person.id}`}>
                    <button type="button" onClick={() => choose(person)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-[#F8FAFC]">
                      <Face name={person.firstName} src={person.avatarUrl} />
                      <span>
                        <span className="block text-sm font-bold text-[#0F2744]">{person.firstName}</span>
                        <span className="text-xs text-slate-500">{person.detail}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {!people.length ? <li className="px-2 py-6 text-center text-sm font-medium text-slate-500">No one with that first name yet.</li> : null}
              </ul>
            </div>
          )}
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
