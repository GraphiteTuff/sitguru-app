import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { postStaffMessage } from "@/lib/messaging/staff-actions";
import { loadStaffInbox } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";

export default async function GrowthMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const inbox = await loadStaffInbox(access.actor.id, access.actor.isSuperUser);

  return (
    <GrowthPageFrame
      kicker="Growth & Community Inbox"
      title="One SitGuru inbox."
      detail="Internal notes stay with the team. Messages to Pet Parents, Gurus, Ambassadors, and partners are separate. Teams is for meetings. Planner is for tasks. SharePoint is for official files."
    >
      {notice || error ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>
          {error || notice}
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          {inbox.conversations.map((conversation) => (
            <GrowthCard key={conversation.id}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                {conversation.typeLabel} · {conversation.statusLabel}
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-950">{conversation.subject}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">{conversation.preview}</p>
              <div className="mt-3 space-y-2">
                {conversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={
                      message.internal
                        ? "rounded-2xl border border-amber-300 bg-amber-50 p-3"
                        : "rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    }
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {message.internal ? "Internal note" : message.author}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{message.body}</p>
                  </article>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <form action={postStaffMessage} className="grid gap-2">
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  <input type="hidden" name="visibility" value="participant" />
                  <textarea name="body" rows={2} placeholder="Message to the community member" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
                  <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">Send to them</button>
                </form>
                <form action={postStaffMessage} className="grid gap-2">
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  <input type="hidden" name="visibility" value="internal_note" />
                  <textarea name="body" rows={2} placeholder="Internal note. The community member never receives this." className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold" />
                  <button className="min-h-12 rounded-2xl border border-amber-400 bg-amber-100 px-3 text-sm font-black text-amber-950">Save internal note</button>
                </form>
              </div>
            </GrowthCard>
          ))}
          {!inbox.conversations.length ? (
            <GrowthCard>
              <h2 className="text-lg font-black text-slate-950">No growth conversations yet</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Marketplace booking messages stay in the existing inbox. New team and community threads will show here.
              </p>
            </GrowthCard>
          ) : null}
        </div>
        <GrowthCard>
          <h2 className="font-black text-slate-950">Start an internal note</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Use this for the founder and the growth team. It is not delivered to Pet Parents, Gurus, or Ambassadors.
          </p>
          <form action={postStaffMessage} className="mt-3 grid gap-2">
            <input type="hidden" name="visibility" value="internal_note" />
            <input type="hidden" name="type" value="internal_direct" />
            <input name="subject" placeholder="Subject" className="min-h-12 rounded-xl border border-amber-200 px-3 text-sm font-semibold" />
            <textarea name="body" rows={3} placeholder="Internal note" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold" />
            <button className="min-h-12 rounded-2xl bg-amber-700 px-3 text-sm font-black !text-white">Save internal thread</button>
          </form>
          {access.actor.isSuperUser ? (
            <Link href="/admin/messages/moderation" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-emerald-800">
              Review reports
            </Link>
          ) : null}
        </GrowthCard>
      </div>
    </GrowthPageFrame>
  );
}
