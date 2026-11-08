import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { countStoredChats, listFaqDrafts } from "@/lib/messaging/chat-archive";
import { reviewChatFaq } from "@/lib/messaging/faq-actions";

export const dynamic = "force-dynamic";

export default async function ManagerFaqPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = String((Array.isArray(params.ok) ? params.ok[0] : params.ok) || "");
  const error = String((Array.isArray(params.error) ? params.error[0] : params.error) || "");
  const queue = String((Array.isArray(params.queue) ? params.queue[0] : params.queue) || "pending");
  const status = queue === "approved" || queue === "rejected" ? queue : "pending";
  const admin = await getAdminIdentity();
  const approver = Boolean(
    admin?.isSuperUser ||
      internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser }) === "supervisor",
  );
  const [drafts, stored] = await Promise.all([
    listFaqDrafts(status),
    countStoredChats(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-28">
      <header className="public-dark-section rounded-3xl bg-[#0D5C3A] px-5 py-5 !text-white" data-brand-green>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-white/80">Admin</p>
        <h1 className="mt-1 text-2xl font-black !text-white">Chat FAQs</h1>
        <p className="mt-2 max-w-xl text-sm font-semibold !text-white/90">
          Every companion and live-agent chat is stored. Approve an answer and it becomes a Help Center article the companions can use next time.
        </p>
        <p className="mt-3 text-xs font-bold !text-white/80">{stored} stored chat {stored === 1 ? "turn" : "turns"}</p>
      </header>
      {notice ? <p className="rounded-2xl bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#166534]">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected"] as const).map((item) => (
          <Link key={item} href={item === "pending" ? "/manager/faqs" : `/manager/faqs?queue=${item}`} className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === item ? "bg-[#0D5C3A] !text-white" : "bg-white text-[#0F2744] shadow-sm"}`}>
            {item === "pending" ? "Needs approval" : item === "approved" ? "In Help Center" : "Not used"}
          </Link>
        ))}
      </div>
      <ul className="space-y-3">
        {drafts.map((draft) => (
          <li key={draft.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <span>{draft.category}</span>
              <span>·</span>
              <span>Asked {draft.frequency}</span>
              {draft.companion ? <span>· {draft.companion}</span> : null}
            </div>
            <h2 className="mt-2 text-base font-black text-[#0F2744]">{draft.question}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{draft.answer}</p>
            {draft.articleSlug ? (
              <Link href={`/help/insights/${draft.articleSlug}`} className="mt-3 inline-flex text-sm font-bold text-[#1D4ED8]">
                Open help article
              </Link>
            ) : null}
            {status === "pending" && approver ? (
              <form action={reviewChatFaq} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={draft.id} />
                <button name="action" value="approve" className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">
                  Approve for Help
                </button>
                <button name="action" value="reject" className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]">
                  Don&apos;t publish
                </button>
              </form>
            ) : null}
            {status === "pending" && !approver ? (
              <p className="mt-3 text-xs font-semibold text-slate-500">SitGuru Admin approves these before they go into Help.</p>
            ) : null}
          </li>
        ))}
        {!drafts.length ? (
          <li className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500">
            {status === "pending"
              ? "No FAQ is waiting. Companions file one after they answer, and your live replies do too."
              : "Nothing in this list yet."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
