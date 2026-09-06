import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin/access";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";
import { internOnboardingComplete, internOnboardingPublicState } from "@/lib/internship/onboarding";
import {
  findInternByAccount,
  getInternOnboarding,
  getInternWorkspace,
  listInterns,
  linkInternUserId,
} from "@/lib/internship/queries";
import { workspaceKpiStanding } from "@/lib/internship/grading";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function json(req: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: mobileCorsHeaders(req) });
}

async function isSupervisor(userId: string, email: string | null) {
  if (isHardcodedSuperUserEmail(email)) return true;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data || []).some((row) => isAdminRole(String(row.role || "")));
}

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) return json(req, { error: "Sign in required." }, 401);

  const internId = req.nextUrl.searchParams.get("internId") || "";
  const supervisor = await isSupervisor(resolved.user.id, resolved.user.email || null);
  const intern = await findInternByAccount({
    userId: resolved.user.id,
    email: resolved.user.email,
  });

  if (intern && !intern.userId) {
    await linkInternUserId(intern.id, resolved.user.id);
  }

  if (internId) {
    if (!supervisor && intern?.id !== internId) {
      return json(req, { error: "Not assigned to this internship workspace." }, 403);
    }
    if (!supervisor && intern) {
      const ack = await getInternOnboarding(intern.id);
      if (!internOnboardingComplete(ack)) {
        return json(req, {
          ...internOnboardingPublicState(ack),
          mode: "intern",
          onboardingRequired: true,
          intern: { id: intern.id, fullName: intern.fullName },
          workspace: null,
        });
      }
    }
    const workspace = await getInternWorkspace(internId);
    if (!workspace) return json(req, { error: "Intern workspace not found." }, 404);
    return json(req, {
      mode: supervisor && intern?.id !== internId ? "supervisor" : intern?.id === internId ? "intern" : "supervisor",
      workspace,
      standing: workspaceKpiStanding(workspace),
    });
  }

  if (intern) {
    const ack = await getInternOnboarding(intern.id);
    if (!internOnboardingComplete(ack)) {
      return json(req, {
        ...internOnboardingPublicState(ack),
        mode: "intern",
        onboardingRequired: true,
        intern: { id: intern.id, fullName: intern.fullName },
        workspace: null,
      });
    }
    const workspace = await getInternWorkspace(intern.id);
    if (!workspace) return json(req, { error: "Intern workspace not found." }, 404);
    return json(req, {
      mode: "intern",
      onboarded: true,
      onboardingRequired: false,
      workspace,
      standing: workspaceKpiStanding(workspace),
    });
  }

  if (supervisor) {
    const interns = await listInterns();
    return json(req, { mode: "supervisor", interns, workspace: null });
  }

  return json(req, { error: "This account is not assigned to the SitGuru Internship Program." }, 403);
}
