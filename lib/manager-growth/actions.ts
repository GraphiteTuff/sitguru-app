"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { slugifyCampaign } from "@/lib/admin/growth/constants";
import { uniqueCampaignSlug } from "@/lib/admin/growth/data";
import { internshipActorKind } from "@/lib/internship/manager-access";
import {
  formalCommitmentNeedsApproval,
  partnershipCanProceed,
  surveyCode,
  surveyIsOpen,
  weekStartKey,
} from "@/lib/manager-growth/model";
import { loadPublicSurvey } from "@/lib/manager-growth/data";
import { isOutreachStage, normalizeOutreachState, outreachIsClosed, validOutreachInterests } from "@/lib/manager-growth/outreach-crm";
import { sendSitGuruEmail } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

async function manager() {
  const actor = await getAdminIdentity();
  if (!actor || !canUseGrowthPortal(actor)) return null;
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") return null;
  return { id: actor.id, email: actor.email, supervisor: kind === "supervisor" || actor.isSuperUser };
}

function refresh(path: string) {
  revalidatePath(path);
  revalidatePath("/admin/growth/oversight");
}

export async function saveInitiative(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/weekly-work", "You cannot save this initiative.");
  const title = field(formData, "title");
  if (title.length < 3) back("/manager/weekly-work", "Add an initiative title.");
  const id = field(formData, "id");
  const payload = {
    owner_user_id: actor.id,
    title,
    objective: field(formData, "objective"),
    audience: field(formData, "audience"),
    idea: field(formData, "idea"),
    channel: field(formData, "channel"),
    call_to_action: field(formData, "callToAction"),
    measurement: field(formData, "measurement"),
    category: field(formData, "category") || "Other",
    status: field(formData, "status") || "Idea",
    start_on: field(formData, "startOn") || null,
    due_on: field(formData, "dueOn") || null,
    notes: field(formData, "notes"),
    updated_at: new Date().toISOString(),
  };
  const query = id
    ? supabaseAdmin.from("manager_work_initiatives").update(payload).eq("id", id).eq("owner_user_id", actor.id)
    : supabaseAdmin.from("manager_work_initiatives").insert(payload);
  const { error } = await query;
  if (error) back("/manager/weekly-work", "The initiative could not be saved.");
  refresh("/manager/weekly-work");
  back("/manager/weekly-work", "Initiative saved. Ordinary work does not wait for approval.");
}

export async function saveGoals(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/weekly-work", "You cannot change these goals.");
  const goals = {
    conversations: field(formData, "conversations"),
    prospects: field(formData, "prospects"),
    content: field(formData, "content"),
    poll: field(formData, "poll"),
    experiment: field(formData, "experiment"),
  };
  const { error } = await supabaseAdmin.from("manager_work_goals").upsert({
    owner_user_id: actor.id,
    goals,
    updated_at: new Date().toISOString(),
  });
  if (error) back("/manager/weekly-work", "Goals could not be saved.");
  refresh("/manager/weekly-work");
  back("/manager/weekly-work", "Weekly goals saved. They are a guide, not a quota.");
}

export async function saveReview(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/weekly-work", "You cannot save this review.");
  const week = weekStartKey();
  const { error } = await supabaseAdmin.from("manager_work_reviews").upsert({
    owner_user_id: actor.id,
    week_start: week,
    happened: field(formData, "happened"),
    why: field(formData, "why"),
    learning: field(formData, "learning"),
    next_step: field(formData, "nextStep"),
    hours_note: field(formData, "hoursNote"),
    ceo_note: field(formData, "ceoNote"),
  }, { onConflict: "owner_user_id,week_start" });
  if (error) back("/manager/weekly-work", "The weekly review could not be saved.");
  refresh("/manager/weekly-work");
  back("/manager/weekly-work", "Weekly learning saved for leadership to read, not to approve task by task.");
}

export async function saveGrowthCampaign(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/campaigns-content", "You cannot create this campaign.");
  const name = field(formData, "name");
  if (name.length < 3) back("/manager/campaigns-content", "Name the campaign.");
  const channel = field(formData, "channel") || "instagram";
  const slug = await uniqueCampaignSlug(slugifyCampaign(name));
  const { error } = await supabaseAdmin.from("growth_campaigns").insert({
    campaign_name: name,
    campaign_slug: slug,
    channel,
    campaign_type: "organic",
    source: channel,
    medium: "organic",
    utm_source: channel,
    utm_medium: "organic",
    utm_campaign: slug,
    target_audience: field(formData, "audience"),
    destination_url: field(formData, "destination") || "https://www.sitguru.com",
    status: "active",
    start_date: field(formData, "startOn") || null,
    end_date: field(formData, "endOn") || null,
    purpose: field(formData, "objective"),
    notes: field(formData, "notes"),
  });
  if (error) back("/manager/campaigns-content", "The campaign could not be saved.");
  refresh("/manager/campaigns-content");
  back("/manager/campaigns-content", "Campaign saved. The tracking link records visits. It does not post for you.");
}

export async function saveContent(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/campaigns-content", "You cannot save this content.");
  const title = field(formData, "title");
  if (title.length < 3) back("/manager/campaigns-content", "Add a content title.");
  const status = field(formData, "status") || "Draft";
  const { error } = await supabaseAdmin.from("manager_work_content").insert({
    owner_user_id: actor.id,
    title,
    caption: field(formData, "caption"),
    channel: field(formData, "channel") || "Instagram",
    planned_on: field(formData, "plannedOn") || null,
    status,
    published_url: field(formData, "publishedUrl"),
    activity_note: field(formData, "activityNote"),
    happened: field(formData, "happened"),
    learning: field(formData, "learning"),
    next_step: field(formData, "nextStep"),
  });
  if (error) back("/manager/campaigns-content", "The content could not be saved.");
  refresh("/manager/campaigns-content");
  back("/manager/campaigns-content", status === "Published"
    ? "Marked published. SitGuru did not post this to the social network."
    : "Content draft saved.");
}

function htmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

async function outreachAssignee(requested: string, fallbackId: string) {
  const { data } = await supabaseAdmin
    .from("staff_engagements")
    .select("user_id,display_name,email")
    .eq("status", "active")
    .limit(50);
  const people = data || [];
  const selected = people.find((person) => String(person.user_id) === requested)
    || people.find((person) => String(person.email || "").trim().toLowerCase() === "ava@sitguru.com");
  return {
    userId: selected ? String(selected.user_id) : fallbackId,
    name: String(selected?.display_name || "Assigned manager"),
    email: String(selected?.email || ""),
  };
}

async function notifyOutreachAssignment(leadId: string, leadName: string, contact: string, source: string, assignee: { userId: string; email: string; name: string }) {
  const href = `/manager/outreach?lead=${encodeURIComponent(leadId)}`;
  const title = `New SitGuru outreach lead: ${leadName}`;
  const body = `New ${source.toLowerCase()} lead assigned to you. ${contact || "Open the record for details."}`;
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: assignee.userId,
    type: "growth_outreach_assigned",
    title,
    body,
    link: href,
    href,
    is_read: false,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[growth-outreach] notification failed", error.message);
  if (assignee.email) {
    try {
      await sendSitGuruEmail({
        to: assignee.email,
        subject: title,
        html: `<p>Hello ${htmlEscape(assignee.name)},</p><p>A new community relationship has been assigned to you.</p><p><strong>${htmlEscape(leadName)}</strong></p><p>${htmlEscape(body)}</p><p><a href="https://www.sitguru.com${href}">Open SitGuru Outreach</a></p><p>Please record your contact attempt and next follow-up directly in the record.</p>`,
        text: `Hello ${assignee.name},\n\n${leadName}\n${body}\n\nhttps://www.sitguru.com${href}\n\nPlease update the record after outreach.`,
      });
    } catch (error) {
      console.error("[growth-outreach] assignee email failed", error);
    }
  }
}

export async function saveOutreach(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/outreach", "You cannot save this relationship.");
  const partner = field(formData, "partnerName").slice(0, 180);
  if (partner.length < 2) back("/manager/outreach", "Add the partner or prospect name.");
  const commitment = field(formData, "commitment") || "Conversation";
  let approved = field(formData, "leadershipApproved") === "yes" && actor.supervisor;
  let status = field(formData, "status") || "Assigned";
  if (!isOutreachStage(status)) status = "Assigned";
  if (formalCommitmentNeedsApproval(commitment) && !partnershipCanProceed({ commitment, leadershipApproved: approved })) {
    approved = false;
    status = "Needs leadership approval";
  }
  const assignee = await outreachAssignee(field(formData, "assigneeId"), actor.id);
  const interests = validOutreachInterests(formData.getAll("interests").map(String));
  const source = field(formData, "leadSource") || "In-person encounter";
  const payload = {
    owner_user_id: assignee.userId,
    created_by_user_id: actor.id,
    assigned_to_user_id: assignee.userId,
    partner_name: partner,
    contact_name: field(formData, "contactName").slice(0, 160),
    partner_kind: field(formData, "partnerKind") || "Pet business",
    opportunity: field(formData, "opportunity").slice(0, 3000),
    sitguru_benefit: field(formData, "sitguruBenefit").slice(0, 1500),
    partner_benefit: field(formData, "partnerBenefit").slice(0, 1500),
    who_benefits: field(formData, "whoBenefits").slice(0, 300),
    proposed_activity: field(formData, "activity").slice(0, 1500),
    commitment,
    leadership_approved: approved,
    status,
    follow_up_on: field(formData, "followUpOn") || null,
    next_action: field(formData, "nextAction").slice(0, 1000),
    lesson: field(formData, "lesson").slice(0, 3000),
    city: field(formData, "city").slice(0, 100),
    state: normalizeOutreachState(field(formData, "state")),
    street_address: field(formData, "streetAddress").slice(0, 200),
    phone: field(formData, "phone").slice(0, 40),
    email: field(formData, "email").slice(0, 160),
    website: field(formData, "website").slice(0, 400),
    social_url: field(formData, "socialUrl").slice(0, 400),
    lead_source: source.slice(0, 80),
    interests,
    priority: ["High", "Normal", "Low"].includes(field(formData, "priority")) ? field(formData, "priority") : "Normal",
  };
  const { data: saved, error } = await supabaseAdmin.from("manager_work_outreach").insert(payload).select("id").single();
  if (error || !saved) back("/manager/outreach", "The relationship could not be saved. Please check the outreach database migration.");
  const note = `Lead captured from ${source}. Assigned to ${assignee.name}.`;
  const { error: activityError } = await supabaseAdmin.from("manager_work_outreach_activity").insert({
    outreach_id: saved.id,
    actor_user_id: actor.id,
    activity_type: "created",
    new_status: status,
    note,
  });
  if (activityError) console.error("[growth-outreach] creation history failed", activityError.message);
  if (assignee.userId !== actor.id) {
    await notifyOutreachAssignment(String(saved.id), partner, field(formData, "nextAction"), source, assignee);
  }
  refresh("/manager/outreach");
  back("/manager/outreach", `Relationship assigned to ${assignee.name}. Follow-up is now tracked.`);
}

export async function updateOutreach(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/outreach", "You cannot update this relationship.");
  const id = field(formData, "id");
  if (!/^[a-f0-9-]{36}$/i.test(id)) back("/manager/outreach", "Invalid outreach record.");
  const { data: current, error: readError } = await supabaseAdmin.from("manager_work_outreach")
    .select("id,status,assigned_to_user_id,created_by_user_id,next_action,follow_up_on")
    .eq("id", id).maybeSingle();
  if (readError || !current) back("/manager/outreach", "Relationship not found.");
  if (![current.assigned_to_user_id, current.created_by_user_id].includes(actor.id) && !actor.supervisor) {
    back("/manager/outreach", "Only the assigned manager, creator, or leadership may update this record.");
  }
  const requestedStatus = field(formData, "status");
  const status = isOutreachStage(requestedStatus) ? requestedStatus : String(current.status);
  if (["Approved activity", "Partner enrolled", "Guru enrolled", "Spotlight published"].includes(status) && !actor.supervisor && status !== current.status) {
    back("/manager/outreach", "Leadership or verified publishing records are required for this outcome.");
  }
  const nextAction = field(formData, "nextAction").slice(0, 1000);
  const note = field(formData, "note").slice(0, 3000);
  const followUp = field(formData, "followUpOn") || null;
  if (!note && status === current.status && nextAction === current.next_action && followUp === current.follow_up_on) {
    back("/manager/outreach", "Add an update before saving.");
  }
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("manager_work_outreach").update({
    status, next_action: nextAction, follow_up_on: outreachIsClosed(status) ? null : followUp,
    updated_at: now,
    ...(status === "Contacted" || status === "Conversation" ? { last_contacted_at: now } : {}),
    ...(outreachIsClosed(status) ? { closed_at: now } : { closed_at: null }),
  }).eq("id", id);
  if (error) back("/manager/outreach", "Could not update relationship.");
  const { error: historyError } = await supabaseAdmin.from("manager_work_outreach_activity").insert({
    outreach_id: id, actor_user_id: actor.id, activity_type: "update",
    previous_status: String(current.status || ""), new_status: status,
    note: note || `Status: ${status}. Next: ${nextAction || "None"}`,
  });
  if (historyError) console.error("[growth-outreach] activity save failed", historyError.message);
  refresh("/manager/outreach");
  back("/manager/outreach", "Outreach progress recorded.");
}

export async function approveOutreach(formData: FormData) {
  const actor = await manager();
  if (!actor?.supervisor) back("/admin/growth/oversight", "Leadership approval is required.");
  const id = field(formData, "id");
  const { error } = await supabaseAdmin.from("manager_work_outreach").update({
    leadership_approved: true,
    status: "Approved activity",
  }).eq("id", id);
  if (error) back("/admin/growth/oversight", "Approval could not be saved.");
  refresh("/manager/outreach");
  back("/admin/growth/oversight", "Partnership activity approved. Ava can coordinate it.");
}

export async function saveSurvey(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/surveys", "You cannot save this poll.");
  const title = field(formData, "title");
  const question = field(formData, "question");
  if (title.length < 3 || question.length < 3) back("/manager/surveys", "Add a title and a question.");
  const choices = field(formData, "choices").split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  if (choices.length < 2) back("/manager/surveys", "Add at least two answer choices.");
  const code = `${surveyCode(title)}-${randomBytes(2).toString("hex")}`;
  const { error } = await supabaseAdmin.from("manager_work_surveys").insert({
    owner_user_id: actor.id,
    code,
    title,
    question,
    audience: field(formData, "audience") || "Public visitors",
    choices,
    start_on: field(formData, "startOn") || null,
    end_on: field(formData, "endOn") || null,
    status: field(formData, "status") || "Draft",
  });
  if (error) back("/manager/surveys", "The poll could not be saved.");
  refresh("/manager/surveys");
  back("/manager/surveys", "Poll saved. It is not sent automatically. Share the link when you are ready.");
}

export async function saveSurveyLearning(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/surveys", "You cannot update this poll.");
  const { error } = await supabaseAdmin.from("manager_work_surveys").update({
    learning: field(formData, "learning"),
    next_step: field(formData, "nextStep"),
    status: field(formData, "status") || "Open",
  }).eq("id", field(formData, "id")).eq("owner_user_id", actor.id);
  if (error) back("/manager/surveys", "The learning note could not be saved.");
  refresh("/manager/surveys");
  back("/manager/surveys", "Learning saved.");
}

export async function submitSurveyAnswer(formData: FormData) {
  const code = field(formData, "code");
  if (field(formData, "company")) redirect(`/s/${code}`);
  const survey = await loadPublicSurvey(code);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  if (!survey || !surveyIsOpen({
    status: String(survey.status || ""),
    startOn: String(survey.start_on || ""),
    endOn: String(survey.end_on || ""),
    today,
  })) {
    redirect(`/s/${code}?error=${encodeURIComponent("This poll is not open.")}`);
  }
  const choice = field(formData, "choice");
  if (!choice) redirect(`/s/${code}?error=${encodeURIComponent("Choose an answer.")}`);
  const jar = await cookies();
  const cookieName = `sg_poll_${code}`;
  const existing = jar.get(cookieName)?.value;
  const key = existing || randomBytes(12).toString("hex");
  const { error } = await supabaseAdmin.from("manager_work_responses").insert({
    survey_id: survey.id,
    respondent_key: key,
    choice,
    note: field(formData, "note").slice(0, 500),
  });
  if (error) redirect(`/s/${code}?error=${encodeURIComponent("This browser already answered.")}`);
  jar.set(cookieName, key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  redirect(`/s/${code}?ok=1`);
}
