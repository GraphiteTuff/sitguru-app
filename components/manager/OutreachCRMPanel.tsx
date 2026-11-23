import Link from "next/link";
import { saveOutreach, updateOutreach } from "@/lib/manager-growth/actions";
import { OUTREACH_INTERESTS, OUTREACH_PRIORITIES, OUTREACH_SOURCES, OUTREACH_STAGES, outreachIsClosed } from "@/lib/manager-growth/outreach-crm";
import { PARTNER_KINDS, FORMAL_COMMITMENTS } from "@/lib/manager-growth/model";

type Row = Record<string, unknown>;
type Staff = { id: string; name: string; email: string };
const input = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
const label = "block text-xs font-bold uppercase tracking-wide text-slate-600";
const primary = "min-h-11 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800";
const safe = (value: unknown) => String(value ?? "").trim();
const when = (value: unknown) => {
  const s = safe(value);
  return s ? s.slice(0, 10) : "";
};

export function OutreachCRMPanel({ list, activity, staff, followUps, overdue, ownerId, filter }: {
  list: Row[];
  activity: Row[];
  staff: Staff[];
  followUps: Row[];
  overdue: number;
  ownerId: string;
  filter: string;
}) {
  const ava = staff.find((p) => p.email.toLowerCase() === "ava@sitguru.com");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const due = new Date(`${today}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 2);
  const defaultDue = due.toISOString().slice(0, 10);
  const visible = list.filter((lead) => {
    if (filter === "mine") return safe(lead.assigned_to_user_id) === ownerId;
    if (filter === "due") return followUps.some((row) => row.id === lead.id);
    if (filter === "open") return !outreachIsClosed(safe(lead.status));
    if (filter === "closed") return outreachIsClosed(safe(lead.status));
    return true;
  });
  const openCount = list.filter((record) => !outreachIsClosed(safe(record.status))).length;
  const activeCount = list.filter((record) => ["Contacted", "Conversation", "Interested", "Follow-up scheduled"].includes(safe(record.status))).length;
  const assignedName = (id: unknown) => staff.find((p) => p.id === safe(id))?.name || "Unassigned";
  const person = (id: unknown) => staff.find((p) => p.id === safe(id))?.name || "Team member";
  return (
    <div className="space-y-5 pb-12">
      <nav className="flex flex-wrap gap-2 text-sm font-bold" aria-label="Growth workspace links">
        <Link href="/manager/community-studio" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-blue-700">Community Studio</Link>
        <Link href="/manager/community-studio/guru-match" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-blue-700">Guru Match & Share</Link>
        <Link href="/manager/community-studio/event-match" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-blue-700">Event Match & Share</Link>
        <Link href="/manager/metrics" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-blue-700">Metrics</Link>
      </nav>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Open opportunities", openCount],
          ["Active conversations", activeCount],
          ["Due in 7 days", followUps.length],
          ["Overdue", overdue],
        ].map(([name, count]) => (
          <div key={String(name)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-3xl font-black text-slate-950">{count}</div>
            <div className="text-xs font-semibold text-slate-600">{name}</div>
          </div>
        ))}
      </div>
      <details id="new-lead" open={list.length === 0} className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6">
        <summary className="cursor-pointer text-xl font-black text-slate-950">+ Log an in-person encounter / new lead</summary>
        <p className="mb-4 mt-2 text-sm text-slate-600">Capture a conversation in under a minute, assign it to Ava or another team member, and notify them in SitGuru. Only share public or volunteered contact information. This does not register anyone as a Guru or Partner.</p>
        <form action={saveOutreach} className="grid gap-3 md:grid-cols-2">
          <label className={label}>Business or person name *<input required name="partnerName" placeholder="Carol's Cat House" className={input} /></label>
          <label className={label}>Assigned manager<select name="assigneeId" defaultValue={ava?.id || ownerId} className={input}>{staff.map((p) => <option key={p.id} value={p.id}>{p.name}{p.email.toLowerCase() === "ava@sitguru.com" ? " (default)" : ""}</option>)}</select></label>
          <label className={label}>City<input name="city" placeholder="Daytona Beach" className={input}/></label>
          <label className={label}>State<input name="state" placeholder="FL" maxLength={2} className={input}/></label>
          <label className={label}>Source<select name="leadSource" defaultValue="In-person encounter" className={input}>{OUTREACH_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className={label}>Type<select name="partnerKind" defaultValue="Pet business" className={input}>{PARTNER_KINDS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className={label}>Follow-up by<input name="followUpOn" type="date" defaultValue={defaultDue} className={input}/></label>
          <label className={label}>Priority<select name="priority" defaultValue="Normal" className={input}>{OUTREACH_PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <fieldset className="md:col-span-2"><legend className={label}>Potential opportunities (select all that apply)</legend><div className="mt-2 flex flex-wrap gap-3">{OUTREACH_INTERESTS.map((item) => <label key={item} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800"><input type="checkbox" name="interests" value={item} defaultChecked={["SitGuru Partner", "Community spotlight"].includes(item)}/>{item}</label>)}</div></fieldset>
          <label className={label}>Contact name<input name="contactName" placeholder="Only if shared" className={input}/></label>
          <label className={label}>Phone<input name="phone" type="tel" placeholder="Public business phone" className={input}/></label>
          <label className={label}>Email<input name="email" type="email" placeholder="Public or volunteered email" className={input}/></label>
          <label className={label}>Website<input name="website" type="url" placeholder="https://..." className={input}/></label>
          <label className={label}>Street address<input name="streetAddress" placeholder="Optional business address" className={input}/></label>
          <label className={label}>Social profile<input name="socialUrl" type="url" placeholder="https://..." className={input}/></label>
          <label className={label}>Next action<input name="nextAction" placeholder="Ava: introduce SitGuru, invite partner spotlight" className={input}/></label>
          <label className={label}>Commitment<select name="commitment" defaultValue="Conversation" className={input}><option>Conversation</option><option>Cross-promotion</option>{FORMAL_COMMITMENTS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className={`${label} md:col-span-2`}>Where you met / conversation notes<textarea name="opportunity" rows={2} className={input} placeholder="What happened, what they offer, and why they might be a good fit"/></label>
          <label className={`${label} md:col-span-2`}>Proposed activity<textarea name="activity" rows={2} className={input} placeholder="Introduce SitGuru, explore free spotlight, discuss community partnership"/></label>
          <input type="hidden" name="status" value="Assigned" />
          <div className="md:col-span-2"><button className={primary} type="submit">Save and send to assigned manager</button></div>
        </form>
      </details>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Team outreach pipeline</h2>
          <nav className="flex flex-wrap gap-2 text-xs font-bold" aria-label="Filter outreach">
            {[["all","All"],["open","Open"],["mine","Assigned to me"],["due","Follow-ups"],["closed","Closed"]].map(([value, title]) => (
              <Link key={value} href={value === "all" ? "/manager/outreach" : `/manager/outreach?filter=${value}`} className={`rounded-full border px-3 py-2 ${filter === value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{title}</Link>
            ))}
          </nav>
        </div>
        {!visible.length ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No records in this view. Use “Log an in-person encounter” above to create your first assignment.</div> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((lead) => {
            const id = safe(lead.id);
            const isDue = when(lead.follow_up_on) && when(lead.follow_up_on) < today && !outreachIsClosed(safe(lead.status));
            const history = activity.filter((item) => safe(item.outreach_id) === id).slice(0, 12);
            return (
              <details key={id} id={`lead-${id}`} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm open:border-blue-200">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><h3 className="break-words text-lg font-black text-slate-950">{safe(lead.partner_name)}</h3>
                      <p className="text-sm text-slate-600">{[safe(lead.city),safe(lead.state)].filter(Boolean).join(", ") || "Location not entered"} · {safe(lead.partner_kind)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{safe(lead.status)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                    <span>Assigned: {assignedName(lead.assigned_to_user_id)}</span>
                    <span>Follow-up: {when(lead.follow_up_on) || "Not set"} {isDue ? "• Overdue" : ""}</span>
                    <span>{safe(lead.priority)} priority</span>
                    <span>{safe(lead.lead_source)}</span>
                  </div>
                  {safe(lead.next_action) ? <p className="mt-3 text-sm text-slate-800"><strong>Next:</strong> {safe(lead.next_action)}</p> : null}
                  <p className="mt-2 text-xs font-bold text-blue-700">Open details, update progress and view history</p>
                </summary>
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
                  <div><strong>Opportunities:</strong> {Array.isArray(lead.interests) ? lead.interests.join(" · ") : "Not specified"}</div>
                  {safe(lead.opportunity) && <p className="whitespace-pre-wrap"><strong>Encounter notes:</strong> {safe(lead.opportunity)}</p>}
                  {safe(lead.proposed_activity) && <p className="whitespace-pre-wrap"><strong>Suggested outreach:</strong> {safe(lead.proposed_activity)}</p>}
                  <div className="flex flex-wrap gap-3">
                    {safe(lead.phone) && <a className="font-bold text-blue-700" href={`tel:${safe(lead.phone)}`}>Call business</a>}
                    {safe(lead.email) && <a className="font-bold text-blue-700" href={`mailto:${safe(lead.email)}`}>Email business</a>}
                    {safe(lead.website).startsWith("https://") && <a className="font-bold text-blue-700" href={safe(lead.website)} target="_blank" rel="noopener noreferrer">Website</a>}
                  </div>
                  <form action={updateOutreach} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={id}/>
                    <label className={label}>Stage<select name="status" className={input} defaultValue={safe(lead.status)}>{OUTREACH_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
                    <label className={label}>Next follow-up<input name="followUpOn" className={input} type="date" defaultValue={when(lead.follow_up_on)}/></label>
                    <label className={`${label} sm:col-span-2`}>Next action<input name="nextAction" className={input} defaultValue={safe(lead.next_action)}/></label>
                    <label className={`${label} sm:col-span-2`}>What happened / staff note<textarea name="note" rows={2} className={input} placeholder="Called, emailed, spoke with owner, awaiting response..."/></label>
                    <div className="sm:col-span-2"><button type="submit" className={primary}>Record outreach progress</button></div>
                  </form>
                  <section>
                    <h4 className="font-bold text-slate-900">Activity history</h4>
                    {history.length ? <ol className="mt-2 space-y-2">{history.map((entry) => <li key={safe(entry.id)} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-800">{safe(entry.activity_type)} · {person(entry.actor_user_id)} · {safe(entry.created_at).slice(0, 16).replace("T"," ")}</p><p className="mt-1 whitespace-pre-wrap">{safe(entry.note)}</p></li>)}</ol> : <p className="mt-2 text-xs text-slate-500">No activity logged yet.</p>}
                  </section>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
