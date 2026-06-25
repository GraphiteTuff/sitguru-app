import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ProgramKey =
  | "veterans-hire"
  | "student-hire"
  | "ambassador-program"
  | "skillbridge-interest";

type UploadedApplicationDocument = {
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  file_path: string;
  file_url: string;
  document_type: "additional";
};

type ProgramApplicationPayload = {
  program: ProgramKey;
  full_name: string;
  email: string;
  phone: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  availability: string;
  services_interested: string;
  experience: string;
  military_connected_background: string | null;
  referral_source: string | null;
  resume_link: string | null;
  resume_file_url: string | null;
  resume_file_name: string | null;
  resume_file_type: string | null;
  resume_file_size_bytes: number | null;
  additional_documents: UploadedApplicationDocument[];
  background_check_consent: boolean;
  notes: string | null;
  status: string;
  source: string;
};

type SavedApplication = {
  id: string;
  program: ProgramKey;
  status: string;
  created_at: string;
};

type SafeFormData = {
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
};

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ADDITIONAL_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ADDITIONAL_DOCUMENTS = 6;

const allowedResumeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedAdditionalDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const allowedPrograms: ProgramKey[] = [
  "student-hire",
  "veterans-hire",
  "ambassador-program",
  "skillbridge-interest",
];

const programLabels: Record<ProgramKey, string> = {
  "student-hire": "Student Hire Program",
  "veterans-hire": "Veterans Hire Program",
  "ambassador-program": "Ambassador Program",
  "skillbridge-interest": "SkillBridge Interest / Veterans Pathway",
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeProgram(value: FormDataEntryValue | null): ProgramKey {
  const normalized = normalizeString(value);

  if (allowedPrograms.includes(normalized as ProgramKey)) {
    return normalized as ProgramKey;
  }

  throw new Error("Please choose a valid SitGuru program before submitting.");
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();

  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function normalizeZipCode(value: FormDataEntryValue | null) {
  const normalized = normalizeString(value).replace(/\D/g, "").slice(0, 5);
  return normalized.length > 0 ? normalized : null;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeString(value).toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();

  return cleaned || "document";
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop() : "";

  return extension ? `.${extension.toLowerCase()}` : "";
}

function validateRequiredField(value: string, fieldLabel: string) {
  if (!value.trim()) {
    throw new Error(`${fieldLabel} is required.`);
  }
}

function validateEmail(email: string) {
  if (!email || !email.includes("@") || email.length < 5) {
    throw new Error("A valid email address is required.");
  }
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http")) {
    return siteUrl.replace(/\/$/, "");
  }

  return `https://${siteUrl}`.replace(/\/$/, "");
}

function getLogoUrl() {
  const siteUrl = getSiteUrl();

  return (
    process.env.SITGURU_EMAIL_LOGO_URL ||
    `${siteUrl}/images/sitguru-message-avatar.jpg`
  );
}

function formatProgramLabel(program: ProgramKey) {
  return programLabels[program] || "SitGuru Program";
}

function buildApplicantConfirmationEmail({
  fullName,
  program,
  application,
}: {
  fullName: string;
  program: ProgramKey;
  application: SavedApplication;
}) {
  const siteUrl = getSiteUrl();
  const logoUrl = getLogoUrl();
  const programLabel = formatProgramLabel(program);
  const applicantFirstName = fullName.split(" ")[0] || "there";
  const applicationDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(application.created_at));

  const subject = `${applicantFirstName}, we received your SitGuru application — ${application.id}`;

  const text = `
Hi ${applicantFirstName},

Thank you for applying to SitGuru. We received your SitGuru program application and our team is processing your request.

Application ID: ${application.id}
Program: ${programLabel}
Status: ${application.status}
Submitted: ${applicationDate}

If you are a fit for the next step, we will share onboarding instructions and information about SitGuru trust and safety review steps.

Approved Gurus provide services as independent contractors. Gurus are responsible for reporting and paying their own federal, state, local, and self-employment taxes. SitGuru or its payment processor may request tax information and may issue applicable tax forms when required by law.

Applying does not guarantee approval, bookings, earnings, commissions, benefits, referral rewards, SkillBridge participation, or full Guru status. Program participation and future opportunities may depend on eligibility, onboarding, SitGuru trust and safety review steps, availability, performance, trust, customer demand, and SitGuru program needs.

Thank you,
The SitGuru Team
`.trim();

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${applicantFirstName}, thank you for applying to SitGuru</title>
  </head>
  <body style="margin:0; padding:0; background:#f4faf5; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4faf5; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border-radius:28px; overflow:hidden; border:1px solid #dbeee2; box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#064e3b,#047857); padding:28px 28px 36px 28px; text-align:center;">
                <div style="width:92px; height:92px; margin:0 auto 20px auto; border-radius:28px; background:#ffffff; border:1px solid rgba(255,255,255,0.35); box-shadow:0 16px 34px rgba(0,0,0,0.18); overflow:hidden;">
                  <img src="${logoUrl}" alt="SitGuru" width="92" height="92" style="display:block; width:92px; height:92px; object-fit:cover;" />
                </div>

                <div style="display:inline-block; background:rgba(255,255,255,0.14); color:#ffffff; border:1px solid rgba(255,255,255,0.22); border-radius:999px; padding:8px 14px; font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;">
                  Application received
                </div>

                <h1 style="margin:18px 0 0 0; color:#ffffff; font-size:32px; line-height:1.12; font-weight:900;">
                  ${applicantFirstName}, thank you for applying.
                </h1>

                <p style="margin:14px auto 0 auto; color:#dcfce7; font-size:16px; line-height:1.65; max-width:520px; font-weight:700;">
                  We received your SitGuru program application and our team is processing your request.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ecfdf5; border:1px solid #bbf7d0; border-radius:22px;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 8px 0; color:#047857; font-size:12px; font-weight:900; letter-spacing:1.6px; text-transform:uppercase;">
                        Your application details
                      </p>

                      <h2 style="margin:0; color:#064e3b; font-size:22px; line-height:1.25; font-weight:900;">
                        Application ID: ${application.id}
                      </h2>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
                        <tr>
                          <td style="padding:12px; background:#ffffff; border:1px solid #d1fae5; border-radius:16px;">
                            <p style="margin:0; color:#64748b; font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Program</p>
                            <p style="margin:5px 0 0 0; color:#0f172a; font-size:15px; font-weight:800;">${programLabel}</p>
                          </td>
                        </tr>

                        <tr>
                          <td style="height:10px;"></td>
                        </tr>

                        <tr>
                          <td style="padding:12px; background:#ffffff; border:1px solid #d1fae5; border-radius:16px;">
                            <p style="margin:0; color:#64748b; font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Status</p>
                            <p style="margin:5px 0 0 0; color:#0f172a; font-size:15px; font-weight:800; text-transform:capitalize;">${application.status}</p>
                          </td>
                        </tr>

                        <tr>
                          <td style="height:10px;"></td>
                        </tr>

                        <tr>
                          <td style="padding:12px; background:#ffffff; border:1px solid #d1fae5; border-radius:16px;">
                            <p style="margin:0; color:#64748b; font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Submitted</p>
                            <p style="margin:5px 0 0 0; color:#0f172a; font-size:15px; font-weight:800;">${applicationDate}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div style="padding:28px 4px 8px 4px;">
                  <h3 style="margin:0; color:#0f172a; font-size:20px; line-height:1.3; font-weight:900;">
                    What happens next?
                  </h3>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
                    <tr>
                      <td style="width:38px; vertical-align:top;">
                        <div style="width:30px; height:30px; border-radius:999px; background:#047857; color:#ffffff; text-align:center; line-height:30px; font-size:13px; font-weight:900;">1</div>
                      </td>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0; color:#0f172a; font-size:15px; line-height:1.55; font-weight:800;">Application review</p>
                        <p style="margin:4px 0 0 0; color:#475569; font-size:14px; line-height:1.65; font-weight:600;">SitGuru reviews your application details, program fit, location, availability, services, resume, and any optional supporting documents.</p>
                      </td>
                    </tr>

                    <tr>
                      <td style="width:38px; vertical-align:top;">
                        <div style="width:30px; height:30px; border-radius:999px; background:#047857; color:#ffffff; text-align:center; line-height:30px; font-size:13px; font-weight:900;">2</div>
                      </td>
                      <td style="padding-bottom:16px;">
                        <p style="margin:0; color:#0f172a; font-size:15px; line-height:1.55; font-weight:800;">Onboarding next steps</p>
                        <p style="margin:4px 0 0 0; color:#475569; font-size:14px; line-height:1.65; font-weight:600;">Qualified applicants may receive onboarding instructions, profile guidance, training expectations, and service-readiness steps.</p>
                      </td>
                    </tr>

                    <tr>
                      <td style="width:38px; vertical-align:top;">
                        <div style="width:30px; height:30px; border-radius:999px; background:#047857; color:#ffffff; text-align:center; line-height:30px; font-size:13px; font-weight:900;">3</div>
                      </td>
                      <td>
                        <p style="margin:0; color:#0f172a; font-size:15px; line-height:1.55; font-weight:800;">Trust and safety review</p>
                        <p style="margin:4px 0 0 0; color:#475569; font-size:14px; line-height:1.65; font-weight:600;">Before eligible opportunities, approved applicants may need to complete SitGuru trust and safety review steps.</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="margin-top:18px; background:#fffbeb; border:1px solid #fde68a; border-radius:18px; padding:16px;">
                  <p style="margin:0; color:#92400e; font-size:12px; line-height:1.7; font-weight:700;">
                    Approved Gurus provide services as independent contractors. Gurus are responsible for reporting and paying their own federal, state, local, and self-employment taxes. SitGuru or its payment processor may request tax information and may issue applicable tax forms when required by law.
                  </p>
                </div>

                <div style="margin-top:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px; padding:16px;">
                  <p style="margin:0; color:#475569; font-size:12px; line-height:1.7; font-weight:700;">
                    Applying does not guarantee approval, bookings, earnings, commissions, benefits, referral rewards, SkillBridge participation, or full Guru status. Program participation and future opportunities may depend on eligibility, onboarding, SitGuru trust and safety review steps, availability, performance, trust, customer demand, and SitGuru program needs.
                  </p>
                </div>

                <div style="text-align:center; padding:28px 0 4px 0;">
                  <a href="${siteUrl}/programs" style="display:inline-block; background:#047857; color:#ffffff; text-decoration:none; border-radius:999px; padding:14px 22px; font-size:14px; font-weight:900;">
                    ${applicantFirstName}, view SitGuru programs
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:22px 28px; text-align:center;">
                <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6; font-weight:600;">
                  Thank you for your interest in SitGuru.<br />
                  Trusted Pet Care, Simplified.
                </p>
                <p style="margin:12px 0 0 0; color:#94a3b8; font-size:11px; line-height:1.6;">
                  © ${new Date().getFullYear()} SitGuru. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  return {
    subject,
    html,
    text,
  };
}

async function sendApplicantConfirmationEmail({
  to,
  fullName,
  program,
  application,
}: {
  to: string;
  fullName: string;
  program: ProgramKey;
  application: SavedApplication;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "SitGuru <applications@sitguru.com>";

  if (!resendApiKey) {
    console.warn(
      "RESEND_API_KEY is missing. Program application confirmation email was not sent.",
    );

    return {
      sent: false,
      skipped: true,
      error: "RESEND_API_KEY is missing.",
    };
  }

  const email = buildApplicantConfirmationEmail({
    fullName,
    program,
    application,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Program application confirmation email failed:", payload);

    return {
      sent: false,
      skipped: false,
      error:
        payload?.message ||
        payload?.error ||
        "Confirmation email could not be sent.",
    };
  }

  return {
    sent: true,
    skipped: false,
    id: payload?.id || null,
    error: null,
  };
}

async function uploadSingleFile({
  file,
  program,
  email,
  bucketName,
  folderName,
  allowedTypes,
  maxSizeBytes,
}: {
  file: File;
  program: ProgramKey;
  email: string;
  bucketName: string;
  folderName: string;
  allowedTypes: string[];
  maxSizeBytes: number;
}) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("One or more uploaded files has an unsupported file type.");
  }

  if (file.size > maxSizeBytes) {
    throw new Error("One or more uploaded files is larger than 10MB.");
  }

  const supabase = getSupabaseAdminClient();

  const originalFileName = sanitizeFileName(file.name);
  const extension = getFileExtension(originalFileName);
  const emailPrefix = email.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filePath = `${program}/${folderName}/${Date.now()}-${emailPrefix}-${crypto.randomUUID()}${extension}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `File upload failed. Please confirm the "${bucketName}" storage bucket exists and try again.`,
    );
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signedUrlError) {
    throw new Error(
      "File uploaded, but a secure review link could not be created.",
    );
  }

  return {
    filePath,
    fileUrl: signedUrlData.signedUrl,
  };
}

async function uploadResumeFile({
  file,
  program,
  email,
}: {
  file: File | null;
  program: ProgramKey;
  email: string;
}) {
  if (!file || file.size === 0) {
    return {
      resumeFileUrl: null,
      resumeFileName: null,
      resumeFileType: null,
      resumeFileSizeBytes: null,
    };
  }

  const bucketName =
    process.env.SUPABASE_PROGRAM_RESUMES_BUCKET || "program-resumes";

  const uploadedFile = await uploadSingleFile({
    file,
    program,
    email,
    bucketName,
    folderName: "resumes",
    allowedTypes: allowedResumeTypes,
    maxSizeBytes: MAX_RESUME_SIZE_BYTES,
  });

  return {
    resumeFileUrl: uploadedFile.fileUrl,
    resumeFileName: file.name,
    resumeFileType: file.type,
    resumeFileSizeBytes: file.size,
  };
}

async function uploadAdditionalDocuments({
  files,
  program,
  email,
}: {
  files: File[];
  program: ProgramKey;
  email: string;
}) {
  if (files.length === 0) {
    return [];
  }

  if (files.length > MAX_ADDITIONAL_DOCUMENTS) {
    throw new Error(
      `You can upload up to ${MAX_ADDITIONAL_DOCUMENTS} additional documents.`,
    );
  }

  const bucketName =
    process.env.SUPABASE_PROGRAM_DOCUMENTS_BUCKET || "program-documents";

  const uploadedDocuments: UploadedApplicationDocument[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;

    const uploadedFile = await uploadSingleFile({
      file,
      program,
      email,
      bucketName,
      folderName: "additional-documents",
      allowedTypes: allowedAdditionalDocumentTypes,
      maxSizeBytes: MAX_ADDITIONAL_DOCUMENT_SIZE_BYTES,
    });

    uploadedDocuments.push({
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
      file_path: uploadedFile.filePath,
      file_url: uploadedFile.fileUrl,
      document_type: "additional",
    });
  }

  return uploadedDocuments;
}

function getApplicationSource(program: ProgramKey) {
  if (program === "skillbridge-interest") {
    return "skillbridge_interest_page";
  }

  if (program === "ambassador-program") {
    return "ambassador_program_application_page";
  }

  if (program === "veterans-hire") {
    return "veterans_hire_application_page";
  }

  if (program === "student-hire") {
    return "student_hire_application_page";
  }

  return "program_application_page";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error:
            "Invalid submission format. Program applications must be submitted as multipart/form-data.",
        },
        { status: 400 },
      );
    }

    const formData = (await request.formData()) as unknown as SafeFormData;

    const program = normalizeProgram(formData.get("program"));
    const fullName = normalizeString(formData.get("fullName"));
    const email = normalizeEmail(formData.get("email"));
    const phone = normalizeOptionalString(formData.get("phone"));
    const zipCode = normalizeZipCode(formData.get("zipCode"));
    const city = normalizeOptionalString(formData.get("city"));
    const state = normalizeOptionalString(formData.get("state"));
    const availability = normalizeString(formData.get("availability"));
    const servicesInterested = normalizeString(
      formData.get("servicesInterested"),
    );
    const experience = normalizeString(formData.get("experience"));
    const militaryConnectedBackground = normalizeOptionalString(
      formData.get("militaryConnectedBackground"),
    );
    const referralSource = normalizeOptionalString(
      formData.get("referralSource"),
    );
    const resumeLink = normalizeOptionalString(formData.get("resumeLink"));
    const trustAndSafetyAcknowledged = normalizeBoolean(
      formData.get("backgroundCheckConsent"),
    );
    const notes = normalizeOptionalString(formData.get("notes"));

    validateRequiredField(fullName, "Full name");
    validateEmail(email);
    validateRequiredField(availability, "Availability");
    validateRequiredField(servicesInterested, "Services interested");
    validateRequiredField(experience, "Experience");

    if (!trustAndSafetyAcknowledged) {
      throw new Error(
        program === "ambassador-program"
          ? "Please confirm that you understand SitGuru may review Ambassador applicants before approval and referral reward eligibility."
          : program === "skillbridge-interest"
            ? "Please confirm that you understand future onboarding or approved opportunities may require SitGuru trust and safety review steps."
            : "Please confirm that you understand SitGuru trust and safety review steps are part of the approval process.",
      );
    }

    const resumeEntry = formData.get("resume");
    const resumeFile = resumeEntry instanceof File ? resumeEntry : null;

    const additionalDocumentEntries = formData.getAll("additionalDocuments");
    const additionalDocumentFiles = additionalDocumentEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );

    const {
      resumeFileUrl,
      resumeFileName,
      resumeFileType,
      resumeFileSizeBytes,
    } = await uploadResumeFile({
      file: resumeFile,
      program,
      email,
    });

    const additionalDocuments = await uploadAdditionalDocuments({
      files: additionalDocumentFiles,
      program,
      email,
    });

    const supabase = getSupabaseAdminClient();

    const applicationPayload: ProgramApplicationPayload = {
      program,
      full_name: fullName,
      email,
      phone,
      zip_code: zipCode,
      city,
      state,
      availability,
      services_interested: servicesInterested,
      experience,
      military_connected_background: militaryConnectedBackground,
      referral_source: referralSource,
      resume_link: resumeLink,
      resume_file_url: resumeFileUrl,
      resume_file_name: resumeFileName,
      resume_file_type: resumeFileType,
      resume_file_size_bytes: resumeFileSizeBytes,
      additional_documents: additionalDocuments,
      background_check_consent: trustAndSafetyAcknowledged,
      notes,
      status: "new",
      source: getApplicationSource(program),
    };

    const { data, error } = await supabase
      .from("program_applications")
      .insert(applicationPayload)
      .select("id, program, status, created_at")
      .single();

    if (error) {
      throw new Error(
        `Application could not be saved. Please confirm the program_applications table accepts the current program values: student-hire, veterans-hire, ambassador-program, and skillbridge-interest. ${error.message}`,
      );
    }

    const savedApplication = data as SavedApplication;

    const emailResult = await sendApplicantConfirmationEmail({
      to: email,
      fullName,
      program,
      application: savedApplication,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Program application submitted successfully.",
        application: savedApplication,
        confirmation_email: emailResult,
        uploaded_documents: {
          resume_uploaded: Boolean(resumeFileUrl),
          additional_document_count: additionalDocuments.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while submitting the program application.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    );
  }
}