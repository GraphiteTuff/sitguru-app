"use client";

import { useState } from "react";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { postStaffMessage, reportMessage } from "@/lib/messaging/staff-actions";

type Attachment = { url: string; mimeType: string; name: string };
type Message = {
  id: string;
  internal: boolean;
  author: string;
  avatarUrl: string;
  body: string;
  attachments: Attachment[];
};
type Conversation = {
  id: string;
  subject: string;
  fullSubject: string;
  typeLabel: string;
  statusLabel: string;
  preview: string;
  messages: Message[];
};

function Avatar({ name, src }: { name: string; src?: string }) {
  const letter = (name || "S").slice(0, 1).toUpperCase();
  return (
    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={src} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-black text-[#0D5C3A]">{letter}</span>
      )}
    </span>
  );
}

export default function StaffChat({
  me,
  conversations,
  showAdminRecord,
}: {
  me: { firstName: string; avatarUrl: string };
  conversations: Conversation[];
  showAdminRecord: boolean;
}) {
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || "");
  const [fileLabel, setFileLabel] = useState("");
  const [media, setMedia] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const selected = conversations.find((item) => item.id === selectedId) || null;

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

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-emerald-100 lg:border-r`}>
        <div className="flex items-center gap-3 border-b border-emerald-50 px-4 py-3">
          <Avatar name={me.firstName} src={me.avatarUrl} />
          <div>
            <p className="font-black text-slate-950">{me.firstName}</p>
            <p className="text-xs font-semibold text-slate-500">Your messages</p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`flex w-full items-center gap-3 border-b border-emerald-50 px-4 py-3 text-left ${selectedId === conversation.id ? "bg-emerald-50" : "bg-white"}`}
            >
              <Avatar name={conversation.subject} />
              <span className="min-w-0">
                <span className="block truncate font-black text-slate-950">{conversation.subject}</span>
                <span className="block truncate text-xs font-semibold text-slate-500">
                  {conversation.preview || conversation.typeLabel}
                </span>
              </span>
            </button>
          ))}
          {!conversations.length ? (
            <p className="px-4 py-6 text-sm font-semibold text-slate-500">
              No team conversations yet.
            </p>
          ) : null}
        </div>
      </aside>
      <section className={`${selected || !conversations.length ? "flex" : "hidden lg:flex"} min-h-[70vh] flex-col`}>
        <header className="flex items-center gap-2 border-b border-emerald-50 px-3 py-3">
          {selected ? (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden"
              onClick={() => setSelectedId("")}
              aria-label="Back to conversations"
            >
              <ArrowLeft size={20} />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-slate-950">{selected?.fullSubject || "New message"}</h2>
            <p className="text-xs font-semibold text-slate-500">Saved in Admin Messages</p>
          </div>
          {showAdminRecord && selected ? (
            <a href={`/admin/messages?c=${selected.id}`} className="ml-auto text-xs font-black text-emerald-800">
              Admin record
            </a>
          ) : null}
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
          {selected?.messages.map((message) => (
            <article key={message.id} className="flex items-end gap-2">
              <Avatar name={message.author} src={message.avatarUrl} />
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${message.internal ? "border border-amber-300 bg-amber-50" : "bg-[#f4f7f2]"}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  {message.author}
                  {message.internal ? " · Internal note" : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-950">{message.body}</p>
                {message.attachments.map((file) => (
                  <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-black text-emerald-800 underline">
                    {file.name}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
        {error ? <p className="px-3 text-xs font-bold text-rose-700">{error}</p> : null}
        {fileLabel ? <p className="px-3 text-xs font-bold text-emerald-800">Attached {fileLabel}</p> : null}
        <form action={postStaffMessage} className="grid gap-2 border-t border-emerald-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input type="hidden" name="conversationId" value={selected?.id || ""} />
          <input type="hidden" name="visibility" value="internal_note" />
          <input type="hidden" name="type" value="internal_direct" />
          <input type="hidden" name="media" value={JSON.stringify(media)} />
          {!selected ? (
            <input name="subject" placeholder="Who or what is this about?" className="min-h-12 rounded-2xl border border-emerald-100 px-3 text-base font-semibold" />
          ) : null}
          <div className="flex items-end gap-2">
            <label className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-900">
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
            <textarea name="body" rows={2} placeholder={`Message as ${me.firstName}`} className="min-h-12 flex-1 rounded-2xl border border-emerald-100 px-3 py-2 text-base font-semibold" />
            <button className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white" aria-label="Send">
              <Send size={18} />
            </button>
          </div>
          <p className="text-[11px] font-semibold text-amber-900">
            This saves an internal team note. It is recorded in Admin and is not sent to a Pet Parent, Guru, or Ambassador.
          </p>
          {selected ? (
            <form action={reportMessage} className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="conversationId" value={selected.id} />
              <input type="hidden" name="returnTo" value="/admin/growth/messages" />
              <select name="reason" className="min-h-11 rounded-xl border border-rose-100 px-3 text-sm font-semibold">
                <option>Harassment</option>
                <option>Safety Concern</option>
                <option>Confidential Information</option>
                <option>Other</option>
              </select>
              <button className="min-h-11 rounded-2xl border border-rose-200 px-3 text-sm font-black text-rose-800">Report</button>
            </form>
          ) : null}
        </form>
      </section>
    </div>
  );
}
