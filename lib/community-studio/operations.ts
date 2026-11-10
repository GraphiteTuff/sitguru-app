import { supabaseAdmin } from "@/lib/supabase/admin";
import { publicationRightsValid } from './rights';
import { verifiedBookingParent } from './parent-permissions';
import {
  communityEditable, communityReviewDecision, communitySummary, communityVisible, isCommunityKind,
  type CommunityActionState, type CommunityItem, type CommunityStatus, type CommunityWorkspace,
} from "./model";
import {
  COMMUNITY_BUCKET, canModerateCommunity, communityConfigured, communityImageUpload,
  communityItem, communitySignals, communityWriteError,
  type CommunityActor,
} from "./service";

const text = (form: FormData, key: string) => String(form.get(key) || "").trim();
const failure = (error: string): CommunityActionState => ({ ok: false, error, message: "" });
const success = (message: string): CommunityActionState => ({ ok: true, error: "", message });
const uuid = (value: string) => /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
function emptyWorkspace(error = "", ready = false): CommunityWorkspace {
  return { items: [], summary: communitySummary([]), canModerate: false, ready, error, tasks: [], content: [] };
}

export async function loadCommunityWorkspaceForActor(mode: "manager" | "intern" | "member", actor: CommunityActor | null): Promise<CommunityWorkspace> {
  if (!communityConfigured()) return emptyWorkspace("Connect an isolated Supabase development project to enable Community Studio.");
  try {
    if (!actor) return emptyWorkspace("Sign in to submit to the SitGuru Pack.", true);
    if (mode === "manager" && !actor.canModerate) return emptyWorkspace("Manager access is required.", true);
    let query = supabaseAdmin.from("community_studio_submissions").select("*").order("created_at", { ascending: false }).limit(150);
    if (mode === "manager") query = query.neq("status", "draft");
    if (mode === "manager" && !actor.isSuperUser) {
      const { data: interns } = await supabaseAdmin.from("internship_interns").select("id").eq("manager_user_id", actor.user.id);
      const ids = (interns || []).map((row) => String(row.id)).filter(uuid);
      query = query.or(`intern_id.is.null,submitter_user_id.eq.${actor.user.id}${ids.length ? `,intern_id.in.(${ids.join(",")})` : ""}`);
    } else if (mode !== "manager") query = query.eq("submitter_user_id", actor.user.id);
    const { data, error } = await query;
    if (error) return emptyWorkspace("Community Studio storage is not ready. Apply the Community Studio migration to the isolated database.");
    const ownDrafts = mode === "manager" ? await supabaseAdmin.from("community_studio_submissions").select("*").eq("submitter_user_id", actor.user.id).eq("status", "draft").order("created_at", { ascending: false }).limit(50) : { data: [] };
    const items = [...(data || []), ...(ownDrafts.data || [])].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).map((row) => communityItem(row, {
      owner: row.submitter_user_id === actor.user.id,
      reviewer: mode === "manager" && actor.canModerate,
    }));
    const [tasks, content] = actor.intern ? await Promise.all([
      supabaseAdmin.from("internship_tasks").select("id,title").eq("intern_id", actor.intern.id).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("internship_content").select("id,title").eq("intern_id", actor.intern.id).order("created_at", { ascending: false }).limit(50),
    ]) : [{ data: [] }, { data: [] }];
    const {data: bookings} = await supabaseAdmin.from('bookings').select('id,guru_id').in('guru_id',actor.guruIds).limit(50);
    return {
      items, summary: communitySummary(items), ready: true, error: "", canModerate: actor.canModerate,
      tasks: (tasks.data || []).map((row) => ({ id: String(row.id), title: String(row.title) })),
      content: (content.data || []).map((row) => ({ id: String(row.id), title: String(row.title) })),
      bookings: (bookings || []).map(row => ({id:String(row.id),label:`Care booking ${String(row.id).slice(0,8)}`})),
    };
  } catch {
    return emptyWorkspace("Community Studio is unavailable. Check the isolated development configuration.");
  }
}

export async function saveCommunitySubmissionForActor(form: FormData, actor: CommunityActor | null): Promise<CommunityActionState> {
  const blocked = communityWriteError();
  if (blocked) return failure(blocked);
  if (!communityConfigured()) return failure("Community Studio is not configured.");
  let uploadedPath = "";
  try {
    if (!actor) return failure("Sign in to submit your story.");
    const id = text(form, "id");
    const title = text(form, "title");
    const kind = text(form, "kind");
    const story = text(form, "story");
    const petName = text(form, "petName");
    const location = text(form, "location");
    const submit = text(form, "intent") === "submit";
    const consent = form.get('publicConsent') === 'on';
    const socialConsent = form.get('socialConsent') === 'on';
    if (!title || title.length > 160 || !isCommunityKind(kind)) return failure("Add a title up to 160 characters and select a community collection.");
    if (story.length > 5000 || petName.length > 100 || location.length > 120) return failure("Keep the story under 5,000 characters, pet name under 100, and location under 120.");
    if (submit && (!consent || story.length < 20)) return failure("Add a story of at least 20 characters and confirm permission to publish it.");
    if (id && !uuid(id)) return failure("This submission could not be found.");
    const { data: existing } = id ? await supabaseAdmin.from("community_studio_submissions").select("*").eq("id", id).eq("submitter_user_id", actor.user.id).maybeSingle() : { data: null };
    if (id && (!existing || !communityEditable(String(existing.status)))) return failure("Only your drafts or submissions returned for changes can be edited.");
    if (existing && text(form, "updatedAt") !== String(existing.updated_at)) return failure("Your draft changed. Refresh before saving it again.");
    if (!id) {
      const { count, error: countError } = await supabaseAdmin.from("community_studio_submissions").select("id", { count: "exact", head: true }).eq("submitter_user_id", actor.user.id).gte("created_at", new Date(Date.now() - 86400000).toISOString());
      if (countError) return failure("Submissions are temporarily unavailable. Refresh and try again.");
      if ((count || 0) >= 20) return failure("You have reached today's submission limit. Continue editing an existing draft.");
    }
    const taskId = text(form, "taskId");
    const contentId = text(form, "contentId");
    for (const [value, table] of [[taskId, "internship_tasks"], [contentId, "internship_content"]]) {
      if (!value) continue;
      if (!uuid(value) || !actor.intern) return failure("Choose a linked assignment or Content Studio draft from your own internship.");
      const { data } = await supabaseAdmin.from(table).select("id").eq("id", value).eq("intern_id", actor.intern.id).maybeSingle();
      if (!data) return failure("That assignment or Content Studio draft does not belong to your internship.");
    }
    const file = form.get("file");
    let imagePath = String(existing?.image_path || "");
    let imageMime = String(existing?.image_mime || "");
    let mediaSafe = existing?.media_safe === true;
    const mediaPath = text(form,'mediaPath');
    if (mediaPath) {
      const {data: upload} = await supabaseAdmin.from('community_studio_uploads').select('*').eq('safe_path',mediaPath).eq('user_id',actor.user.id).not('verified_at','is',null).maybeSingle();
      if (!upload) return failure('Attach media verified by your own account.');
      imagePath = upload.safe_path; imageMime = upload.mime; mediaSafe = true;
    }
    if (file instanceof File && file.size) {
      return failure('Use the private verified upload flow before saving media.');
    }
    if (submit && ["pet_of_week", "gallery", "guru_spotlight"].includes(kind) && !imagePath) return failure("Add a photo before submitting to this collection.");
    if (kind === 'pet_of_week' && imageMime.startsWith('video/')) return failure('Pet of the Week needs a featured photo. Share videos in the gallery.');
    const featuresClientPet = form.get('featuresClientPet') === 'on' || (actor.isGuru && imageMime.startsWith('video/') && kind !== 'guru_spotlight');
    const bookingId = featuresClientPet ? text(form,'bookingId') : '';
    const parentId = featuresClientPet ? await verifiedBookingParent(bookingId,actor) : '';
    if (featuresClientPet && !parentId) return failure('Choose a care booking assigned to you with a verified Pet Parent.');
    const now = new Date().toISOString();
    const payload = {
      submitter_user_id: actor.user.id,
      submitter_name: String(actor.intern?.fullName || actor.user.user_metadata?.full_name || actor.user.user_metadata?.name || "SitGuru member").slice(0, 160),
      intern_id: actor.intern?.id || null,
      title, kind, pet_name: petName, story, location,
      status: submit ? "pending" : "draft", consent, consent_at: consent ? now : null,
      public_consent:consent, social_consent:socialConsent, social_consent_at:socialConsent ? now : null,
      media_safe:mediaSafe, features_client_pet:featuresClientPet, booking_id:bookingId || null,
      parent_user_id:parentId || null, parent_permission_status:featuresClientPet ? 'pending' : 'not_required',
      parent_social_consent:false,parent_decided_at:null,
      image_path: imagePath, image_mime: imageMime, content_id: contentId || null, task_id: taskId || null,
      approved_at: null, approved_by: null, publish_at: null, week_of: null, updated_by: actor.user.id,
    };
    const result = existing
      ? await supabaseAdmin.from("community_studio_submissions").update(payload).eq("id", id).eq("submitter_user_id", actor.user.id).eq("updated_at", String(existing.updated_at)).select("*").maybeSingle()
      : await supabaseAdmin.from("community_studio_submissions").insert(payload).select("*").single();
    if (result.error || !result.data) {
      return failure("The submission changed or could not be saved. Refresh the page and try again.");
    }
    uploadedPath = "";
    await communitySignals(actor, result.data, submit ? "submit" : "draft");
    return success(submit ? "Submitted for manager review. Your story stays private until approved and published." : "Your private draft was saved.");
  } catch {
    return failure("The submission could not be saved. Check the isolated development setup and try again.");
  } finally {
    if (uploadedPath) {
      try { await supabaseAdmin.storage.from(COMMUNITY_BUCKET).remove([uploadedPath]); } catch { /* Cleanup must not hide the original validation error. */ }
    }
  }
}

export async function reviewCommunitySubmissionForActor(form: FormData, actor: CommunityActor | null): Promise<CommunityActionState> {
  const blocked = communityWriteError();
  if (blocked) return failure(blocked);
  if (!communityConfigured()) return failure("Community Studio is not configured.");
  try {
    if (!actor?.canModerate) return failure("Manager access is required.");
    const id = text(form, "id");
    if (!uuid(id)) return failure("This submission could not be found.");
    const { data: row } = await supabaseAdmin.from("community_studio_submissions").select("*").eq("id", id).maybeSingle();
    if (!row || !(await canModerateCommunity(actor, row))) return failure("This submission is outside your moderation queue.");
    const feedback = text(form, "feedback");
    if (feedback.length > 3000) return failure("Keep feedback under 3,000 characters.");
    if (text(form, "updatedAt") !== row.updated_at) return failure("This submission changed. Refresh before reviewing it.");
    const action = text(form, "action");
    const weekOf = text(form, "weekOf") || String(row.week_of || "");
    const decision = communityReviewDecision({ status: row.status as CommunityStatus, kind: row.kind, action, feedback, publishAt: text(form, "publishAt"), weekOf });
    if (!decision.ok) return failure(decision.error);
    if (action !== "archive" && (!row.consent || !row.consent_at)) return failure("The submitter must grant permission before this submission can be approved.");
    if (['approve','publish','schedule'].includes(action) && !publicationRightsValid(row)) return failure('Separate website consent, verified media, and the Pet Parent’s approval (when needed) are required.');
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("community_studio_submissions").update({
      status: decision.status, feedback: feedback || row.feedback,
      approved_by: action === "approve" ? actor.user.id : ["request_changes", "reject"].includes(action) ? null : row.approved_by,
      approved_at: action === "approve" ? now : ["request_changes", "reject"].includes(action) ? null : row.approved_at,
      publish_at: decision.publishAt,
      week_of: row.kind === "pet_of_week" && ["schedule", "publish"].includes(action) ? weekOf : row.week_of,
      updated_by: actor.user.id,
    }).eq("id", id).eq("updated_at", String(row.updated_at)).select("*").maybeSingle();
    if (error?.code === "23505") return failure("A Pet of the Week is already selected for that week. Choose another Monday or archive the previous selection.");
    if (error || !data) return failure("The submission changed or the review could not be saved. Refresh and try again.");
    await communitySignals(actor, data, action);
    return success(action === "schedule" ? "Publication scheduled. The approved story becomes visible automatically at the selected UTC time." : action === "publish" ? "Published to the SitGuru Pack." : "Review saved.");
  } catch {
    return failure("The review could not be saved. Check the isolated development configuration.");
  }
}

export async function loadPublishedCommunityItems(): Promise<CommunityItem[]> {
  if (!communityConfigured()) return [];
  try {
    const { data, error } = await supabaseAdmin.from("community_studio_submissions").select("*").in("status", ["published", "scheduled"]).eq("consent", true).not("approved_at", "is", null).lte("publish_at", new Date().toISOString()).order("publish_at", { ascending: false }).limit(80);
    if (error) return [];
    return (data || []).filter((row) => publicationRightsValid(row) && communityVisible({ status: row.status, consent: row.consent, approvedAt: row.approved_at, publishAt: row.publish_at })).map((row) => communityItem(row, { public: true }));
  } catch { return []; }
}
