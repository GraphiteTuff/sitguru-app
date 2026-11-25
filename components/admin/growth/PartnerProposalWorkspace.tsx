import Link from "next/link";
import { randomUUID } from "node:crypto";
import { getPartnerProposalActor, type ProposalMode } from "@/lib/admin/growth/partner-proposal-access";
import { savePartnerProposalAction } from "@/lib/admin/growth/partner-proposal-actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

const card = "min-w-0 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6";
const control = "mt-1 block min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base";
const button = "inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold !text-white";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const standardEvents = [
  ["outreach", "Record outreach"],
  ["material", "Record marketing asset"],
  ["shipping", "Record shipping status"],
  ["evidence", "Submit monthly evidence"],
];
const staffEvents = [["verified", "Verify monthly evidence"], ["midpoint", "Record midpoint review"]];
const supervisorEvents = [["accepted", "Record accepted agreement"], ["payment_approved", "Record payment approval"], ["closeout", "Record end-of-term or renewal review"]];

export default async function PartnerProposalWorkspace({ mode, searchParams }: {
  mode: ProposalMode;
  searchParams?: Promise<{ partnerOk?: string; partnerError?: string }>;
}) {
  const actor = await getPartnerProposalActor(mode);
  if (!actor) return null;
  const flash = searchParams ? await searchParams : {};
  const query = supabaseAdmin.from("growth_partner_proposals").select("*").order("created_at", { ascending: false }).limit(60);
  if (actor.role === "intern") query.in("intern_id", actor.internIds);
  if (actor.role === "manager") {
    if (actor.internIds.length) query.or(`owner_user_id.eq.${actor.id},intern_id.in.(${actor.internIds.join(",")})`);
    else query.eq("owner_user_id", actor.id);
  }
  const { data, error } = await query;
  const ids = (data || []).map((row) => String(row.id));
  const roster = supabaseAdmin.from("internship_interns").select("id,full_name")
    .eq("portal_enabled", true).in("status", ["active","accepted","approved"]).order("full_name");
  if (actor.role === "manager") roster.in("id", actor.internIds);
  const [events, interns, partners] = await Promise.all([
    ids.length ? supabaseAdmin.from("growth_partner_proposal_events")
      .select("id,proposal_id,event_type,actor_role,month_number,note,evidence_url,created_at")
      .in("proposal_id", ids).order("created_at", { ascending: false }).limit(400) : Promise.resolve({ data: [], error: null }),
    actor.role === "supervisor" || (actor.role === "manager" && actor.internIds.length)
      ? roster : Promise.resolve({ data: [], error: null }),
    actor.role === "supervisor" ? supabaseAdmin.from("partners").select("id,business_name")
      .eq("status", "active").order("business_name").limit(250) : Promise.resolve({ data: [], error: null }),
  ]);
  const actions = [...standardEvents, ...(actor.role !== "intern" ? staffEvents : []), ...(actor.role === "supervisor" ? supervisorEvents : [])];

  return (
    <section id="partner-proposals" className={`${card} scroll-mt-24 space-y-4`}>
      <h2 className="text-2xl font-black text-emerald-950">Partnership proposals</h2>
      <p className="text-sm text-slate-700">Record business contacts, agreed work, and monthly evidence. Keep patient information out of the workspace.</p>
      {flash.partnerError ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{flash.partnerError}</p> : null}
      {flash.partnerOk ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{flash.partnerOk}</p> : null}
      {error ? <p role="alert" className="text-sm text-rose-900">Partnership records are temporarily unavailable.</p> : (
        <>
          {actor.role !== "intern" ? (
            <details className="rounded-2xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-bold text-emerald-900">Add a prospect</summary>
              <form action={savePartnerProposalAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="mode" value={mode} /><input type="hidden" name="requestId" value={randomUUID()} />
                <label className="block text-sm font-semibold">Partner name<input name="name" required maxLength={140} className={control} /></label>
                <label className="block text-sm font-semibold">Category
                  <select name="category" className={control}>{["business","media","campus","community"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
                </label>
                <label className="block text-sm font-semibold">Contact name<input name="contactName" maxLength={140} className={control} /></label>
                <label className="block text-sm font-semibold">Business contact email<input name="contactEmail" type="email" maxLength={254} className={control} /></label>
                <label className="block text-sm font-semibold">Assigned intern<select name="internId" className={control}>
                  <option value="">Unassigned</option>
                  {(interns.data || []).map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
                </select></label>
                {actor.role === "supervisor" ? <label className="block text-sm font-semibold">Existing partner account
                  <select name="partnerId" className={control}>
                    <option value="">No existing account linked</option>
                    {(partners.data || []).map((item) => <option key={item.id} value={item.id}>{item.business_name}</option>)}
                  </select>
                </label> : null}
                <label className="block text-sm font-semibold">Proposed monthly USD<input name="monthlyDollars" type="number" step="0.01" min="0" max="10000" defaultValue="0" required className={control} /></label>
                <label className="block text-sm font-semibold">Initial term in months<input name="termMonths" type="number" min="1" max="24" defaultValue="6" required className={control} /></label>
                <label className="block text-sm font-semibold sm:col-span-2">Expected deliverables<textarea name="deliverables" rows={3} maxLength={4000} className={control} /></label>
                <button name="action" value="create" className={button}>Save proposal</button>
              </form>
            </details>
          ) : null}
          {events.error ? <p role="alert" className="text-sm text-rose-900">Activity history is temporarily unavailable.</p> : null}
          {data?.length ? (
            <ul className="grid gap-3 xl:grid-cols-2">
              {data.map((proposal) => {
                const history = (events.data || []).filter((event) => event.proposal_id === proposal.id);
                const monthly = Number(proposal.monthly_cents) / 100;
                return (
                  <li key={proposal.id} className="min-w-0 space-y-3 rounded-2xl border border-emerald-950/15 p-4">
                    <h3 className="break-words text-lg font-black text-emerald-950">{proposal.name}</h3>
                    <p className="text-sm capitalize text-slate-700">{proposal.category} · {proposal.status}</p>
                    <p className="text-sm font-semibold text-slate-800">{monthly ? `${money.format(monthly)} per month · ${money.format(monthly * proposal.term_months)} total` : "Unpaid reciprocal partnership"} · {proposal.term_months} months</p>
                    {proposal.contact_name || proposal.contact_email ? <p className="break-words text-sm text-slate-700">{[proposal.contact_name, proposal.contact_email].filter(Boolean).join(" · ")}</p> : null}
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{proposal.deliverables}</p>
                    <div className="flex flex-wrap gap-3">
                      <a href={`/api/growth/partner-kit/${proposal.id}?mode=${mode}`} className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-900 underline">Download marketing kit</a>
                      <Link href={mode === "intern" ? "/intern/growth/referrals" : "/manager/referrals"} className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-900 underline">Referral results</Link>
                    </div>
                    {proposal.status !== "closed" ? (
                      <details className="rounded-xl bg-emerald-50 p-3">
                        <summary className="cursor-pointer text-sm font-bold text-emerald-950">Record activity or a decision</summary>
                        <form action={savePartnerProposalAction} className="mt-3 space-y-2">
                          <input type="hidden" name="mode" value={mode} />
                          <input type="hidden" name="proposalId" value={proposal.id} />
                          <input type="hidden" name="requestId" value={randomUUID()} />
                          <label className="block text-sm font-semibold">Action<select name="action" className={control}>{actions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                          <label className="block text-sm font-semibold">Term month for evidence or approval<input name="monthNumber" type="number" min="1" max={proposal.term_months} className={control} /></label>
                          <label className="block text-sm font-semibold">Agreement, asset, or evidence URL<input name="evidenceUrl" type="url" maxLength={2000} className={control} /></label>
                          <label className="block text-sm font-semibold">Note<textarea name="note" required maxLength={4000} rows={2} className={control} /></label>
                          <button className={button}>Save activity</button>
                        </form>
                      </details>
                    ) : null}
                    <details className="rounded-xl border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-bold text-emerald-950">Activity history</summary>
                      {history.length ? <ul className="mt-2 space-y-2">{history.map((event) => (
                        <li key={event.id} className="rounded-lg bg-slate-50 p-2 text-sm text-slate-800">
                          <p className="font-semibold capitalize">{event.event_type.replaceAll("_", " ")} · {event.actor_role} {event.month_number ? `· Month ${event.month_number}` : ""}</p>
                          <p className="whitespace-pre-wrap break-words">{event.note}</p>
                          {event.evidence_url?.startsWith("https://") ? <a href={event.evidence_url} rel="noreferrer" target="_blank" className="inline-flex min-h-11 items-center text-emerald-900 underline">Open evidence or agreement</a> : null}
                        </li>
                      ))}</ul> : <p className="mt-2 text-sm text-slate-600">No activity recorded.</p>}
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-slate-700">No assigned partnership proposals.</p>}
        </>
      )}
    </section>
  );
}
