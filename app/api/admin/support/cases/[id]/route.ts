import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { canAccessSupportDashboard } from "@/lib/admin/support/access";
import { sendSupportNotification } from "@/lib/admin/support/email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  SupportCasePatch,
  SupportThreadMessage,
} from "@/lib/admin/support/types";
import {
  asTrimmedString,
  getStatusLabel,
  normalizeSupportCase,
  parseReplyThread,
} from "@/lib/admin/support/utils";

export const dynamic = "force-dynamic";

function isMissingColumnError(error: unknown) {
  const message = String(
    (error as { message?: string })?.message || error || ""
  ).toLowerCase();

  return (
    message.includes("assigned_to") ||
    message.includes("user_type") ||
    message.includes("reply_thread") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

async function updateCaseRow(caseId: string, payload: Record<string, unknown>) {
  const first = await supabaseAdmin
    .from("support_intake_cases")
    .update(payload)
    .eq("id", caseId)
    .select("*")
    .maybeSingle();

  if (!first.error) return first;

  if (!isMissingColumnError(first.error)) return first;

  const fallback = { ...payload };
  delete fallback.assigned_to;
  delete fallback.user_type;
  delete fallback.reply_thread;

  return supabaseAdmin
    .from("support_intake_cases")
    .update(fallback)
    .eq("id", caseId)
    .select("*")
    .maybeSingle();
}

async function lookupSenderProfile(email: string) {
  if (!email) return null;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,phone,role,status,account_status")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: asTrimmedString(data.id),
    fullName: asTrimmedString(data.full_name) || "Account",
    email: asTrimmedString(data.email),
    phone: asTrimmedString(data.phone),
    role: asTrimmedString(data.role) || "member",
    status:
      asTrimmedString(data.account_status) ||
      asTrimmedString(data.status) ||
      "unknown",
  };
}

async function assertSupportApiAccess() {
  const gate = await requireAdminApi();
  if (gate.response) return { identity: null, response: gate.response };

  if (!canAccessSupportDashboard(gate.identity)) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Super User or Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { identity: gate.identity, response: null };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await assertSupportApiAccess();
  if (gate.response) return gate.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing case id." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("support_intake_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Support case not found." },
      { status: 404 }
    );
  }

  const supportCase = normalizeSupportCase(data, 0);
  const sender = await lookupSenderProfile(supportCase.senderEmail);

  return NextResponse.json({ case: supportCase, sender });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await assertSupportApiAccess();
  if (gate.response) return gate.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing case id." }, { status: 400 });
  }

  let body: SupportCasePatch;
  try {
    body = (await request.json()) as SupportCasePatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data: existing, error: loadError } = await supabaseAdmin
    .from("support_intake_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return NextResponse.json(
      { error: "Support case not found." },
      { status: 404 }
    );
  }

  const current = normalizeSupportCase(existing, 0);
  const nextStatus = asTrimmedString(body.status) || current.status;
  const nextPriority = asTrimmedString(body.priority) || current.priority;
  const nextAssignee =
    body.assignedTo === undefined
      ? current.assignedTo
      : asTrimmedString(body.assignedTo);
  const nextNotes = asTrimmedString(body.notes) || current.notes;
  const replyBody = asTrimmedString(body.replyBody);
  const sendEmail = Boolean(body.sendEmail);

  const thread = [...current.replyThread];
  if (replyBody) {
    const message: SupportThreadMessage = {
      id: `admin-${Date.now()}`,
      author: gate.identity?.email || "Admin",
      authorRole: "admin",
      body: replyBody,
      createdAt: new Date().toISOString(),
      channel: sendEmail ? "email" : "note",
    };
    thread.push(message);
  }

  const payload: Record<string, unknown> = {
    status: nextStatus,
    priority: nextPriority,
    assigned_to: nextAssignee || null,
    notes: nextNotes,
    reply_thread: thread,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await updateCaseRow(id, payload);

  if (updateError || !updated) {
    console.warn("Support case patch failed:", updateError);
    return NextResponse.json(
      {
        error: "Failed to update support case.",
        detail: String((updateError as { message?: string })?.message || ""),
      },
      { status: 500 }
    );
  }

  const supportCase = normalizeSupportCase(updated, 0);
  let emailStatus: "sent" | "failed" | "not_requested" = "not_requested";

  if (sendEmail && replyBody && supportCase.senderEmail) {
    const emailResult = await sendSupportNotification({
      to: supportCase.senderEmail,
      senderName: supportCase.senderName,
      intakeNumber: supportCase.intakeNumber,
      subject: supportCase.subject,
      status: supportCase.status,
      notificationType: supportCase.status === "closed" ? "closed" : "updated",
      message: replyBody,
    });
    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  const sender = await lookupSenderProfile(supportCase.senderEmail);

  return NextResponse.json({
    ok: true,
    case: supportCase,
    sender,
    emailStatus,
    message: `Case ${supportCase.intakeNumber} updated to ${getStatusLabel(
      supportCase.status
    )}.`,
  });
}
