import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { buildInternKpiBoard } from "@/lib/internship/intern-kpis";
import {
  documentationInternWorkspace,
  documentationKpiSnapshot,
} from "@/lib/internship/documentation-fixture";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { loadInternSafeKpiSnapshot } from "@/lib/internship/intern-kpi-snapshot";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import {
  findInternByAccount,
  getInternOnboarding,
  getInternWorkspace,
} from "@/lib/internship/queries";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function json(req: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: mobileCorsHeaders(req) });
}

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest) {
  if (internDocumentationModeEnabled()) {
    const workspace = documentationInternWorkspace();
    const snapshot = documentationKpiSnapshot();
    return json(req, {
      internId: workspace.intern.id,
      liveAt: snapshot.capturedAt,
      snapshot,
      board: buildInternKpiBoard({
        metrics: workspace.metrics,
        snapshot,
      }),
    });
  }

  const resolved = await resolveRequestUser(req);
  if (!resolved) return json(req, { error: "Sign in required." }, 401);

  const requestedId = req.nextUrl.searchParams.get("internId") || "";
  const live = req.nextUrl.searchParams.get("live") !== "0";
  const intern = await findInternByAccount({
    userId: resolved.user.id,
    email: resolved.user.email,
  });
  const admin = await getAdminIdentity();
  const internId = requestedId || intern?.id || "";

  if (!internId) {
    return json(req, { error: "This account is not assigned to the Internship Program." }, 403);
  }
  if (requestedId && intern?.id !== requestedId && !admin?.canAccessAdmin) {
    return json(req, { error: "Not assigned to this internship workspace." }, 403);
  }
  if (!admin?.canAccessAdmin && intern) {
    const ack = await getInternOnboarding(intern.id);
    if (!internOnboardingComplete(ack)) {
      return json(req, { error: "Complete intern onboarding first.", onboardingRequired: true }, 403);
    }
  }

  const workspace = await getInternWorkspace(internId);
  if (!workspace) return json(req, { error: "Intern workspace not found." }, 404);

  const snapshot = await loadInternSafeKpiSnapshot({
    region: workspace.university?.region,
    campaigns: workspace.campaigns,
    includeMarket: !live,
  });
  const board = buildInternKpiBoard({
    metrics: workspace.metrics,
    snapshot,
  });

  return json(req, {
    internId,
    liveAt: snapshot.capturedAt,
    snapshot,
    board,
  });
}
