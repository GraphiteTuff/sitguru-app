"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessPartnerProposal, getPartnerProposalActor, PROPOSAL_PATHS, type ProposalMode } from "@/lib/admin/growth/partner-proposal-access";
import { isPortalUserId } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

const categories = new Set(["business", "media", "campus", "community"]);
const internEvents = new Set(["outreach", "material", "shipping", "evidence"]);
const staffEvents = new Set([...internEvents, "verified", "midpoint"]);
const supervisorEvents = new Set([...staffEvents, "accepted", "payment_approved", "closeout"]);

function httpsLink(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export async function savePartnerProposalAction(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const modeValue = read("mode");
  if (!Object.hasOwn(PROPOSAL_PATHS, modeValue)) redirect("/manager/partners");
  const mode = modeValue as ProposalMode;
  const path = PROPOSAL_PATHS[mode];
  const done = (kind: "partnerOk" | "partnerError", message: string): never => redirect(`${path}?${new URLSearchParams({ [kind]: message })}#partner-proposals`);
  const actor = await getPartnerProposalActor(mode);
  if (!actor) return done("partnerError", "Partnership access required.");

  const id = read("requestId");
  if (!isPortalUserId(id)) return done("partnerError", "Reload the workspace before saving.");
  const action = read("action");

  if (action === "create") {
    if (actor.role === "intern") return done("partnerError", "Ask your instructor to add a prospect.");
    const name = read("name");
    const category = read("category");
    const contactName = read("contactName");
    const contactEmail = read("contactEmail");
    const deliverables = read("deliverables");
    const internId = read("internId");
    const partnerId = read("partnerId");
    const monthly = read("monthlyDollars");
    const term = read("termMonths");
    if (!name || name.length > 140 || !categories.has(category) || contactName.length > 140 ||
        contactEmail.length > 254 || deliverables.length > 4000 || !/^\d{1,5}(\.\d{1,2})?$/.test(monthly) ||
        Number(monthly) > 10000 || !/^\d{1,2}$/.test(term) || Number(term) < 1 || Number(term) > 24) {
      return done("partnerError", "Check the prospect details and proposed term.");
    }
    if (internId) {
      if (!isPortalUserId(internId) || (actor.role === "manager" && !actor.internIds.includes(internId))) {
        return done("partnerError", "Choose an intern assigned to your workspace.");
      }
      const { data } = await supabaseAdmin.from("internship_interns").select("id")
        .eq("id", internId).eq("portal_enabled", true).in("status", ["accepted","active","approved"]).maybeSingle();
      if (!data) return done("partnerError", "Choose an active intern.");
    }

    if (partnerId) {
      if (actor.role !== "supervisor" || !isPortalUserId(partnerId)) {
        return done("partnerError", "Only the supervisor can link an existing partner.");
      }
      const { data: partner } = await supabaseAdmin.from("partners").select("id").eq("id", partnerId).maybeSingle();
      if (!partner) return done("partnerError", "Choose an existing partner.");
    }

    const { error } = await supabaseAdmin.from("growth_partner_proposals").upsert({
      id, name, category, contact_name: contactName, contact_email: contactEmail, deliverables,
      intern_id: internId || null, owner_user_id: actor.id, partner_id: partnerId || null,
      term_months: Number(term), monthly_cents: Math.round(Number(monthly) * 100),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (error) return done("partnerError", "The proposal could not be saved.");
  } else {
    const eventTypes = actor.role === "supervisor" ? supervisorEvents : actor.role === "manager" ? staffEvents : internEvents;
    const proposalId = read("proposalId");
    if (!isPortalUserId(proposalId) || !eventTypes.has(action)) return done("partnerError", "This action is unavailable.");
    const { data: proposal, error } = await supabaseAdmin.from("growth_partner_proposals")
      .select("id,intern_id,owner_user_id,term_months").eq("id", proposalId).maybeSingle();
    if (error || !proposal || !canAccessPartnerProposal(actor, proposal)) return done("partnerError", "Partnership access required.");

    const note = read("note");
    const url = read("evidenceUrl");
    const month = read("monthNumber");
    const needsMonth = ["evidence", "verified", "payment_approved"].includes(action);
    if (!note || note.length > 4000 || url.length > 2000 || (url && !httpsLink(url)) ||
        (["evidence","accepted"].includes(action) && !url) ||
        (needsMonth && (!/^\d{1,2}$/.test(month) || Number(month) < 1 || Number(month) > proposal.term_months))) {
      return done("partnerError", "Enter a note and the required agreement or evidence details.");
    }
    const { error: eventError } = await supabaseAdmin.from("growth_partner_proposal_events").upsert({
      id, proposal_id: proposalId, event_type: action, actor_user_id: actor.id, actor_role: actor.role,
      month_number: needsMonth ? Number(month) : null, note, evidence_url: url,
    }, { onConflict: "id", ignoreDuplicates: true });
    if (eventError) {
      console.error("[partners] Proposal event not recorded", eventError.code);
      return done("partnerError", "That action could not be recorded. Check the proposal status and monthly evidence.");
    }
  }
  for (const route of Object.values(PROPOSAL_PATHS)) revalidatePath(route);
  return done("partnerOk", action === "payment_approved" ? "Payment approval recorded. No payment was initiated." : "Partnership record saved.");
}
