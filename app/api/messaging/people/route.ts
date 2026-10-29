import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { findInternByAccount, listInterns } from "@/lib/internship/queries";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstName(value: string) {
  return value.split(/\s+/).filter(Boolean)[0] || "SitGuru";
}

export async function GET(request: Request) {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !admin) return NextResponse.json({ people: [] }, { status: 401 });
  const userId = admin?.id || user?.id || "";
  const intern = userId ? await findInternByAccount({ userId, email: user?.email }) : null;
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser, isIntern: Boolean(intern) });
  if (kind !== "manager" && kind !== "supervisor") return NextResponse.json({ people: [] }, { status: 403 });
  const url = new URL(request.url);
  const audience = url.searchParams.get("audience") || "intern";
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (audience === "intern") {
    const interns = (await listInterns()).filter((row) => canReadPrivateInternRecord({
      actor: kind,
      actorUserId: userId,
      targetInternId: row.id,
      managerUserId: row.managerUserId,
    }));
    const people = interns.map((row) => ({
      id: row.userId || "",
      firstName: firstName(row.preferredName || row.fullName),
      avatarUrl: row.avatarUrl || "",
      detail: "Intern",
    })).filter((row) => row.id && (!query || row.firstName.toLowerCase().includes(query))).slice(0, 20);
    return NextResponse.json({ people });
  }

  const table = audience === "guru" ? "gurus" : audience === "ambassador" ? "ambassadors" : "profiles";
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id,user_id,first_name,full_name,display_name,name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type")
    .limit(40);
  if (error) return NextResponse.json({ people: [] });
  const people = ((data || []) as Record<string, unknown>[])
    .filter((row) => {
      if (audience !== "parent") return true;
      const role = `${text(row.role)} ${text(row.account_type)}`.toLowerCase();
      return role.includes("parent") || role.includes("customer") || role.includes("pet");
    })
    .map((row) => ({
      id: text(row.user_id || row.id),
      firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name) || text(row.name)),
      avatarUrl: resolvePetParentAvatarUrl(row),
      detail: audience === "guru" ? "Guru" : audience === "ambassador" ? "Ambassador" : "Pet Parent",
    }))
    .filter((row) => row.id && row.id !== userId && (!query || row.firstName.toLowerCase().includes(query)))
    .slice(0, 20);
  return NextResponse.json({ people });
}
