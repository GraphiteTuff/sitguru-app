import { NextRequest, NextResponse } from "next/server";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { buildLearningDashboard } from "@/lib/internship/learning-dashboard";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { findInternByAccount, getInternOnboarding, getInternWorkspace } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mobileCorsHeaders, optionsWithMobileCors, resolveRequestUser } from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function reply(request: NextRequest, data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { ...mobileCorsHeaders(request), "Cache-Control": "private, no-store" } });
}

export function OPTIONS(request: NextRequest) {
  return optionsWithMobileCors(request);
}

export async function GET(request: NextRequest) {
  const identity = await resolveRequestUser(request);
  if (!identity) return reply(request, { error: "Sign in required." }, 401);
  if (!identity.user.email_confirmed_at) return reply(request, { error: "Verify your account email." }, 403);

  if (request.nextUrl.searchParams.get("mode") === "instructor") {
    const admin = await resolveAdminIdentityForUser(identity.user);
    const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser });
    if (!admin || !canUseGrowthPortal(admin) || (kind !== "manager" && kind !== "supervisor")) {
      return reply(request, { error: "Instructor access required." }, 403);
    }
    const desk = await loadManagerDashboard({ actorUserId: admin.id, actorKind: kind });
    return reply(request, {
      mode: "instructor",
      reviews: desk.reviews.filter((item) => item.targetType === "task").map(({ id, title, internName, statusLabel, submittedAt }) =>
        ({ id, title, internName, statusLabel, submittedAt })),
    });
  }

  const intern = await findInternByAccount({ userId: identity.user.id, email: identity.user.email });
  if (!intern || intern.userId !== identity.user.id || !internOnboardingComplete(await getInternOnboarding(intern.id))) {
    return reply(request, { error: "A linked intern account with completed onboarding is required." }, 403);
  }
  const workspace = await getInternWorkspace(intern.id);
  if (!workspace) return reply(request, { error: "Intern workspace unavailable." }, 503);

  const summary = buildLearningDashboard(workspace, new Date().toISOString().slice(0, 10));
  const assignments = summary.assignments;
  const titles = new Map(assignments.map((task) => [task.id, task.title]));
  const [evaluations, announcements, partners] = await Promise.all([
    supabaseAdmin.from("internship_assignment_evaluations")
      .select("task_id,total,total_possible,feedback,released_at").eq("intern_id", intern.id)
      .not("released_at", "is", null).order("released_at", { ascending: false }).limit(250),
    supabaseAdmin.from("internship_announcements").select("id,title,body,created_at")
      .eq("intern_id", intern.id).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("growth_partner_proposals").select("id,name,category,status")
      .eq("intern_id", intern.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const grades = new Map<string, { id: string; title: string; total: number; possible: number; feedback: string }>();
  for (const row of evaluations.data || []) {
    const title = titles.get(row.task_id);
    if (title && !grades.has(row.task_id)) grades.set(row.task_id, {
      id: row.task_id, title, total: row.total, possible: row.total_possible, feedback: row.feedback,
    });
  }
  return reply(request, {
    mode: "intern",
    firstName: intern.preferredName || intern.fullName.split(/\s+/)[0],
    pillars: summary.pillars,
    upcoming: summary.upcoming.map(({ id, title, date, type }) => ({ id, title, date, type })),
    grades: evaluations.error ? null : [...grades.values()],
    announcements: announcements.error ? null : announcements.data,
    partners: partners.error ? null : partners.data,
  });
}
