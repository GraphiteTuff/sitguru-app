import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  assertNoSelfPublish,
  canInternEditContent,
  type ReadsIdentity,
} from "./access";
import { notifyReadsWorkflow } from "./notifications";
import { slugifyReads } from "./slug";
import type {
  ReadsContentType,
  ReadsDisclosureLabel,
  ReadsStatus,
} from "./types";
import { buildManualYoutubeImport } from "./youtube";

export type UpsertReadsContentInput = {
  id?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  editorial_summary?: string;
  why_recommended?: string;
  content_type: ReadsContentType;
  disclosure_label?: ReadsDisclosureLabel;
  image_url?: string;
  thumbnail_url?: string;
  external_url?: string;
  affiliate_disclosure?: string;
  audience?: string[];
  tags?: string[];
  topic_ids?: string[];
  book?: Record<string, unknown>;
  publication?: Record<string, unknown>;
  podcast?: Record<string, unknown>;
  video?: Record<string, unknown>;
  person?: Record<string, unknown>;
  related_ids?: string[];
};

async function writeAudit(params: {
  contentId: string;
  identity: ReadsIdentity;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  await Promise.allSettled([
    supabaseAdmin.from("reads_content_reviews").insert({
      content_id: params.contentId,
      reviewer_id: params.identity.id,
      reviewer_email: params.identity.email,
      action: params.action,
      note: params.note || null,
      from_status: params.fromStatus || null,
      to_status: params.toStatus || null,
    }),
    params.toStatus
      ? supabaseAdmin.from("reads_content_status_history").insert({
          content_id: params.contentId,
          actor_id: params.identity.id,
          actor_email: params.identity.email,
          from_status: params.fromStatus || null,
          to_status: params.toStatus,
          reason: params.note || null,
          metadata: params.metadata || {},
        })
      : Promise.resolve(),
  ]);
}

export async function upsertReadsContent(
  identity: ReadsIdentity,
  input: UpsertReadsContentInput,
) {
  const slug = slugifyReads(input.slug || input.title);
  const payload = {
    slug,
    title: input.title.trim(),
    subtitle: input.subtitle || null,
    description: input.description || null,
    editorial_summary: input.editorial_summary || null,
    why_recommended: input.why_recommended || null,
    content_type: input.content_type,
    disclosure_label: input.disclosure_label || "sitguru_recommended",
    image_url: input.image_url || null,
    thumbnail_url: input.thumbnail_url || null,
    external_url: input.external_url || null,
    affiliate_disclosure: input.affiliate_disclosure || null,
    audience: input.audience || [],
    tags: input.tags || [],
    updated_at: new Date().toISOString(),
  };

  let contentId = input.id;

  if (contentId) {
    const existing = await supabaseAdmin
      .from("reads_content")
      .select("id,created_by,assigned_intern_id,status")
      .eq("id", contentId)
      .maybeSingle();

    if (!existing.data) throw new Error("Content not found.");
    if (!canInternEditContent(identity, existing.data)) {
      throw new Error("Not authorized to edit this draft.");
    }
    if (
      identity.staffRole === "intern" &&
      !["draft", "changes_requested"].includes(String(existing.data.status))
    ) {
      throw new Error("Interns can only edit drafts or change-requested items.");
    }

    const { error } = await supabaseAdmin
      .from("reads_content")
      .update(payload)
      .eq("id", contentId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabaseAdmin
      .from("reads_content")
      .insert({
        ...payload,
        status: "draft",
        visibility: "public",
        created_by: identity.id,
        assigned_intern_id:
          identity.staffRole === "intern" ? identity.id : null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    contentId = data.id;
  }

  await syncTypeExtension(contentId!, input);
  if (input.topic_ids?.length) {
    await supabaseAdmin
      .from("reads_content_topics")
      .delete()
      .eq("content_id", contentId!);
    await supabaseAdmin.from("reads_content_topics").insert(
      input.topic_ids.map((topic_id) => ({
        content_id: contentId!,
        topic_id,
      })),
    );
  }

  if (input.related_ids?.length) {
    await supabaseAdmin
      .from("reads_relationships")
      .delete()
      .eq("from_content_id", contentId!);
    await supabaseAdmin.from("reads_relationships").insert(
      input.related_ids.map((to_content_id, index) => ({
        from_content_id: contentId!,
        to_content_id,
        relationship_type: "related",
        display_order: (index + 1) * 10,
      })),
    );
  }

  return { id: contentId!, slug };
}

async function syncTypeExtension(
  contentId: string,
  input: UpsertReadsContentInput,
) {
  const tableByType: Record<string, string> = {
    book: "reads_books",
    magazine: "reads_publications",
    publication: "reads_publications",
    podcast: "reads_podcasts",
    video: "reads_videos",
    author: "reads_people",
    expert: "reads_people",
  };
  const table = tableByType[input.content_type];
  if (!table) return;

  let extension: Record<string, unknown> =
    (input.book ||
      input.publication ||
      input.podcast ||
      input.video ||
      input.person ||
      {}) as Record<string, unknown>;

  // Ensure NOT NULL extension columns are populated for generic draft creates.
  if (
    (input.content_type === "magazine" ||
      input.content_type === "publication") &&
    !String(extension.publication_name || "").trim()
  ) {
    extension = {
      ...extension,
      publication_name: input.title.trim(),
    };
  }
  if (
    (input.content_type === "author" || input.content_type === "expert") &&
    !String(extension.person_type || "").trim()
  ) {
    extension = {
      ...extension,
      person_type: input.content_type === "expert" ? "pet_industry_expert" : "author",
    };
  }

  const { error } = await supabaseAdmin.from(table).upsert({
    content_id: contentId,
    ...extension,
  });
  if (error) throw new Error(error.message);
}

export async function setReadsFeatured(
  identity: ReadsIdentity,
  contentId: string,
  featured: boolean,
  featureType?: string | null,
) {
  if (!identity.canPublish) {
    throw new Error("Featuring content requires manager or admin access.");
  }

  const { data: existing, error } = await supabaseAdmin
    .from("reads_content")
    .select("id,status,featured,feature_type")
    .eq("id", contentId)
    .maybeSingle();
  if (error || !existing) throw new Error("Content not found.");

  const { error: updateError } = await supabaseAdmin
    .from("reads_content")
    .update({
      featured,
      feature_type: featured ? featureType || "homepage" : "none",
      reviewed_by: identity.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", contentId);
  if (updateError) throw new Error(updateError.message);

  await writeAudit({
    contentId,
    identity,
    action: featured ? "feature" : "unfeature",
    fromStatus: existing.status,
    toStatus: existing.status,
    note: featured ? `Featured as ${featureType || "homepage"}` : "Unfeatured",
    metadata: {
      featured,
      feature_type: featured ? featureType || "homepage" : "none",
    },
  });

  return {
    id: contentId,
    featured,
    feature_type: featured ? featureType || "homepage" : "none",
  };
}

export async function transitionReadsStatus(
  identity: ReadsIdentity,
  contentId: string,
  toStatus: ReadsStatus,
  note?: string,
  extras?: { scheduled_at?: string },
) {
  const { data: existing, error } = await supabaseAdmin
    .from("reads_content")
    .select("*")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !existing) throw new Error("Content not found.");

  const fromStatus = String(existing.status) as ReadsStatus;

  if (identity.staffRole === "intern") {
    if (!canInternEditContent(identity, existing)) {
      throw new Error("Not authorized.");
    }
    if (toStatus !== "submitted" && toStatus !== "draft") {
      assertNoSelfPublish(identity);
    }
    if (toStatus === "submitted" && !["draft", "changes_requested"].includes(fromStatus)) {
      throw new Error("Only drafts or change-requested items can be submitted.");
    }
  }

  if (
    ["approved", "scheduled", "published", "archived"].includes(toStatus) &&
    identity.staffRole === "intern"
  ) {
    assertNoSelfPublish(identity);
  }

  if (toStatus === "published" && !identity.canPublish) {
    throw new Error("Publishing requires manager or admin access.");
  }

  if (toStatus === "archived" && !identity.canOverride) {
    throw new Error("Archiving requires admin override access.");
  }

  const update: Record<string, unknown> = {
    status: toStatus,
    review_note: note || existing.review_note,
    reviewed_by: identity.id,
    reviewed_at: new Date().toISOString(),
  };

  if (toStatus === "published") {
    update.published_at = existing.published_at || new Date().toISOString();
  }
  if (toStatus === "scheduled" && extras?.scheduled_at) {
    update.scheduled_at = extras.scheduled_at;
  }
  if (toStatus === "archived") {
    update.archived_at = new Date().toISOString();
  }
  // Featured state must use setReadsFeatured() — do not piggyback here.

  const { error: updateError } = await supabaseAdmin
    .from("reads_content")
    .update(update)
    .eq("id", contentId);
  if (updateError) throw new Error(updateError.message);

  const actionMap: Record<string, string> = {
    submitted: "submit",
    changes_requested: "request_changes",
    approved: "approve",
    scheduled: "schedule",
    published: "publish",
    archived: "archive",
  };

  await writeAudit({
    contentId,
    identity,
    action: actionMap[toStatus] || "override",
    fromStatus,
    toStatus,
    note,
  });

  await notifyReadsWorkflow({
    action: toStatus,
    contentTitle: existing.title,
    contentId,
    actorEmail: identity.email,
    note,
    createdBy: existing.created_by,
    assignedManagerId: existing.assigned_manager_id,
  });

  return { id: contentId, status: toStatus };
}

export async function importYoutubeVideo(
  identity: ReadsIdentity,
  input: { urlOrId: string; title?: string; description?: string },
) {
  const draft = buildManualYoutubeImport(input.urlOrId, {
    title: input.title,
    description: input.description,
  });
  if (!draft) throw new Error("Invalid YouTube URL or video ID.");

  const created = await upsertReadsContent(identity, {
    title: draft.title,
    description: draft.description,
    content_type: "video",
    thumbnail_url: draft.thumbnail_url,
    image_url: draft.thumbnail_url,
    external_url: draft.youtube_url,
    video: {
      youtube_video_id: draft.youtube_video_id,
      youtube_url: draft.youtube_url,
      import_source: draft.import_source,
      import_status: draft.import_status,
    },
  });

  // Keep newly imported videos in needs-review workflow.
  await supabaseAdmin
    .from("reads_content")
    .update({ status: "draft", review_note: "YouTube import — needs review" })
    .eq("id", created.id);

  await writeAudit({
    contentId: created.id,
    identity,
    action: "submit",
    fromStatus: null,
    toStatus: "draft",
    note: `YouTube import ${draft.youtube_video_id}`,
  });

  return { ...created, youtube_video_id: draft.youtube_video_id };
}

export async function upsertTeamPick(
  identity: ReadsIdentity,
  input: {
    id?: string;
    team_member_id: string;
    content_id: string;
    recommendation_type: string;
    quote: string;
    featured?: boolean;
    is_active?: boolean;
    display_order?: number;
  },
) {
  const payload = {
    team_member_id: input.team_member_id,
    content_id: input.content_id,
    recommendation_type: input.recommendation_type,
    quote: input.quote.trim(),
    featured: Boolean(input.featured),
    is_active: input.is_active !== false,
    display_order: input.display_order ?? 100,
    published_at: new Date().toISOString(),
    created_by: identity.id,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabaseAdmin
      .from("reads_team_picks")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }

  const { data, error } = await supabaseAdmin
    .from("reads_team_picks")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}
