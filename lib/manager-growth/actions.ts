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

export async function saveOutreach(formData: FormData) {
  const actor = await manager();
  if (!actor) back("/manager/outreach", "You cannot save this relationship.");
  const partner = field(formData, "partnerName");
  if (partner.length < 2) back("/manager/outreach", "Add the partner or prospect name.");
  const commitment = field(formData, "commitment") || "Conversation";
  let approved = field(formData, "leadershipApproved") === "yes" && actor.supervisor;
  let status = field(formData, "status") || "Identified";
  if (formalCommitmentNeedsApproval(commitment) && !partnershipCanProceed({ commitment, leadershipApproved: approved })) {
    approved = false;
    status = "Needs leadership approval";
  }
  const { error } = await supabaseAdmin.from("manager_work_outreach").insert({
    owner_user_id: actor.id,
    partner_name: partner,
    contact_name: field(formData, "contactName"),
    partner_kind: field(formData, "partnerKind") || "Community event",
    opportunity: field(formData, "opportunity"),
    sitguru_benefit: field(formData, "sitguruBenefit"),
    partner_benefit: field(formData, "partnerBenefit"),
    who_benefits: field(formData, "whoBenefits"),
    proposed_activity: field(formData, "activity"),
    commitment,
    leadership_approved: approved,
    status,
    follow_up_on: field(formData, "followUpOn") || null,
    next_action: field(formData, "nextAction"),
    lesson: field(formData, "lesson"),
  });
  if (error) back("/manager/outreach", "The relationship could not be saved.");
  refresh("/manager/outreach");
  back("/manager/outreach", formalCommitmentNeedsApproval(commitment) && !approved
    ? "Saved. A contract, sponsorship, or other formal commitment waits for leadership approval."
    : "Relationship saved.");
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
