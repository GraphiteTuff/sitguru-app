import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { getAdminNavAccess } from "@/lib/admin/nav-access";

export async function GET() {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json({
    role: identity.role,
    workspace: isGrowthOnlyRole(identity.role) ? "growth" : "full",
    isSuperUser: identity.isSuperUser,
    canManageUsers: identity.canManageUsers,
    canUseGrowthPortal:
      identity.isSuperUser ||
      isGrowthOnlyRole(identity.role) ||
      getAdminNavAccess(identity.role, identity.isSuperUser).social_media,
    modules: getAdminNavAccess(identity.role, identity.isSuperUser),
  });
}
