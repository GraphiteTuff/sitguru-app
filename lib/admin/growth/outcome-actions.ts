"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function int(formData: FormData, key: string) {
  const n = Number(formData.get(key));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function refresh() {
  revalidatePath("/admin/growth", "layout");
  revalidatePath("/intern/growth", "layout");
}

export async function saveGrowthEventResultAction(formData: FormData) {
  const access = await requireGrowthActor();
  if (!access.ok) return { ok: false as const, error: access.error };
  if (access.actor.kind === "intern") {
    return {
      ok: false as const,
      error: "Interns record learning in the portal. Event results are for managers.",
    };
  }

  const eventName = text(formData, "eventName");
  if (!eventName) return { ok: false as const, error: "Event name is required." };

  const payload = {
    community_event_id: text(formData, "communityEventId") || null,
    event_name: eventName,
    event_date: text(formData, "eventDate") || null,
    location: text(formData, "location"),
    event_type: text(formData, "eventType") || "community",
    status: text(formData, "status") || "completed",
    objective: text(formData, "objective"),
    target_audiences: text(formData, "targetAudiences"),
    pet_parent_leads: int(formData, "petParentLeads"),
    guru_leads: int(formData, "guruLeads"),
    ambassador_leads: int(formData, "ambassadorLeads"),
    qr_scans: int(formData, "qrScans"),
    pet_parent_registrations: int(formData, "petParentRegistrations"),
    guru_registrations: int(formData, "guruRegistrations"),
    ambassador_registrations: int(formData, "ambassadorRegistrations"),
    follow_up_count: int(formData, "followUpCount"),
    notes: text(formData, "notes"),
    lessons_learned: text(formData, "lessonsLearned"),
    recommended_next_action: text(formData, "recommendedNextAction"),
    leads_metric_source: text(formData, "leadsMetricSource") || "manual",
    registrations_metric_source:
      text(formData, "registrationsMetricSource") || "manual",
    qr_scans_metric_source: text(formData, "qrScansMetricSource") || "manual",
    recorded_by_email: access.actor.email,
    updated_at: new Date().toISOString(),
  };

  const id = text(formData, "id");
  const { error } = id
    ? await supabaseAdmin.from("growth_event_results").update(payload).eq("id", id)
    : await supabaseAdmin.from("growth_event_results").insert(payload);

  if (error) {
    console.warn("saveGrowthEventResultAction", error);
    return { ok: false as const, error: "Could not save event results." };
  }

  const { publishGrowthWorkspaceEvent, SITGURU_DOMAIN_EVENTS } = await import(
    "@/lib/realtime/publish-internship"
  );
  await publishGrowthWorkspaceEvent({
    eventType: SITGURU_DOMAIN_EVENTS.GROWTH_EVENT_RECORDED,
    resourceType: "growth_event_results",
    resourceId: id || "new",
    actor: { userId: access.actor.id, label: access.actor.email },
  });

  refresh();
  return { ok: true as const };
}

export async function saveGrowthIntelligenceAction(formData: FormData) {
  const access = await requireGrowthActor();
  if (!access.ok) return { ok: false as const, error: access.error };

  const title = text(formData, "title");
  if (!title) return { ok: false as const, error: "Title is required." };

  const payload = {
    title,
    study_type: text(formData, "studyType") || "survey",
    audience: text(formData, "audience"),
    objective: text(formData, "objective"),
    response_count: int(formData, "responseCount"),
    key_finding: text(formData, "keyFinding"),
    business_interpretation: text(formData, "businessInterpretation"),
    recommendation: text(formData, "recommendation"),
    action_taken: text(formData, "actionTaken"),
    follow_up_test: text(formData, "followUpTest"),
    status: text(formData, "status") || "recorded",
    tested_on: text(formData, "testedOn") || null,
    created_by_email: access.actor.email,
    updated_at: new Date().toISOString(),
  };

  const id = text(formData, "id");
  const { error } = id
    ? await supabaseAdmin
        .from("growth_intelligence_entries")
        .update(payload)
        .eq("id", id)
    : await supabaseAdmin.from("growth_intelligence_entries").insert(payload);

  if (error) {
    console.warn("saveGrowthIntelligenceAction", error);
    return { ok: false as const, error: "Could not save growth insight." };
  }

  const { publishGrowthWorkspaceEvent, SITGURU_DOMAIN_EVENTS } = await import(
    "@/lib/realtime/publish-internship"
  );
  await publishGrowthWorkspaceEvent({
    eventType: SITGURU_DOMAIN_EVENTS.GROWTH_INTELLIGENCE_RECORDED,
    resourceType: "growth_intelligence_entries",
    resourceId: id || "new",
    actor: { userId: access.actor.id, label: access.actor.email },
  });

  refresh();
  return { ok: true as const };
}

export async function saveGrowthInitiativeAction(formData: FormData) {
  const access = await requireGrowthActor();
  if (!access.ok) return { ok: false as const, error: access.error };
  if (access.actor.kind === "intern") {
    return { ok: false as const, error: "Initiatives are manager-led." };
  }

  const name = text(formData, "name");
  if (!name) return { ok: false as const, error: "Initiative name is required." };

  const payload = {
    name,
    purpose: text(formData, "purpose"),
    status: text(formData, "status") || "active",
    market: text(formData, "market"),
    start_on: text(formData, "startOn") || null,
    end_on: text(formData, "endOn") || null,
    notes: text(formData, "notes"),
    created_by_email: access.actor.email,
    updated_at: new Date().toISOString(),
  };

  const { data: created, error } = await supabaseAdmin
    .from("growth_initiatives")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) {
    console.warn("saveGrowthInitiativeAction", error);
    return { ok: false as const, error: "Could not save initiative." };
  }

  const { publishGrowthWorkspaceEvent, SITGURU_DOMAIN_EVENTS } = await import(
    "@/lib/realtime/publish-internship"
  );
  await publishGrowthWorkspaceEvent({
    eventType: SITGURU_DOMAIN_EVENTS.GROWTH_INITIATIVE_CREATED,
    resourceType: "growth_initiatives",
    resourceId: String(created?.id || name),
    actor: { userId: access.actor.id, label: access.actor.email },
  });

  refresh();
  return { ok: true as const };
}
