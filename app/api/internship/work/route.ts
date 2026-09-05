import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin/access";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";
import { findInternByAccount } from "@/lib/internship/queries";
import {
  addInternWorkComment,
  reviewInternWorkRecord,
  submitInternWorkRecord,
} from "@/lib/internship/work";
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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function POST(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) return json(req, { error: "Sign in required." }, 401);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const internId = text(body.internId);
  const action = text(body.action);
  const intern = await findInternByAccount({
    userId: resolved.user.id,
    email: resolved.user.email,
  });
  const supervisor = await isSupervisor(resolved.user.id, resolved.user.email || null);

  if (!internId) return json(req, { error: "internId is required." }, 400);
  if (!supervisor && intern?.id !== internId) {
    return json(req, { error: "Not assigned to this internship workspace." }, 403);
  }

  if (action === "submit") {
    const result = await submitInternWorkRecord({
      internId,
      itemType: text(body.itemType) === "content" ? "content" : "task",
      itemId: text(body.id),
      workUrl: text(body.workUrl),
      draftUrl: text(body.draftUrl),
      publishedUrl: text(body.publishedUrl),
      studentNotes: text(body.studentNotes),
      internComment: text(body.internComment),
    });
    if (result.error) return json(req, { error: result.error }, 400);
    return json(req, { ok: true, message: "Work submitted for review." });
  }

  if (action === "comment") {
    const result = await addInternWorkComment({
      internId,
      itemType: text(body.itemType) === "content" ? "content" : "task",
      itemId: text(body.id),
      authorRole: supervisor ? "supervisor" : "intern",
      body: text(body.body),
    });
    if (result.error) return json(req, { error: result.error }, 400);
    return json(req, { ok: true, message: "Comment posted." });
  }

  if (action === "review") {
    if (!supervisor) return json(req, { error: "Only Employer HQ can grade work." }, 403);
    const result = await reviewInternWorkRecord({
      internId,
      itemType: text(body.itemType) === "content" ? "content" : "task",
      itemId: text(body.id),
      decision: text(body.decision),
      letter: text(body.letter),
      kpiTier: text(body.kpiTier) || "none",
      comments: text(body.comments),
      outputVsTarget: Number.isFinite(Number(body.outputVsTarget))
        ? Number(body.outputVsTarget)
        : null,
      reviewerId: resolved.user.id,
    });
    if (result.error) return json(req, { error: result.error }, 400);
    return json(req, { ok: true, message: "Grade saved." });
  }

  return json(req, { error: "Unknown action." }, 400);
}
