import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { findInternByAccount } from "@/lib/internship/queries";
import {
  loadChatPeople,
  type ChatAudience,
} from "@/lib/messaging/people-directory";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED: ChatAudience[] = [
  "staff",
  "admin",
  "intern",
  "guru",
  "ambassador",
  "parent",
];

export async function GET(request: Request) {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !admin) return NextResponse.json({ people: [] }, { status: 401 });
  const userId = admin?.id || user?.id || "";
  const intern = userId
    ? await findInternByAccount({ userId, email: user?.email })
    : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  const url = new URL(request.url);
  const audienceRaw = url.searchParams.get("audience") || "intern";
  const audience = (ALLOWED.includes(audienceRaw as ChatAudience)
    ? audienceRaw
    : "staff") as ChatAudience;
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();

  // Managers, supervisors, and interns can browse every desk-chat audience.
  if (kind !== "manager" && kind !== "supervisor" && kind !== "intern") {
    return NextResponse.json({ people: [] }, { status: 403 });
  }

  const people = await loadChatPeople({
    audience,
    actorUserId: userId,
    actorKind: kind,
    query,
  });
  return NextResponse.json({ people });
}
