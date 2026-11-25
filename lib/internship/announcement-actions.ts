"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { internOnThisManagerDesk, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function publishInternAnnouncement(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const adminMode = read("mode") === "admin";
  const path = adminMode ? "/admin/internship/instructor" : "/manager/instructor";
  const fail = (message: string): never => redirect(`${path}?${new URLSearchParams({ error: message })}`);
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || (kind !== "manager" && kind !== "supervisor") ||
      (adminMode && (!actor.canAccessAdmin || kind !== "supervisor"))) {
    return fail("Instructor access required.");
  }

  const id = read("requestId");
  const internId = read("internId");
  const title = read("title");
  const body = read("body");
  if (!isPortalUserId(id) || !isPortalUserId(internId) || !title || title.length > 140 || !body || body.length > 4000) {
    return fail("Choose a recipient and enter a title and announcement.");
  }
  const intern = await findInternById(internId);
  if (!intern || !internOnThisManagerDesk({ actorKind: kind, actorUserId: actor.id, intern })) {
    return fail("Choose an intern assigned to your workspace.");
  }

  const { error } = await supabaseAdmin.from("internship_announcements").upsert({
    id,
    intern_id: intern.id,
    published_by: actor.id,
    publisher_role: kind,
    title,
    body,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("[internship] Announcement publication failed", error.code);
    return fail("The announcement could not be published.");
  }
  revalidatePath("/intern/announcements");
  redirect(`${path}?${new URLSearchParams({ ok: "Announcement published." })}`);
}
