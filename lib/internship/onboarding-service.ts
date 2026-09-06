import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  internAllowedConfidentialUpload,
  internNamesMatch,
  internOnboardingFileHash,
  internOnboardingPublicState,
  INTERN_ONBOARDING_FULLY_EXECUTED,
  INTERN_ONBOARDING_POLICY_VERSION,
} from "@/lib/internship/onboarding";
import {
  internOnboardingAudit,
  internOnboardingIdentitySnapshot,
} from "@/lib/internship/onboarding-audit";
import { internSchoolEmphasis } from "@/lib/internship/intern-tools";
import { sendInternConfidentialityReceipts } from "@/lib/internship/onboarding-mail";
import {
  findInternById,
  getInternOnboarding,
  getInternWorkspace,
} from "@/lib/internship/queries";
import {
  downloadInternshipConfidential,
  uploadInternshipConfidential,
} from "@/lib/internship/storage";

export type InternOnboardingResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function upsertOnboarding(internId: string, patch: Record<string, unknown>) {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("internship_onboarding_acknowledgments")
    .select("id")
    .eq("intern_id", internId)
    .maybeSingle();
  if (data?.id) {
    return supabaseAdmin
      .from("internship_onboarding_acknowledgments")
      .update({ ...patch, updated_at: now })
      .eq("intern_id", internId);
  }
  return supabaseAdmin.from("internship_onboarding_acknowledgments").insert({
    intern_id: internId,
    policy_version: INTERN_ONBOARDING_POLICY_VERSION,
    ...patch,
    updated_at: now,
  });
}

export async function loadInternOnboardingPayload(internId: string) {
  const intern = await findInternById(internId);
  if (!intern) return null;
  const workspace = await getInternWorkspace(internId);
  const ack = await getInternOnboarding(internId);
  const school = internSchoolEmphasis({
    university: workspace?.university,
    campus: workspace?.campus,
    intern,
    cohort: workspace?.cohort,
  });
  return {
    intern: {
      id: intern.id,
      fullName: intern.fullName,
      school: school.school,
      program: school.program || intern.academicProgram,
    },
    printPath: "/intern/onboarding/print",
    ...internOnboardingPublicState(ack),
  };
}

export async function recordInternAccessRules(internId: string): Promise<InternOnboardingResult> {
  const intern = await findInternById(internId);
  if (!intern) return { ok: false, error: "Intern record not found." };
  const workspace = await getInternWorkspace(internId);
  const audit = await internOnboardingAudit();
  const { error } = await upsertOnboarding(internId, {
    policy_version: INTERN_ONBOARDING_POLICY_VERSION,
    onboarding_status: "pending",
    access_rules_accepted_at: new Date().toISOString(),
    access_rules_accepted_ip: audit.ip,
    access_rules_session_id: audit.sessionId,
    typed_legal_name: "",
    electronic_signed_at: null,
    electronic_signed_ip: "",
    electronic_signed_session_id: "",
    wet_ink_file_name: "",
    wet_ink_storage_path: "",
    wet_ink_file_hash: "",
    wet_ink_mime_type: "",
    wet_ink_file_size: 0,
    wet_ink_uploaded_at: null,
    wet_ink_uploaded_ip: "",
    wet_ink_uploaded_session_id: "",
    wet_ink_submitted_at: null,
    wet_ink_submitted_ip: "",
    wet_ink_submitted_session_id: "",
    wet_ink_emailed_at: null,
    ...internOnboardingIdentitySnapshot(intern, workspace),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Access rules accepted. Sign the confidentiality notice next." };
}

export async function recordInternElectronicSignature(input: {
  internId: string;
  userId: string;
  email: string;
  typedLegalName: string;
  agreeConfidential: boolean;
  agreeOwnership: boolean;
  agreeTools: boolean;
}): Promise<InternOnboardingResult> {
  const intern = await findInternById(input.internId);
  if (!intern) return { ok: false, error: "Intern record not found." };
  const ack = await getInternOnboarding(input.internId);
  if (!ack?.accessRulesAcceptedAt || ack.policyVersion !== INTERN_ONBOARDING_POLICY_VERSION) {
    return { ok: false, error: "Accept the intern access rules first." };
  }
  if (!input.agreeConfidential || !input.agreeOwnership || !input.agreeTools) {
    return { ok: false, error: "Check all acknowledgment boxes before signing." };
  }
  if (!internNamesMatch(input.typedLegalName, intern.fullName)) {
    return {
      ok: false,
      error: `Type your legal name as it appears on your intern record (${intern.fullName}).`,
    };
  }
  const workspace = await getInternWorkspace(input.internId);
  const audit = await internOnboardingAudit();
  const { error } = await upsertOnboarding(input.internId, {
    policy_version: INTERN_ONBOARDING_POLICY_VERSION,
    onboarding_status: "pending",
    typed_legal_name: input.typedLegalName,
    electronic_signed_at: new Date().toISOString(),
    electronic_signed_ip: audit.ip,
    electronic_signed_session_id: audit.sessionId,
    signer_user_id: input.userId,
    signer_email: String(input.email || intern.email || "").toLowerCase(),
    ...internOnboardingIdentitySnapshot(intern, workspace),
  });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    message:
      "Electronic signature saved. SitGuru policy also requires a printed wet-ink copy. Print or photo that page, then upload it.",
  };
}

export async function recordInternSignedUpload(
  internId: string,
  file: File,
): Promise<InternOnboardingResult> {
  const ack = await getInternOnboarding(internId);
  if (!ack?.electronicSignedAt || ack.policyVersion !== INTERN_ONBOARDING_POLICY_VERSION) {
    return { ok: false, error: "Sign electronically before uploading the printed page." };
  }
  const blocked = internAllowedConfidentialUpload(file);
  if (blocked) return { ok: false, error: blocked };
  const uploaded = await uploadInternshipConfidential({ file, internId });
  if (uploaded.error) return { ok: false, error: uploaded.error };
  const audit = await internOnboardingAudit();
  const { error } = await upsertOnboarding(internId, {
    policy_version: INTERN_ONBOARDING_POLICY_VERSION,
    onboarding_status: "pending",
    wet_ink_file_name: file.name,
    wet_ink_storage_path: uploaded.path,
    wet_ink_file_hash: uploaded.hash,
    wet_ink_mime_type: file.type || "",
    wet_ink_file_size: file.size,
    wet_ink_uploaded_at: new Date().toISOString(),
    wet_ink_uploaded_ip: audit.ip,
    wet_ink_uploaded_session_id: audit.sessionId,
    wet_ink_submitted_at: null,
    wet_ink_submitted_ip: "",
    wet_ink_submitted_session_id: "",
    wet_ink_emailed_at: null,
  });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    message:
      "Signed page uploaded. Submit next. Email confirmation will be sent to your email on file.",
  };
}

export async function recordInternOnboardingSubmit(
  internId: string,
): Promise<InternOnboardingResult> {
  const intern = await findInternById(internId);
  const ack = await getInternOnboarding(internId);
  if (
    !intern ||
    !ack?.electronicSignedAt ||
    ack.policyVersion !== INTERN_ONBOARDING_POLICY_VERSION
  ) {
    return { ok: false, error: "Sign electronically before submitting." };
  }
  if (!ack.wetInkStoragePath || !ack.wetInkUploadedAt || !ack.wetInkFileHash) {
    return { ok: false, error: "Upload the signed page before submitting." };
  }
  const downloaded = await downloadInternshipConfidential(ack.wetInkStoragePath);
  if (downloaded.error || !downloaded.bytes) {
    return { ok: false, error: downloaded.error || "Could not open the signed page." };
  }
  const fileHash = internOnboardingFileHash(downloaded.bytes);
  if (fileHash !== ack.wetInkFileHash) {
    return {
      ok: false,
      error: "The uploaded signed page could not be verified. Upload it again, then submit.",
    };
  }
  try {
    await sendInternConfidentialityReceipts({
      intern,
      onboarding: ack,
      fileName: ack.wetInkFileName,
      fileBytes: downloaded.bytes,
      contentType: ack.wetInkMimeType || downloaded.contentType,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "The signed page is uploaded, but email could not be sent. Try Submit again.",
    };
  }
  const now = new Date().toISOString();
  const workspace = await getInternWorkspace(internId);
  const audit = await internOnboardingAudit();
  const { error } = await upsertOnboarding(internId, {
    policy_version: INTERN_ONBOARDING_POLICY_VERSION,
    onboarding_status: INTERN_ONBOARDING_FULLY_EXECUTED,
    wet_ink_file_hash: fileHash,
    wet_ink_submitted_at: now,
    wet_ink_submitted_ip: audit.ip,
    wet_ink_submitted_session_id: audit.sessionId,
    wet_ink_emailed_at: now,
    ...internOnboardingIdentitySnapshot(intern, workspace),
  });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    message: "Submitted. Email confirmation will be sent to your email on file.",
  };
}
