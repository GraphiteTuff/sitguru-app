import { NextRequest, NextResponse } from "next/server";
import {
  loadInternOnboardingPayload,
  recordInternAccessRules,
  recordInternElectronicSignature,
  recordInternOnboardingSubmit,
  recordInternSignedUpload,
} from "@/lib/internship/onboarding-service";
import { findInternByAccount } from "@/lib/internship/queries";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function json(req: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: mobileCorsHeaders(req) });
}

function agreed(value: unknown) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "on" || raw === "true" || raw === "1" || raw === "yes";
}

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

async function internForRequest(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) {
    return { error: "Sign in required.", status: 401 as const, intern: null, user: null };
  }
  const intern = await findInternByAccount({
    userId: resolved.user.id,
    email: resolved.user.email,
  });
  if (!intern) {
    return {
      error: "This account is not assigned to the SitGuru Internship Program.",
      status: 403 as const,
      intern: null,
      user: null,
    };
  }
  return { intern, user: resolved.user, error: "", status: 200 as const };
}

export async function GET(req: NextRequest) {
  const resolved = await internForRequest(req);
  if (!resolved.intern) return json(req, { error: resolved.error }, resolved.status);
  const payload = await loadInternOnboardingPayload(resolved.intern.id);
  if (!payload) return json(req, { error: "Intern record not found." }, 404);
  return json(req, payload);
}

export async function POST(req: NextRequest) {
  const resolved = await internForRequest(req);
  if (!resolved.intern || !resolved.user) {
    return json(req, { error: resolved.error }, resolved.status);
  }

  const contentType = req.headers.get("content-type") || "";
  let action = "";
  let typedLegalName = "";
  let agreeAccess = false;
  let agreeConfidential = false;
  let agreeOwnership = false;
  let agreeTools = false;
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    action = String(form.get("action") || "upload").trim();
    typedLegalName = String(form.get("typedLegalName") || "").trim();
    agreeAccess = agreed(form.get("agreeAccess"));
    agreeConfidential = agreed(form.get("agreeConfidential"));
    agreeOwnership = agreed(form.get("agreeOwnership"));
    agreeTools = agreed(form.get("agreeTools"));
    const value = form.get("file");
    if (value && typeof value !== "string") file = value as File;
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    action = String(body.action || "").trim();
    typedLegalName = String(body.typedLegalName || "").trim();
    agreeAccess = agreed(body.agreeAccess);
    agreeConfidential = agreed(body.agreeConfidential);
    agreeOwnership = agreed(body.agreeOwnership);
    agreeTools = agreed(body.agreeTools);
  }

  let result;
  if (action === "accept") {
    if (!agreeAccess) {
      return json(req, { error: "Confirm the intern access rules to continue." }, 400);
    }
    result = await recordInternAccessRules(resolved.intern.id);
  } else if (action === "sign") {
    result = await recordInternElectronicSignature({
      internId: resolved.intern.id,
      userId: resolved.user.id,
      email: String(resolved.user.email || ""),
      typedLegalName,
      agreeConfidential,
      agreeOwnership,
      agreeTools,
    });
  } else if (action === "upload") {
    if (!file) return json(req, { error: "Choose the signed PDF or photo." }, 400);
    result = await recordInternSignedUpload(resolved.intern.id, file);
  } else if (action === "submit") {
    result = await recordInternOnboardingSubmit(resolved.intern.id);
  } else {
    return json(req, { error: "Unknown onboarding action." }, 400);
  }

  if (!result.ok) return json(req, { error: result.error }, 400);
  const payload = await loadInternOnboardingPayload(resolved.intern.id);
  return json(req, { ok: true, message: result.message, ...payload });
}
