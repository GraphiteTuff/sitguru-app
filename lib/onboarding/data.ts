import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  itemComplete,
  onboardingProgress,
  statusLabel,
  type OnboardingItemState,
  type OnboardingKind,
} from "@/lib/onboarding/domain";

export type OnboardingCard = OnboardingItemState & {
  statusText: string;
  locked: boolean;
  fileHref: string;
  signingUrl: string;
  provider: string;
  finalDocumentRef: string;
  note: string;
};

export type OnboardingWorkspace = {
  instanceId: string;
  templateName: string;
  status: string;
  completedAt: string | null;
  percent: number;
  complete: boolean;
  outstanding: string[];
  repositoryLabel: string;
  timekeeperEnabled: boolean;
  items: OnboardingCard[];
};

function rows(data: unknown) {
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

function text(value: unknown) {
  return String(value || "").trim();
}

async function settings() {
  const { data } = await supabaseAdmin.from("onboarding_settings").select("key,value");
  const map: Record<string, string> = {};
  for (const row of rows(data)) map[text(row.key)] = text(row.value);
  return map;
}

export async function timekeeperOnboardingEnabled() {
  try {
    const map = await settings();
    return map.timekeeper_orientation === "true";
  } catch {
    return false;
  }
}

function missingTable(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("onboarding_") || message.includes("does not exist") || message.includes("schema cache");
}

export async function loadOnboardingForUser(userId: string): Promise<OnboardingWorkspace | null> {
  if (!userId) return null;
  const { data: instance, error } = await supabaseAdmin
    .from("onboarding_instances")
    .select("id,template_id,status,completed_at")
    .eq("subject_user_id", userId)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (!missingTable(error)) console.error("[onboarding] instance", error.message);
    return null;
  }
  if (!instance) return null;
  return hydrateInstance(instance as Record<string, unknown>, true);
}

export async function loadOnboardingPeople() {
  const { data, error } = await supabaseAdmin
    .from("onboarding_instances")
    .select("id,subject_user_id,subject_role,status,completed_at,assigned_at,template_id")
    .order("assigned_at", { ascending: false })
    .limit(40);
  if (error) {
    if (!missingTable(error)) console.error("[onboarding] people", error.message);
    return [];
  }
  const instances = rows(data);
  const userIds = [...new Set(instances.map((row) => text(row.subject_user_id)).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from("profiles").select("id,full_name,email").in("id", userIds)
    : { data: [] };
  const people = new Map(
    rows(profiles).map((row) => [text(row.id), { name: text(row.full_name) || "Team member", email: text(row.email) }]),
  );
  const cards = [];
  for (const instance of instances) {
    const workspace = await hydrateInstance(instance, true);
    if (!workspace) continue;
    const person = people.get(text(instance.subject_user_id));
    cards.push({
      userId: text(instance.subject_user_id),
      name: person?.name || "Team member",
      email: person?.email || "",
      role: text(instance.subject_role).replaceAll("_", " "),
      workspace,
    });
  }
  return cards;
}

export async function loadOnboardingAudit(instanceId: string) {
  const { data, error } = await supabaseAdmin
    .from("onboarding_audit_events")
    .select("id,action,previous_status,new_status,note,created_at,actor_role")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return rows(data).map((row) => ({
    id: text(row.id),
    action: text(row.action).replaceAll("_", " "),
    previous: text(row.previous_status),
    next: text(row.new_status),
    note: text(row.note),
    at: text(row.created_at),
    role: text(row.actor_role),
  }));
}

export async function internReadiness(userId: string) {
  const workspace = await loadOnboardingForUser(userId);
  if (!workspace) return null;
  return {
    complete: workspace.complete,
    percent: workspace.percent,
    items: workspace.items.map((item) => ({
      title: item.title,
      status: item.statusText,
    })),
  };
}

async function hydrateInstance(instance: Record<string, unknown>, includeSensitive: boolean) {
  const instanceId = text(instance.id);
  const [{ data: items, error }, { data: template }, map] = await Promise.all([
    supabaseAdmin
      .from("onboarding_items")
      .select("id,kind,requirement,status,sort_order,version_id,provider,signing_url,final_document_ref,admin_note,referenced_versions")
      .eq("instance_id", instanceId)
      .order("sort_order", { ascending: true }),
    supabaseAdmin.from("onboarding_templates").select("name").eq("id", text(instance.template_id)).maybeSingle(),
    settings().catch(() => ({}) as Record<string, string>),
  ]);
  if (error) return null;
  const versionIds = rows(items).map((row) => text(row.version_id)).filter(Boolean);
  const { data: versions } = versionIds.length
    ? await supabaseAdmin
        .from("onboarding_document_versions")
        .select("id,version_label,document_id,storage_ref")
        .in("id", versionIds)
    : { data: [] };
  const versionMap = new Map(rows(versions).map((row) => [text(row.id), row]));
  const documentIds = rows(versions).map((row) => text(row.document_id)).filter(Boolean);
  const { data: documents } = documentIds.length
    ? await supabaseAdmin.from("onboarding_documents").select("id,title").in("id", documentIds)
    : { data: [] };
  const titles = new Map(rows(documents).map((row) => [text(row.id), text(row.title)]));
  const states: OnboardingItemState[] = rows(items).map((row) => {
    const version = versionMap.get(text(row.version_id));
    return {
      id: text(row.id),
      kind: text(row.kind) as OnboardingKind,
      requirement: text(row.requirement) === "optional" ? "optional" : "required",
      status: text(row.status) || "assigned",
      title: titles.get(text(version?.document_id)) || "Document",
      versionId: text(row.version_id),
      versionLabel: text(version?.version_label) || "v1.0",
      storageRef: text(version?.storage_ref),
      signingUrl: text(row.signing_url),
    };
  });
  const reviewDone = states
    .filter((item) => item.kind === "review" && item.requirement === "required")
    .every((item) => item.status === "reviewed" || item.status === "superseded");
  const progress = onboardingProgress(states);
  const cards: OnboardingCard[] = states.map((item, index) => {
    const row = rows(items)[index];
    const locked = item.kind === "acknowledgment" && !reviewDone && item.status !== "fully_executed";
    return {
      ...item,
      statusText: locked && item.status === "assigned" ? "Locked until required documents are reviewed" : statusLabel(item.kind, item.status),
      locked,
      fileHref: includeSensitive && item.versionId ? `/api/onboarding/file?version=${item.versionId}` : "",
      signingUrl: includeSensitive ? text(row?.signing_url) : "",
      provider: text(row?.provider),
      finalDocumentRef: includeSensitive ? text(row?.final_document_ref) : "",
      note: text(row?.admin_note),
      storageRef: includeSensitive ? item.storageRef : "",
    };
  });
  return {
    instanceId,
    templateName: text(template?.name) || "Onboarding",
    status: text(instance.status),
    completedAt: text(instance.completed_at) || null,
    percent: progress.percent,
    complete: progress.complete,
    outstanding: progress.outstanding,
    repositoryLabel: map.personnel_repository_label || "Restricted personnel folder",
    timekeeperEnabled: map.timekeeper_orientation === "true",
    items: cards,
  } satisfies OnboardingWorkspace;
}

export function completionFields(items: OnboardingItemState[]) {
  return items.map((item) => ({ ...item, done: itemComplete(item) }));
}
