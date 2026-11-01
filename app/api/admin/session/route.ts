import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthWorkspace } from "@/lib/admin/portal-areas";

export async function GET() {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json({
    role: identity.role,
    workspace: isGrowthWorkspace(identity.modules, identity.isSuperUser)
      ? "growth"
      : "full",
    isSuperUser: identity.isSuperUser,
    canManageUsers: identity.canManageUsers,
    canUseGrowthPortal: identity.isSuperUser || identity.modules.social_media,
    modules: identity.modules,
  });
}
