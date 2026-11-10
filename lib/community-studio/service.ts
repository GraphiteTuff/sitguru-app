import { randomUUID } from "crypto";
import type { User } from "@supabase/supabase-js";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { findInternByAccount } from "@/lib/internship/queries";
import { creativeBytesMatch } from "@/lib/internship/content-creative";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { communityEditable, communityVisible, type CommunityItem } from "./model";
import { communityEnvironmentWriteError } from "./safety";
import { publicationRightsValid, socialReuseAllowed } from "./rights";

export const COMMUNITY_BUCKET = "sitguru-community-private";
type DbRow = Record<string, unknown>;

export function communityConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** New workflows fail closed in development/previews, even if production credentials are accidentally inherited. */
export function communityWriteError() {
  return communityEnvironmentWriteError({
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SITGURU_ISOLATED_BACKEND: process.env.SITGURU_ISOLATED_BACKEND,
  });
}

export async function communityActor(knownUser?: User) {
  try {
    const user = knownUser || (await (await createClient()).auth.getUser()).data.user;
    if (!user) return null;
    const [admin, intern, gurus] = await Promise.all([resolveAdminIdentityForUser(user), findInternByAccount({ userId: user.id, email: user.email }), supabaseAdmin.from('gurus').select('id').eq('user_id',user.id)]);
    return {
      user, admin, intern, guruIds: [user.id, ...(gurus.data || []).map(guru => String(guru.id))], isGuru: Boolean(gurus.data?.length),
      canModerate: Boolean(admin?.id === user.id && canUseGrowthPortal(admin)),
      isSuperUser: Boolean(admin?.id === user.id && admin.isSuperUser),
    };
  } catch { return null; }
}
export type CommunityActor = NonNullable<Awaited<ReturnType<typeof communityActor>>>;

export async function canModerateCommunity(actor: CommunityActor, row: DbRow) {
  if (!actor.canModerate) return false;
  if (row.status === "draft" && row.submitter_user_id !== actor.user.id) return false;
  if (actor.isSuperUser) return true;
  // Member submissions join the shared moderation queue; intern work follows its established manager assignment.
  if (!row.intern_id) return true;
  const { data } = await supabaseAdmin.from("internship_interns").select("manager_user_id").eq("id", String(row.intern_id)).maybeSingle();
  return String(data?.manager_user_id || "") === actor.user.id;
}

export function communityItem(row: DbRow, options?: { owner?: boolean; reviewer?: boolean; public?: boolean }): CommunityItem {
  const visible = communityVisible({ status: String(row.status), consent: row.consent === true, approvedAt: String(row.approved_at || ""), publishAt: String(row.publish_at || "") });
  return {
    id: String(row.id), kind: row.kind as CommunityItem["kind"], title: String(row.title),
    petName: String(row.pet_name || ""), story: String(row.story || ""), location: String(row.location || ""),
    status: visible ? "published" : row.status as CommunityItem["status"],
    feedback: options?.public ? "" : String(row.feedback || ""),
    imageUrl: row.image_path ? `/api/community-studio/media/${row.id}` : "",
    submitterName: options?.public ? "" : String(row.submitter_name || "Member"),
    createdAt: String(row.created_at || ""), updatedAt: String(row.updated_at || ""),
    publishAt: String(row.publish_at || ""), weekOf: String(row.week_of || ""),
    contentId: options?.public ? "" : String(row.content_id || ""), taskId: options?.public ? "" : String(row.task_id || ""),
    canEdit: Boolean(options?.owner && communityEditable(String(row.status))), canReview: Boolean(options?.reviewer),
    mediaUrl: row.image_path ? `/api/community-studio/media/${row.id}` : '', mediaMime: String(row.image_mime || ''),
    publicConsent: row.public_consent === true, socialConsent: socialReuseAllowed(row),
    featuresClientPet: row.features_client_pet === true, bookingId: options?.public ? '' : String(row.booking_id || ''),
    parentPermissionStatus: String(row.parent_permission_status || 'not_required'),
  };
}

export async function communityImageUpload(userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" } as Record<string, string>)[extension];
  if (!mime || file.size <= 0 || file.size > 4 * 1024 * 1024) return { error: "Upload a PNG, JPG, or WEBP image up to 4 MB.", path: "", mime: "" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!creativeBytesMatch(mime, bytes)) return { error: "The image contents do not match its file type.", path: "", mime: "" };
  const path = `${userId}/${randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from(COMMUNITY_BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
  return { error: error ? "The image could not be saved. Check the isolated storage migration and try again." : "", path: error ? "" : path, mime };
}

export async function communitySignals(actor: CommunityActor, row: DbRow, action: string) {
  const recipients = new Set([actor.user.id, String(row.submitter_user_id || "")]);
  if (row.parent_user_id) recipients.add(String(row.parent_user_id));
  if (row.intern_id) {
    const { data } = await supabaseAdmin.from("internship_interns").select("manager_user_id,supervisor_user_id,user_id").eq("id", String(row.intern_id)).maybeSingle();
    if (data?.manager_user_id) recipients.add(String(data.manager_user_id));
    if (data?.user_id) recipients.add(String(data.user_id));
    if (data?.supervisor_user_id) recipients.add(String(data.supervisor_user_id));
  } else if (action === "submit") {
    // Reuse the existing recipient resolver, including active Growth Portal staff.
    const { recipientsForGrowthWorkspace } = await import("@/lib/realtime/recipients");
    for (const id of await recipientsForGrowthWorkspace()) recipients.add(id);
  }
  const paths = ["/manager/community-studio", "/intern/community-studio", "/pack/permissions", "/pack/submit", "/pack", "/manager", "/intern"];
  try {
    if (action === 'submit' && row.parent_user_id) {
      await publishLiveSignals({eventType:'community.parent.permission.requested',eventId:`${row.id}:parent:${row.updated_at}`,
        recipientUserIds:[String(row.parent_user_id)],actorUserId:actor.user.id,resourceType:'community_studio_submissions',resourceId:String(row.id),
        paths:['/pack/permissions'],revalidatePaths:['/pack/permissions'],notify:true,notifyTitle:'Your pet’s story needs your permission',
        notifyBody:'Review the exact story and media in your own account. Website display and social reuse are separate choices.',notifyHref:'/pack/permissions'});
      recipients.delete(String(row.parent_user_id));
    }
    await publishLiveSignals({
      eventType: `community.studio.${action}`, eventId: `${row.id}:${action}:${row.updated_at}`,
      recipientUserIds: [...recipients].filter(Boolean), actorUserId: actor.user.id,
      resourceType: "community_studio_submissions", resourceId: String(row.id), scope: "workspace", paths,
      revalidatePaths: paths, notify: ["submit", "approve", "request_changes", "reject"].includes(action),
      notifyTitle: action === "submit" ? "Community submission ready for review" : "Community submission updated",
      notifyBody: action === "request_changes" ? "Your manager left feedback. Open Community Studio to revise your submission." : String(row.title || "Community activity"),
      notifyHref: action === "submit" ? "/manager/community-studio" : row.intern_id ? "/intern/community-studio" : "/pack/submit",
    });
  } catch {
    // Authoritative content remains saved if realtime infrastructure is temporarily unavailable.
    console.warn("[community-studio] Live update unavailable");
  }
}

export async function communityMediaUrl(id: string, actor: CommunityActor | null) {
  if (!/^[\da-f-]{36}$/i.test(id) || !communityConfigured()) return "";
  const { data: row } = await supabaseAdmin.from("community_studio_submissions").select("*").eq("id", id).maybeSingle();
  if (!row?.image_path) return "";
  const publicVisible = publicationRightsValid(row) && communityVisible({ status: String(row.status), consent: row.consent === true, approvedAt: row.approved_at, publishAt: row.publish_at });
  if (!row.media_safe) return '';
  if (!publicVisible && (!actor || (row.submitter_user_id !== actor.user.id && row.parent_user_id !== actor.user.id && !(await canModerateCommunity(actor, row))))) return "";
  const { data } = await supabaseAdmin.storage.from(COMMUNITY_BUCKET).createSignedUrl(String(row.image_path), 60);
  return data?.signedUrl || "";
}
