import { notFound } from "next/navigation";
import { GrowthWorkplaceHome } from "@/components/admin/growth/GrowthWorkplaceHome";
import InternGrowthChrome from "@/components/internship/InternGrowthChrome";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import type { GrowthWorkplaceAccess } from "@/lib/admin/growth/workplace";
import { GROWTH_INTERN_BASE } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

/**
 * Local-only responsive preview for Growth Workspace screenshots.
 * Requires INTERN_DOCUMENTATION_MODE=true and NODE_ENV=development.
 * Never available in production/preview.
 */
export default async function GrowthResponsivePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  if (!internDocumentationModeEnabled()) notFound();

  const params = (await searchParams) || {};
  const asAdmin = params.role === "admin";

  const workplace: GrowthWorkplaceAccess = asAdmin
    ? {
        ok: true,
        kind: "admin",
        basePath: "/admin/growth",
        actor: {
          id: "doc-admin",
          email: "ava@sitguru.com",
          isSuperUser: false,
          kind: "admin",
        },
        canApprove: true,
      }
    : {
        ok: true,
        kind: "intern",
        basePath: GROWTH_INTERN_BASE,
        actor: {
          id: "doc-intern",
          email: "taylor.morgan@example.edu",
          isSuperUser: false,
          kind: "intern",
        },
        canApprove: false,
      };

  return (
    <div className="min-h-dvh bg-[#f7fbf8] text-slate-950">
      <InternGrowthChrome>
        <GrowthWorkplaceHome workplace={workplace} />
      </InternGrowthChrome>
    </div>
  );
}
