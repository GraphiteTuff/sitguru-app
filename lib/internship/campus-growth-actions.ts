"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  campusApprovalChangeAllowed,
  campusAttributionReward,
  campusMissionDraft,
  campusTrackingCode,
} from "@/lib/internship/campus-growth";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { assignmentBrief, validateManagerAssignment } from "@/lib/internship/manager-assignment";
import { findInternByAccount, findInternById } from "@/lib/internship/queries";
import { publishInternAssignmentEvent } from "@/lib/realtime/publish-internship";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { stableEventId } from "@/lib/realtime/pure";
import { recipientsForInternWorkspace } from "@/lib/realtime/recipients";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function backPath(formData: FormData) {
  const value = field(formData, "returnTo");
  if (value === "/intern/campus-growth" || value === "/intern/campus-growth/event" || value === "/manager/campus-growth") return value;
  return "/manager/campus-growth";
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function actor() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const intern = user ? await findInternByAccount({ userId: user.id, email: user.email }) : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  return { userId: admin?.id || user?.id || "", email: admin?.email || user?.email || "", kind, intern };
}

async function allowedIntern(internId: string, who: Awaited<ReturnType<typeof actor>>) {
  const intern = await findInternById(internId);
  if (!intern || !who.userId) return null;
  const allowed = canReadPrivateInternRecord({
    actor: who.kind,
    actorUserId: who.userId,
    actorInternId: who.intern?.id,
    targetInternId: intern.id,
    managerUserId: intern.managerUserId,
  });
  return allowed ? intern : null;
}

async function audit(input: { internId: string; type: string; id: string; action: string; actorId: string; note?: string }) {
  await supabaseAdmin.from("campus_growth_audit").insert({
    intern_id: input.internId,
    resource_type: input.type,
    resource_id: input.id,
    action: input.action,
    actor_id: input.actorId || null,
    note: input.note || "",
  });
}

async function signal(intern: NonNullable<Awaited<ReturnType<typeof allowedIntern>>>, eventType: string, resourceId: string, actorId: string) {
  try {
    const recipients = await recipientsForInternWorkspace(intern, { includeOversight: true });
    await publishLiveSignals({
      eventType,
      eventId: stableEventId([eventType, resourceId, actorId]),
      recipientUserIds: recipients,
      resourceType: "campus_growth",
      resourceId,
      scope: "growth",
      paths: ["/manager/campus-growth", "/intern/campus-growth"],
      actorUserId: actorId,
      revalidatePaths: ["/manager/campus-growth", "/intern/campus-growth", "/manager/reports"],
    });
  } catch (error) {
    console.warn("campus growth signal", error);
  }
}

function refresh() {
  revalidatePath("/manager/campus-growth");
  revalidatePath("/intern/campus-growth");
  revalidatePath("/manager/reports");
  revalidatePath("/manager/assignments");
  revalidatePath("/intern/assignments");
}

export async function saveCampusOpportunity(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  const intern = await allowedIntern(field(formData, "internId") || who.intern?.id || "", who);
  if (!intern) bounce(path, "error", "That campus is not available on this login.");
  const title = field(formData, "title");
  if (title.length < 3) bounce(path, "error", "Add an opportunity title.");
  const approval = who.kind === "intern" ? "ava_review" : (field(formData, "approval") || "needs_research");
  if (!campusApprovalChangeAllowed({ actor: who.kind, next: approval })) {
    bounce(path, "error", "That approval needs a manager.");
  }
  const { data, error } = await supabaseAdmin.from("campus_growth_opportunities").insert({
    intern_id: intern.id,
    university_id: intern.universityId || null,
    title,
    opportunity_type: field(formData, "type") || "Other",
    description: field(formData, "description"),
    source_url: field(formData, "sourceUrl"),
    contact_name: field(formData, "contactName"),
    contact_organization: field(formData, "contactOrganization"),
    contact_info: field(formData, "contactInfo"),
    happens_on: field(formData, "happensOn") || null,
    location: field(formData, "location"),
    estimated_audience: Number(field(formData, "audience") || 0) || null,
    potential_goal: field(formData, "goal"),
    notes: field(formData, "notes"),
    rules_notes: field(formData, "rulesNotes"),
    approval,
    status: who.kind === "intern" ? "Needs Ava Review" : (field(formData, "status") || "Idea"),
    created_by: who.userId,
    updated_at: new Date().toISOString(),
  }).select("id").maybeSingle();
  if (error || !data?.id) bounce(path, "error", "That opportunity could not be saved.");
  await audit({ internId: intern.id, type: "opportunity", id: String(data.id), action: "opportunity.submitted", actorId: who.userId });
  await signal(intern, "campus.opportunity.created", String(data.id), who.userId);
  refresh();
  bounce(path, "ok", "Campus opportunity saved.");
}

export async function reviewCampusOpportunity(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  if (who.kind !== "manager" && who.kind !== "supervisor") bounce(path, "error", "A manager reviews campus work.");
  const approval = field(formData, "approval");
  if (!campusApprovalChangeAllowed({ actor: who.kind, next: approval })) bounce(path, "error", "Choose a real approval state.");
  const { data: row } = await supabaseAdmin.from("campus_growth_opportunities").select("id,intern_id").eq("id", field(formData, "opportunityId")).maybeSingle();
  const intern = row?.intern_id ? await allowedIntern(String(row.intern_id), who) : null;
  if (!intern || !row?.id) bounce(path, "error", "That opportunity is not on your team.");
  const reviewNote = field(formData, "reviewNote");
  const patch: Record<string, string> = {
    approval,
    status: approval === "approved" ? "Approved" : approval === "not_permitted" ? "Not Pursuing" : "Needs Ava Review",
    updated_at: new Date().toISOString(),
  };
  if (who.kind === "supervisor") patch.jason_review = reviewNote;
  else patch.ava_review = reviewNote;
  const { error } = await supabaseAdmin.from("campus_growth_opportunities").update(patch).eq("id", row.id);
  if (error) bounce(path, "error", "The review could not be saved.");
  await audit({ internId: intern.id, type: "opportunity", id: String(row.id), action: "manager.approved", actorId: who.userId, note: approval });
  await signal(intern, "campus.opportunity.reviewed", String(row.id), who.userId);
  refresh();
  bounce(path, "ok", "Campus review saved.");
}

export async function saveCampusLead(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  const intern = await allowedIntern(field(formData, "internId") || who.intern?.id || "", who);
  if (!intern) bounce(path, "error", "That campus is not available on this login.");
  const name = field(formData, "name");
  if (name.length < 2) bounce(path, "error", "Add the lead name.");
  const { data, error } = await supabaseAdmin.from("campus_growth_leads").insert({
    intern_id: intern.id,
    university_id: intern.universityId || null,
    lead_type: field(formData, "type") || "Other",
    name,
    organization: field(formData, "organization"),
    contact: field(formData, "contact"),
    notes: field(formData, "notes"),
    status: "New",
    follow_up: "manager",
    created_by: who.userId,
    updated_at: new Date().toISOString(),
  }).select("id").maybeSingle();
  if (error || !data?.id) bounce(path, "error", "That lead could not be saved.");
  await audit({ internId: intern.id, type: "lead", id: String(data.id), action: "lead.captured", actorId: who.userId });
  await signal(intern, "campus.lead.created", String(data.id), who.userId);
  refresh();
  bounce(path, "ok", "Campus lead saved for manager follow-up.");
}

export async function saveCampusLink(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  const intern = await allowedIntern(field(formData, "internId") || who.intern?.id || "", who);
  if (!intern) bounce(path, "error", "That campus is not available on this login.");
  const campus = field(formData, "campus") || "campus";
  const target = field(formData, "target") || "awareness";
  const channel = field(formData, "channel") || "link";
  const code = campusTrackingCode({
    campus,
    intern: intern.preferredName || intern.fullName,
    target,
    channel,
  });
  const reward = campusAttributionReward();
  const { data, error } = await supabaseAdmin.from("campus_growth_links").insert({
    intern_id: intern.id,
    university_id: intern.universityId || null,
    code,
    campaign_label: field(formData, "campaign") || "Campus Growth",
    channel,
    target_type: target,
    grants_reward: reward.grantsAmbassadorReward,
    created_by: who.userId,
  }).select("id").maybeSingle();
  if (error || !data?.id) bounce(path, "error", "That tracking link already exists or could not be saved.");
  await audit({ internId: intern.id, type: "link", id: String(data.id), action: "campaign.launched", actorId: who.userId, note: code });
  refresh();
  bounce(path, "ok", "Campus tracking link saved. It does not create Ambassador rewards.");
}

export async function saveCampusResult(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  const intern = await allowedIntern(field(formData, "internId") || who.intern?.id || "", who);
  if (!intern) bounce(path, "error", "That campus is not available on this login.");
  const lesson = field(formData, "lesson");
  const recommendation = field(formData, "recommendation");
  if (lesson.length < 3 && recommendation.length < 3) bounce(path, "error", "Add what you learned or what to do next.");
  const { data, error } = await supabaseAdmin.from("campus_growth_results").insert({
    intern_id: intern.id,
    university_id: intern.universityId || null,
    lesson,
    recommendation,
    pet_parent_registrations: Math.max(0, Number(field(formData, "petParents") || 0) || 0),
    guru_applications: Math.max(0, Number(field(formData, "guruApplications") || 0) || 0),
    bookings: Math.max(0, Number(field(formData, "bookings") || 0) || 0),
    recorded_by: who.userId,
  }).select("id").maybeSingle();
  if (error || !data?.id) bounce(path, "error", "Those results could not be saved.");
  if (lesson || recommendation) {
    await supabaseAdmin.from("growth_intelligence_entries").insert({
      title: `Campus Growth · ${intern.preferredName || intern.fullName}`,
      study_type: "campus",
      audience: "campus",
      objective: "Campus Growth result",
      key_finding: lesson,
      recommendation,
      status: "recorded",
      created_by_email: who.email,
      updated_at: new Date().toISOString(),
    });
  }
  await audit({ internId: intern.id, type: "result", id: String(data.id), action: "results.recorded", actorId: who.userId });
  await signal(intern, "campus.result.updated", String(data.id), who.userId);
  refresh();
  bounce(path, "ok", "Campus results saved.");
}

export async function saveCampusPolicy(formData: FormData) {
  const who = await actor();
  const path = backPath(formData);
  if (who.kind !== "manager" && who.kind !== "supervisor") bounce(path, "error", "A manager records campus rules.");
  const intern = await allowedIntern(field(formData, "internId"), who);
  if (!intern) bounce(path, "error", "That campus is not on your team.");
  const { error } = await supabaseAdmin.from("campus_growth_profiles").upsert({
    intern_id: intern.id,
    university_id: intern.universityId || null,
    manager_user_id: intern.managerUserId || who.userId,
    policy_notes: field(formData, "policyNotes"),
    market_notes: field(formData, "marketNotes"),
    updated_at: new Date().toISOString(),
  }, { onConflict: "intern_id" });
  if (error) bounce(path, "error", "Campus notes could not be saved.");
  await audit({ internId: intern.id, type: "profile", id: intern.id, action: "policy.updated", actorId: who.userId });
  refresh();
  bounce(path, "ok", "Campus notes saved. Rules stay specific to this campus.");
}

export async function createCampusMission(formData: FormData) {
  const who = await actor();
  if (who.kind !== "manager" && who.kind !== "supervisor") bounce("/manager/campus-growth", "error", "A manager creates a campus mission.");
  const intent = field(formData, "intent") === "draft" ? "draft" : "create";
  const intern = await allowedIntern(field(formData, "internId"), who);
  if (!intern) bounce("/manager/campus-growth", "error", "Choose an intern on your team.");
  const draft = campusMissionDraft({
    internId: intern.id,
    title: field(formData, "title"),
    dueOn: field(formData, "dueOn"),
    description: field(formData, "description"),
    freedom: field(formData, "freedom") || "Explore",
    lane: field(formData, "lane") || "strategy",
    phases: formData.getAll("phase").map((value) => String(value)),
    clientRequestId: field(formData, "clientRequestId") || crypto.randomUUID(),
  });
  const checked = validateManagerAssignment(draft, intent);
  if (!checked.ok) bounce("/manager/campus-growth", "error", Object.values(checked.errors)[0] || "Check the campus mission.");
  const value = checked.value;
  const brief = {
    ...assignmentBrief(value, who.userId),
    campusMission: true,
    campusLane: field(formData, "lane") || "strategy",
    phases: draft.deliverables,
  };
  const payload = {
    intern_id: intern.id,
    title: value.title,
    due_on: value.dueOn || null,
    status: intent === "draft" ? "draft" : "todo",
    business_objective: value.description,
    metric_affected: "Campus Growth",
    student_notes: value.description,
    supervisor_notes: `Campus Growth · ${value.freedom} · ${value.review}`,
    brief_payload: brief,
    updated_at: new Date().toISOString(),
  };
  const { data: created, error } = await supabaseAdmin.from("internship_tasks").insert(payload).select("id").maybeSingle();
  if (error || !created?.id) bounce("/manager/campus-growth", "error", "The campus mission could not be saved.");
  await audit({ internId: intern.id, type: "mission", id: String(created.id), action: intent === "draft" ? "mission.draft" : "mission.created", actorId: who.userId });
  if (intent === "create") {
    try {
      await publishInternAssignmentEvent({
        intern,
        resourceId: String(created.id),
        actor: { userId: who.userId, label: who.email },
        created: true,
      });
      const { syncPublishedAssignment } = await import("@/lib/microsoft/assignment-sync");
      await syncPublishedAssignment({
        assignmentId: String(created.id),
        title: value.title,
        description: value.description,
        category: value.category,
        dueOn: value.dueOn,
        priority: value.priority,
        freedom: value.freedom,
        review: value.review,
        deliverables: value.deliverables,
        resources: value.resources,
        internUserId: intern.userId || "",
        internName: intern.preferredName || intern.fullName,
        managerName: who.email,
        sitguruUrl: `/manager/assignments/${created.id}`,
      });
    } catch (syncError) {
      console.warn("campus mission sync", syncError);
    }
    await signal(intern, "campus.mission.created", String(created.id), who.userId);
  }
  refresh();
  const first = (intern.preferredName || intern.fullName || "your intern").split(/\s+/)[0];
  bounce("/manager/campus-growth", "ok", intent === "draft" ? `Draft saved. ${first} cannot see it yet.` : `Campus mission published for ${first}.`);
}
