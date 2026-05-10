import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Handshake,
  Mail,
  Medal,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type ProgramKey =
  | "student-hire"
  | "veterans-hire"
  | "ambassador-program"
  | "skillbridge-interest";

type StatusKey =
  | "new"
  | "reviewing"
  | "contacted"
  | "missing_info"
  | "onboarding"
  | "checkr_pending"
  | "approved"
  | "not_approved"
  | "archived";

type CheckrStatusKey =
  | "not_started"
  | "invitation_needed"
  | "invited"
  | "pending"
  | "clear"
  | "review_required"
  | "adverse_action_review"
  | "not_approved";

type AnyRow = Record<string, unknown>;

type ProgramApplication = {
  id: string;
  program: string;
  status: string;
  checkr_status: string;
  full_name: string;
  email: string;
  phone: string;
  zip_code: string;
  city: string;
  state: string;
  availability: string;
  services_interested: string[];
  referral_source: string;
  resume_link: string;
  resume_url: string;
  additional_documents: string[];
  background_check_consent: boolean;
  experience: string;
  military_connected_background: string;
  school_name: string;
  student_status: string;
  graduation_year_or_availability: string;
  student_background: string;
  notes: string;
  admin_notes: string;
  next_step: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string;
  reviewed_by: string;
  contacted_at: string;
  onboarding_started_at: string;
  approved_at: string;
  rejected_at: string;
  raw: AnyRow;
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  programApplications: "/admin/program-applications",
  studentApplications: "/admin/program-applications?program=student-hire",
  veteransApplications: "/admin/program-applications?program=veterans-hire",
  ambassadorApplications:
    "/admin/program-applications?program=ambassador-program",
  skillbridgeApplications:
    "/admin/program-applications?program=skillbridge-interest",
};

const programOptions: {
  key: ProgramKey | "all";
  label: string;
  shortLabel: string;
  icon: ReactNode;
  description: string;
}[] = [
  {
    key: "all",
    label: "All Programs",
    shortLabel: "All",
    icon: <UsersRound size={18} />,
    description: "All SitGuru program submissions.",
  },
  {
    key: "student-hire",
    label: "Student Hire Program",
    shortLabel: "Student",
    icon: <GraduationCap size={18} />,
    description:
      "Students, recent grads, summer workers, and school-break applicants.",
  },
  {
    key: "veterans-hire",
    label: "Veterans Hire Program",
    shortLabel: "Veterans",
    icon: <Medal size={18} />,
    description:
      "Veterans, eligible service members, spouses, dependents, Guard, reserve, and military-connected applicants.",
  },
  {
    key: "ambassador-program",
    label: "Ambassador Program",
    shortLabel: "Ambassador",
    icon: <Handshake size={18} />,
    description:
      "Vet Techs, Veterinarians, Trainers, pet-care professionals, and trusted community supporters.",
  },
  {
    key: "skillbridge-interest",
    label: "SkillBridge Interest / Veterans Pathway",
    shortLabel: "SkillBridge",
    icon: <ShieldCheck size={18} />,
    description: "Future SkillBridge-style transition pathway interest.",
  },
];

const statusOptions: {
  key: StatusKey | "all";
  label: string;
  description: string;
}[] = [
  {
    key: "all",
    label: "All Statuses",
    description: "Show every application status.",
  },
  {
    key: "new",
    label: "New",
    description: "Newly submitted and not yet reviewed.",
  },
  {
    key: "reviewing",
    label: "Reviewing",
    description: "Admin is reviewing the application.",
  },
  {
    key: "contacted",
    label: "Contacted",
    description: "Applicant has been contacted.",
  },
  {
    key: "missing_info",
    label: "Missing Info",
    description: "Applicant needs to provide more information.",
  },
  {
    key: "onboarding",
    label: "Onboarding",
    description: "Applicant is moving through onboarding.",
  },
  {
    key: "checkr_pending",
    label: "Trust & Safety Review",
    description: "Trust and safety review step is in progress or waiting.",
  },
  {
    key: "approved",
    label: "Approved",
    description: "Applicant is approved for next Guru steps.",
  },
  {
    key: "not_approved",
    label: "Not Approved",
    description: "Applicant is not approved at this time.",
  },
  {
    key: "archived",
    label: "Archived",
    description: "Application has been archived.",
  },
];

const checkrStatusOptions: {
  key: CheckrStatusKey;
  label: string;
}[] = [
  { key: "not_started", label: "Not Started" },
  { key: "invitation_needed", label: "Invitation Needed" },
  { key: "invited", label: "Invited" },
  { key: "pending", label: "Pending" },
  { key: "clear", label: "Clear" },
  { key: "review_required", label: "Review Required" },
  { key: "adverse_action_review", label: "Adverse Action Review" },
  { key: "not_approved", label: "Not Approved" },
];

const statusEmailCopy: Record<
  StatusKey,
  {
    subject: string;
    headline: string;
    body: string;
    next: string;
  }
> = {
  new: {
    subject: "Your SitGuru application was received",
    headline: "We received your SitGuru application.",
    body: "Your application is in our system and ready for review.",
    next: "Our team will review your information and contact you if we need anything else.",
  },
  reviewing: {
    subject: "Your SitGuru application is now being reviewed",
    headline: "Your SitGuru application is now being reviewed.",
    body: "A SitGuru admin has moved your application into review.",
    next: "We are reviewing your program fit, availability, services, documents, and next steps.",
  },
  contacted: {
    subject: "SitGuru has reached out about your application",
    headline: "SitGuru has reached out about your application.",
    body: "Your application has moved to the contacted stage.",
    next: "Please watch your email, phone, and messages for any follow-up from SitGuru.",
  },
  missing_info: {
    subject: "SitGuru needs a little more information",
    headline: "We need a little more information.",
    body: "Your application is still active, but we may need additional details before moving forward.",
    next: "Please check for a message from SitGuru requesting the missing information.",
  },
  onboarding: {
    subject: "Your SitGuru application is moving into onboarding",
    headline: "You are moving into onboarding steps.",
    body: "Your application has moved into the onboarding stage.",
    next: "SitGuru may send next steps related to your profile, training, documents, and readiness.",
  },
  checkr_pending: {
    subject: "Your SitGuru trust and safety review step is pending",
    headline: "Your trust and safety review step is pending or being prepared.",
    body: "A SitGuru trust and safety review step may be part of the approval process.",
    next: "Please watch for SitGuru instructions and complete any requested steps promptly.",
  },
  approved: {
    subject: "Your SitGuru application has been approved for next steps",
    headline: "You have been approved for next SitGuru steps.",
    body: "Your application has moved to approved status.",
    next: "SitGuru may follow up with next steps related to onboarding, profile readiness, and eligible Guru opportunities.",
  },
  not_approved: {
    subject: "Update on your SitGuru application",
    headline: "We are not able to move forward at this time.",
    body: "Thank you for applying. After review, SitGuru is not able to move forward with your application at this time.",
    next: "This update does not prevent you from contacting SitGuru with questions or applying again in the future if circumstances change.",
  },
  archived: {
    subject: "Your SitGuru application has been archived",
    headline: "Your application has been archived.",
    body: "Your application is no longer in active review.",
    next: "If you believe this was a mistake or want to update your information, please contact SitGuru.",
  },
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "1", "on"].includes(value.toLowerCase());
  }

  return false;
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return (
            asString(record.file_url) ||
            asString(record.url) ||
            asString(record.signed_url) ||
            asString(record.file_path) ||
            asString(record.file_name)
          );
        }

        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return asArray(parsed);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function normalizeStatus(value: string): StatusKey {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .trim();

  if (
    normalized === "new" ||
    normalized === "reviewing" ||
    normalized === "contacted" ||
    normalized === "missing_info" ||
    normalized === "onboarding" ||
    normalized === "checkr_pending" ||
    normalized === "approved" ||
    normalized === "not_approved" ||
    normalized === "archived"
  ) {
    return normalized;
  }

  if (normalized === "pending") return "new";
  if (normalized === "in_review") return "reviewing";
  if (
    normalized === "checkr" ||
    normalized === "background_check" ||
    normalized === "trust_safety" ||
    normalized === "trust_and_safety"
  ) {
    return "checkr_pending";
  }
  if (normalized === "rejected" || normalized === "declined") {
    return "not_approved";
  }

  return "new";
}

function normalizeCheckrStatus(value: string): CheckrStatusKey {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .trim();

  if (
    normalized === "not_started" ||
    normalized === "invitation_needed" ||
    normalized === "invited" ||
    normalized === "pending" ||
    normalized === "clear" ||
    normalized === "review_required" ||
    normalized === "adverse_action_review" ||
    normalized === "not_approved"
  ) {
    return normalized;
  }

  return "not_started";
}

function normalizeProgram(value: string): ProgramKey | "" {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .trim();

  if (
    normalized === "student-hire" ||
    normalized === "veterans-hire" ||
    normalized === "ambassador-program" ||
    normalized === "skillbridge-interest"
  ) {
    return normalized;
  }

  if (normalized === "military-hire" || normalized.includes("military")) {
    return "veterans-hire";
  }

  if (
    normalized === "community-hire" ||
    normalized.includes("community") ||
    normalized.includes("workforce") ||
    normalized.includes("ambassador")
  ) {
    return "ambassador-program";
  }

  if (normalized.includes("student")) return "student-hire";
  if (normalized.includes("veteran")) return "veterans-hire";
  if (normalized.includes("skillbridge")) return "skillbridge-interest";

  return "";
}

function getProgramLabel(value: string) {
  const normalized = normalizeProgram(value);
  return (
    programOptions.find((program) => program.key === normalized)?.label ||
    value ||
    "SitGuru Program"
  );
}

function getProgramShortLabel(value: string) {
  const normalized = normalizeProgram(value);
  return (
    programOptions.find((program) => program.key === normalized)?.shortLabel ||
    value ||
    "Program"
  );
}

function getFirstName(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName || "there";
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://sitguru.com"
  ).replace(/\/$/, "");
}

function getEmailAvatarUrl() {
  const configuredAvatarUrl =
    process.env.NEXT_PUBLIC_EMAIL_AVATAR_URL ||
    process.env.EMAIL_AVATAR_URL ||
    process.env.SITGURU_EMAIL_AVATAR_URL ||
    "";

  if (configuredAvatarUrl.trim()) {
    return configuredAvatarUrl.trim();
  }

  return `${getSiteUrl()}/images/sitguru-message-avatar.jpg`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusLabel(value: string) {
  const normalized = normalizeStatus(value);
  return (
    statusOptions.find((status) => status.key === normalized)?.label || "New"
  );
}

function getCheckrStatusLabel(value: string) {
  const normalized = normalizeCheckrStatus(value);
  return (
    checkrStatusOptions.find((status) => status.key === normalized)?.label ||
    "Not Started"
  );
}

function getStatusClasses(value: string) {
  const status = normalizeStatus(value);

  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "not_approved") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (status === "checkr_pending") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "onboarding") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "missing_info") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "archived") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-slate-200 bg-white text-slate-700";
}

function buildApplication(row: AnyRow): ProgramApplication {
  const program = getText(
    row,
    ["program", "program_key", "program_slug", "program_type"],
    "program",
  );

  return {
    id: getText(row, ["id", "application_id", "uuid"]),
    program,
    status: normalizeStatus(getText(row, ["status"], "new")),
    checkr_status: normalizeCheckrStatus(
      getText(row, ["checkr_status", "background_check_status"], "not_started"),
    ),
    full_name: getText(row, ["full_name", "name", "applicant_name"]),
    email: getText(row, ["email", "applicant_email"]),
    phone: getText(row, ["phone", "phone_number", "applicant_phone"]),
    zip_code: getText(row, ["zip_code", "zipcode", "zip"]),
    city: getText(row, ["city"]),
    state: getText(row, ["state"]),
    availability: getText(row, ["availability"]),
    services_interested: asArray(
      row.services_interested ||
        row.servicesInterested ||
        row.services_interested_json ||
        row.servicesInterestedJson,
    ),
    referral_source: getText(row, [
      "referral_source",
      "partner_source",
      "source",
      "program_source",
    ]),
    resume_link: getText(row, ["resume_link", "resumeLink", "profile_link"]),
    resume_url: getText(row, ["resume_url", "resume_file_url", "resume_path"]),
    additional_documents: asArray(
      row.additional_documents ||
        row.additionalDocuments ||
        row.additional_document_urls ||
        row.additional_document_paths,
    ),
    background_check_consent: asBoolean(
      row.background_check_consent || row.backgroundCheckConsent,
    ),
    experience: getText(row, ["experience", "why", "reason"]),
    military_connected_background: getText(row, [
      "military_connected_background",
      "militaryConnectedBackground",
    ]),
    school_name: getText(row, ["school_name", "schoolName"]),
    student_status: getText(row, ["student_status", "studentStatus"]),
    graduation_year_or_availability: getText(row, [
      "graduation_year_or_availability",
      "graduationYearOrAvailability",
    ]),
    student_background: getText(row, [
      "student_background",
      "studentBackground",
    ]),
    notes: getText(row, ["notes", "additional_notes"]),
    admin_notes: getText(row, ["admin_notes", "adminNotes"]),
    next_step: getText(row, ["next_step", "nextStep"]),
    created_at: getText(row, ["created_at", "submitted_at", "application_date"]),
    updated_at: getText(row, ["updated_at"]),
    reviewed_at: getText(row, ["reviewed_at"]),
    reviewed_by: getText(row, ["reviewed_by"]),
    contacted_at: getText(row, ["contacted_at"]),
    onboarding_started_at: getText(row, ["onboarding_started_at"]),
    approved_at: getText(row, ["approved_at"]),
    rejected_at: getText(row, ["rejected_at"]),
    raw: row,
  };
}

async function sendProgramStatusEmail({
  application,
  oldStatus,
  newStatus,
}: {
  application: ProgramApplication;
  oldStatus: StatusKey;
  newStatus: StatusKey;
}) {
  if (!application.email) return;
  if (oldStatus === newStatus) return;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "Program status email skipped because RESEND_API_KEY is not configured.",
    );
    return;
  }

  const avatarUrl = getEmailAvatarUrl();
  const firstName = getFirstName(application.full_name);
  const copy = statusEmailCopy[newStatus];
  const programLabel = getProgramLabel(application.program);
  const statusLabel = getStatusLabel(newStatus);
  const nextStep = application.next_step || copy.next;

  const subject = `${copy.subject} — ${programLabel}`;
  const preheader = `${firstName}, your SitGuru application status is now ${statusLabel}.`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escapeHtml(subject)}</title>
    <style>
      body, table, td, p, a, h1, h2 {
        font-family: Arial, Helvetica, sans-serif !important;
      }
      .email-force-white {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .email-force-soft-white {
        color: #dcfce7 !important;
        -webkit-text-fill-color: #dcfce7 !important;
      }
      .email-force-dark {
        color: #102033 !important;
        -webkit-text-fill-color: #102033 !important;
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f6faf7; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6faf7; padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border:1px solid #d8efe1; border-radius:28px; overflow:hidden; box-shadow:0 18px 50px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#063d24,#047857); padding:28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="middle" style="width:72px;">
                      <img src="${escapeHtml(
                        avatarUrl,
                      )}" width="64" height="64" alt="SitGuru" style="display:block; border-radius:18px; border:3px solid rgba(255,255,255,0.35); background:#ffffff;" />
                    </td>
                    <td valign="middle" style="padding-left:14px;">
                      <p class="email-force-soft-white" style="margin:0; color:#dcfce7 !important; -webkit-text-fill-color:#dcfce7 !important; font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">
                        SitGuru Program Application
                      </p>
                      <h1 class="email-force-white" style="margin:6px 0 0; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; font-size:28px; line-height:1.1; font-weight:900;">
                        Status update
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 28px 10px;">
                <p style="margin:0 0 12px; color:#047857; font-size:14px; font-weight:900;">
                  Hi ${escapeHtml(firstName)},
                </p>

                <h2 class="email-force-dark" style="margin:0; color:#102033 !important; -webkit-text-fill-color:#102033 !important; font-size:30px; line-height:1.12; font-weight:900;">
                  ${escapeHtml(copy.headline)}
                </h2>

                <p style="margin:16px 0 0; color:#334155; font-size:16px; line-height:1.7; font-weight:600;">
                  ${escapeHtml(copy.body)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d8efe1; border-radius:20px; overflow:hidden;">
                  <tr>
                    <td style="background:#f0fdf4; padding:18px;">
                      <p style="margin:0; color:#166534; font-size:12px; font-weight:900; letter-spacing:1.4px; text-transform:uppercase;">
                        Current status
                      </p>
                      <p style="margin:8px 0 0; color:#052e16; font-size:22px; font-weight:900;">
                        ${escapeHtml(statusLabel)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding:8px 0; color:#64748b; font-size:13px; font-weight:800; width:140px;">Program</td>
                          <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:800;">${escapeHtml(
                            programLabel,
                          )}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#64748b; font-size:13px; font-weight:800;">Application ID</td>
                          <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:800;">${escapeHtml(
                            application.id,
                          )}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#64748b; font-size:13px; font-weight:800;">Updated</td>
                          <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:800;">${escapeHtml(
                            formatDateTime(new Date().toISOString()),
                          )}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 28px 26px;">
                <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:18px; padding:16px;">
                  <p style="margin:0; color:#9a3412; font-size:12px; font-weight:900; letter-spacing:1.2px; text-transform:uppercase;">
                    What happens next
                  </p>
                  <p style="margin:8px 0 0; color:#7c2d12; font-size:14px; line-height:1.7; font-weight:700;">
                    ${escapeHtml(nextStep)}
                  </p>
                </div>

                <p style="margin:18px 0 0; color:#64748b; font-size:12px; line-height:1.7; font-weight:600;">
                  Applying through a SitGuru program does not guarantee approval, bookings, earnings, employment, commissions, benefits, placement, referral rewards, SkillBridge participation, or full Guru status. Opportunities may depend on eligibility, onboarding, SitGuru trust and safety review steps, availability, customer demand, performance, trust, and SitGuru program needs.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 28px;">
                <p style="margin:0; color:#334155; font-size:13px; line-height:1.7; font-weight:700;">
                  Thank you,<br />
                  The SitGuru Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${firstName},

${copy.headline}

${copy.body}

Program: ${programLabel}
Application ID: ${application.id}
Current status: ${statusLabel}

What happens next:
${nextStep}

Thank you,
The SitGuru Team`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.RESEND_FROM_EMAIL ||
        process.env.SITGURU_FROM_EMAIL ||
        "SitGuru <noreply@sitguru.com>",
      to: [application.email],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Program status email failed:", response.status, errorText);
  }
}

function applicationMatchesSearch(
  application: ProgramApplication,
  query: string,
) {
  if (!query.trim()) return true;

  const haystack = [
    application.id,
    application.program,
    getProgramLabel(application.program),
    application.full_name,
    application.email,
    application.phone,
    application.zip_code,
    application.city,
    application.state,
    application.availability,
    application.referral_source,
    application.resume_link,
    application.experience,
    application.military_connected_background,
    application.school_name,
    application.student_status,
    application.student_background,
    application.notes,
    application.admin_notes,
    application.next_step,
    application.services_interested.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase().trim());
}

function getParam(
  searchParams: SearchParams,
  key: string,
  fallback = "",
): string {
  const value = searchParams[key];

  if (Array.isArray(value)) return value[0] || fallback;
  if (typeof value === "string") return value;

  return fallback;
}

function buildHref(
  current: SearchParams,
  updates: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(current).forEach(([key, value]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (nextValue) params.set(key, nextValue);
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query
    ? `${adminRoutes.programApplications}?${query}`
    : adminRoutes.programApplications;
}

async function getProgramApplications() {
  const { data, error } = await supabaseAdmin
    .from("program_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Admin program applications load error:", error.message);
    return {
      applications: [] as ProgramApplication[],
      error: error.message,
    };
  }

  return {
    applications: ((data || []) as AnyRow[]).map(buildApplication),
    error: "",
  };
}

async function updateProgramApplicationAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  const status = normalizeStatus(String(formData.get("status") || "new"));
  const checkrStatus = normalizeCheckrStatus(
    String(formData.get("checkr_status") || "not_started"),
  );
  const adminNotes = String(formData.get("admin_notes") || "").trim();
  const nextStep = String(formData.get("next_step") || "").trim();
  const returnTo =
    String(formData.get("return_to") || "").trim() ||
    adminRoutes.programApplications;

  if (!id) {
    redirect(returnTo);
  }

  const existingResult = await supabaseAdmin
    .from("program_applications")
    .select("*")
    .eq("id", id)
    .single();

  const existingApplication = existingResult.data
    ? buildApplication(existingResult.data as AnyRow)
    : null;

  const oldStatus = normalizeStatus(existingApplication?.status || "new");
  const timestamp = new Date().toISOString();

  const primaryPayload: AnyRow = {
    status,
    checkr_status: checkrStatus,
    admin_notes: adminNotes,
    next_step: nextStep,
    reviewed_at: timestamp,
    updated_at: timestamp,
  };

  if (status === "contacted") {
    primaryPayload.contacted_at = timestamp;
  }

  if (status === "onboarding") {
    primaryPayload.onboarding_started_at = timestamp;
  }

  if (status === "approved") {
    primaryPayload.approved_at = timestamp;
  }

  if (status === "not_approved") {
    primaryPayload.rejected_at = timestamp;
  }

  const primaryUpdate = await supabaseAdmin
    .from("program_applications")
    .update(primaryPayload)
    .eq("id", id)
    .select("*")
    .single();

  let savedApplication: ProgramApplication | null = primaryUpdate.data
    ? buildApplication(primaryUpdate.data as AnyRow)
    : null;

  if (primaryUpdate.error) {
    console.error(
      "Program application full update error:",
      primaryUpdate.error.message,
    );

    const fallbackPayload: AnyRow = {
      status,
      admin_notes: adminNotes,
      next_step: nextStep,
    };

    const fallbackUpdate = await supabaseAdmin
      .from("program_applications")
      .update(fallbackPayload)
      .eq("id", id)
      .select("*")
      .single();

    if (fallbackUpdate.error) {
      console.error(
        "Program application fallback update error:",
        fallbackUpdate.error.message,
      );
    } else if (fallbackUpdate.data) {
      savedApplication = buildApplication(fallbackUpdate.data as AnyRow);
    }
  }

  if (savedApplication && oldStatus !== status) {
    await sendProgramStatusEmail({
      application: savedApplication,
      oldStatus,
      newStatus: status,
    });
  }

  revalidatePath(adminRoutes.programApplications);
  revalidatePath(adminRoutes.programs);

  redirect(returnTo);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ProgramBadge({ program }: { program: string }) {
  const normalized = normalizeProgram(program);

  const classes =
    normalized === "student-hire"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : normalized === "veterans-hire"
        ? "border-green-200 bg-green-50 text-green-900"
        : normalized === "ambassador-program"
          ? "border-blue-200 bg-blue-50 text-blue-900"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classes}`}
    >
      {getProgramShortLabel(program)}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition ${
        active
          ? "border-green-800 bg-green-800 text-white"
          : "border-green-100 bg-white text-green-900 hover:bg-green-50"
      }`}
    >
      {children}
    </Link>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
}: {
  application: ProgramApplication;
}) {
  const normalizedProgram = normalizeProgram(application.program);
  const isAmbassador = normalizedProgram === "ambassador-program";
  const isStudent = normalizedProgram === "student-hire";
  const isVeterans = normalizedProgram === "veterans-hire";
  const isSkillBridge = normalizedProgram === "skillbridge-interest";

  return (
    <article className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProgramBadge program={application.program} />
            <StatusBadge status={application.status} />

            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
              Trust & Safety: {getCheckrStatusLabel(application.checkr_status)}
            </span>

            {application.background_check_consent ? (
              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                Trust & safety acknowledged
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                Trust & safety missing
              </span>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-black text-green-950">
            {application.full_name || "Unnamed applicant"}
          </h2>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-600">
            {application.email ? (
              <a
                href={`mailto:${application.email}`}
                className="inline-flex items-center gap-2 hover:text-green-800"
              >
                <Mail size={15} />
                {application.email}
              </a>
            ) : null}

            {application.phone ? (
              <a
                href={`tel:${application.phone}`}
                className="inline-flex items-center gap-2 hover:text-green-800"
              >
                <Phone size={15} />
                {application.phone}
              </a>
            ) : null}

            <span className="inline-flex items-center gap-2">
              <Clock3 size={15} />
              Submitted {formatDateTime(application.created_at)}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Application ID:{" "}
            <span className="font-black text-slate-900">{application.id}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
          {application.email ? (
            <a
              href={`mailto:${application.email}?subject=SitGuru Program Application - ${encodeURIComponent(
                getProgramLabel(application.program),
              )}&body=Hi ${
                application.full_name || "there"
              },%0D%0A%0D%0AThank you for applying through SitGuru. We are reviewing your application and will follow up with next steps.%0D%0A%0D%0AApplication ID: ${
                application.id
              }`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              <Mail size={16} />
              Email Applicant
            </a>
          ) : null}

          {application.phone ? (
            <a
              href={`sms:${application.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              <MessageCircle size={16} />
              Text Applicant
            </a>
          ) : null}
        </div>
      </div>

      {isAmbassador ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
              <Handshake size={21} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                Ambassador growth review
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
                Review Ambassador applicants for pet-care trust, referral reach,
                local credibility, community connection, and ability to help
                refer Gurus and Pet Parents while supporting SitGuru growth.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailRow
          label="Location"
          value={
            [application.city, application.state, application.zip_code]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />

        <DetailRow label="Availability" value={application.availability} />

        <DetailRow
          label={isAmbassador ? "Referral / community source" : "Referral source"}
          value={application.referral_source}
        />

        <DetailRow
          label="Services interested"
          value={
            application.services_interested.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {application.services_interested.map((service) => (
                  <span
                    key={service}
                    className="inline-flex rounded-full border border-green-100 bg-white px-2 py-1 text-xs font-black text-green-900"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )
          }
        />
      </div>

      {(isStudent ||
        isVeterans ||
        isSkillBridge ||
        application.school_name ||
        application.student_status ||
        application.military_connected_background) ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isStudent || application.school_name ? (
            <DetailRow label="School / program" value={application.school_name} />
          ) : null}

          {isStudent || application.student_status ? (
            <DetailRow label="Student status" value={application.student_status} />
          ) : null}

          {isStudent || application.graduation_year_or_availability ? (
            <DetailRow
              label="Graduation / availability window"
              value={application.graduation_year_or_availability}
            />
          ) : null}

          {isVeterans ||
          isSkillBridge ||
          application.military_connected_background ? (
            <DetailRow
              label="Military-connected / transferable experience"
              value={application.military_connected_background}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <DetailRow
          label={
            isStudent
              ? "Why SitGuru is a good way to make extra cash"
              : isAmbassador
                ? "Why this applicant may be a strong Ambassador"
                : isSkillBridge
                  ? "SkillBridge / Veterans Pathway interest"
                  : "Experience / reason"
          }
          value={application.experience}
        />

        <DetailRow
          label="Additional notes"
          value={application.notes || application.student_background}
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText size={18} className="text-green-800" />
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Resume / documents
            </p>
          </div>

          <div className="space-y-2 text-sm font-bold text-slate-700">
            {application.resume_link ? (
              <a
                href={application.resume_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-green-800 hover:text-green-950 hover:underline"
              >
                Resume/profile link
                <ExternalLink size={14} />
              </a>
            ) : null}

            {application.resume_url ? (
              <a
                href={application.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-green-800 hover:text-green-950 hover:underline"
              >
                Resume file
                <ExternalLink size={14} />
              </a>
            ) : null}

            {application.additional_documents.length > 0 ? (
              <div className="flex flex-col gap-2">
                {application.additional_documents.map((document, index) => (
                  <a
                    key={`${document}-${index}`}
                    href={document}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-green-800 hover:text-green-950 hover:underline"
                  >
                    Additional document {index + 1}
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            ) : null}

            {!application.resume_link &&
            !application.resume_url &&
            application.additional_documents.length === 0 ? (
              <p className="text-slate-500">No resume or document link found.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
          <div className="mb-3 flex items-center gap-2">
            <BadgeCheck size={18} className="text-green-800" />
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Admin timeline
            </p>
          </div>

          <div className="grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-2">
            <p>Reviewed: {formatDate(application.reviewed_at)}</p>
            <p>Contacted: {formatDate(application.contacted_at)}</p>
            <p>Onboarding: {formatDate(application.onboarding_started_at)}</p>
            <p>Approved: {formatDate(application.approved_at)}</p>
            <p>Not approved: {formatDate(application.rejected_at)}</p>
            <p>Updated: {formatDate(application.updated_at)}</p>
          </div>
        </div>
      </div>

      <form
        action={updateProgramApplicationAction}
        className="mt-5 rounded-[24px] border border-green-100 bg-green-50 p-4"
      >
        <input type="hidden" name="id" value={application.id} />
        <input
          type="hidden"
          name="return_to"
          value={adminRoutes.programApplications}
        />

        <div className="grid gap-3 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-green-900">
              Status
            </label>
            <select
              name="status"
              defaultValue={application.status}
              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
            >
              {statusOptions
                .filter((status) => status.key !== "all")
                .map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-green-900">
              Trust & Safety Status
            </label>
            <select
              name="checkr_status"
              defaultValue={application.checkr_status}
              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
            >
              {checkrStatusOptions.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-green-900">
              Next step
            </label>
            <input
              name="next_step"
              defaultValue={application.next_step}
              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
              placeholder="Example: Send onboarding email, start trust and safety review, request resume..."
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-green-900">
            Admin notes
          </label>
          <textarea
            name="admin_notes"
            defaultValue={application.admin_notes}
            rows={3}
            className="min-h-[100px] w-full resize-y rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
            placeholder={
              isAmbassador
                ? "Document Ambassador fit, pet-care trust, local network, referral potential, outreach, and next steps."
                : "Add review notes, outreach updates, onboarding progress, or next steps."
            }
          />
        </div>

        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">
          Saving a changed status sends the applicant an email update with their
          current application status, application ID, and next-step message.
        </p>

        <button
          type="submit"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900 sm:w-auto"
        >
          Save Admin Update
          <CheckCircle2 size={17} />
        </button>
      </form>
    </article>
  );
}

function EmptyState({ tableError }: { tableError?: string }) {
  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        <Search size={26} />
      </div>

      <h2 className="text-2xl font-black text-green-950">
        No program applications found.
      </h2>

      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
        {tableError
          ? `Supabase returned: ${tableError}`
          : "Try clearing filters, or submit a test application from the public program application page."}
      </p>

      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/programs/apply?program=student-hire"
          className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
        >
          Submit Test Application
        </Link>

        <Link
          href={adminRoutes.programApplications}
          className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
        >
          Clear Filters
        </Link>
      </div>
    </div>
  );
}

export default async function AdminProgramApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const selectedProgram = getParam(resolvedSearchParams, "program", "all");
  const selectedStatus = getParam(resolvedSearchParams, "status", "all");
  const query = getParam(resolvedSearchParams, "q", "");

  const { applications, error } = await getProgramApplications();

  const filteredApplications = applications.filter((application) => {
    const programMatch =
      selectedProgram === "all" ||
      !selectedProgram ||
      normalizeProgram(application.program) === selectedProgram;

    const statusMatch =
      selectedStatus === "all" ||
      !selectedStatus ||
      normalizeStatus(application.status) === selectedStatus;

    const searchMatch = applicationMatchesSearch(application, query);

    return programMatch && statusMatch && searchMatch;
  });

  const counts = {
    total: applications.length,
    new: applications.filter((item) => normalizeStatus(item.status) === "new")
      .length,
    reviewing: applications.filter(
      (item) => normalizeStatus(item.status) === "reviewing",
    ).length,
    contacted: applications.filter(
      (item) => normalizeStatus(item.status) === "contacted",
    ).length,
    onboarding: applications.filter(
      (item) => normalizeStatus(item.status) === "onboarding",
    ).length,
    trustSafetyPending: applications.filter(
      (item) => normalizeStatus(item.status) === "checkr_pending",
    ).length,
    approved: applications.filter(
      (item) => normalizeStatus(item.status) === "approved",
    ).length,
    notApproved: applications.filter(
      (item) => normalizeStatus(item.status) === "not_approved",
    ).length,
    student: applications.filter(
      (item) => normalizeProgram(item.program) === "student-hire",
    ).length,
    veterans: applications.filter(
      (item) => normalizeProgram(item.program) === "veterans-hire",
    ).length,
    ambassador: applications.filter(
      (item) => normalizeProgram(item.program) === "ambassador-program",
    ).length,
    skillbridge: applications.filter(
      (item) => normalizeProgram(item.program) === "skillbridge-interest",
    ).length,
  };

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.programs}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Program Operations
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <UserCheck size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Programs / Applications
                </p>

                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Program Applications
                </h1>

                <p className="mt-1 max-w-5xl text-base font-semibold text-slate-600">
                  Review and action Student Hire, Veterans Hire, Ambassador
                  Program, and SkillBridge Interest applicants. Update status,
                  trust and safety stage, notes, and next steps. Status changes
                  send an applicant email update.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/programs/apply?program=student-hire"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Sparkles size={17} />
              Test Application
            </Link>

            <Link
              href={adminRoutes.programApplications}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Search size={17} />
              Clear Filters
            </Link>

            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                "Application export can be wired to a dedicated CSV route next.",
              )}`}
              download="sitguru-program-applications.csv"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export Placeholder
            </a>
          </div>
        </section>

        <section className="rounded-[30px] border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
                <ShieldCheck size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                  Admin review standard
                </p>
                <h2 className="mt-1 text-2xl font-black text-green-950">
                  Review applicants for fit, trust, readiness, and next steps.
                </h2>
                <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-green-950">
                  Use this page to track program routing, contact details,
                  availability, services, documents, trust and safety
                  acknowledgment, onboarding readiness, and approval decisions.
                </p>
              </div>
            </div>

            <Link
              href={adminRoutes.veteransApplications}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-green-300 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-400 hover:bg-green-100"
            >
              Review Veterans Applicants →
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<UsersRound size={22} />}
            label="Total Applications"
            value={number(counts.total)}
            detail={`${number(filteredApplications.length)} visible with filters`}
          />

          <StatCard
            icon={<Clock3 size={22} />}
            label="New"
            value={number(counts.new)}
            detail="Waiting for first review"
            href={buildHref(resolvedSearchParams, { status: "new" })}
          />

          <StatCard
            icon={<UserCheck size={22} />}
            label="Reviewing"
            value={number(counts.reviewing)}
            detail={`${number(counts.contacted)} contacted`}
            href={buildHref(resolvedSearchParams, { status: "reviewing" })}
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Trust & Safety"
            value={number(counts.trustSafetyPending)}
            detail="Review workflow"
            href={buildHref(resolvedSearchParams, {
              status: "checkr_pending",
            })}
          />

          <StatCard
            icon={<CheckCircle2 size={22} />}
            label="Approved"
            value={number(counts.approved)}
            detail={`${number(counts.notApproved)} not approved`}
            href={buildHref(resolvedSearchParams, { status: "approved" })}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<GraduationCap size={22} />}
            label="Student Hire"
            value={number(counts.student)}
            detail="Student and summer applicants"
            href={adminRoutes.studentApplications}
          />

          <StatCard
            icon={<Medal size={22} />}
            label="Veterans Hire"
            value={number(counts.veterans)}
            detail="Military-connected applicants"
            href={adminRoutes.veteransApplications}
          />

          <StatCard
            icon={<Handshake size={22} />}
            label="Ambassador Program"
            value={number(counts.ambassador)}
            detail="Referral and community growth"
            href={adminRoutes.ambassadorApplications}
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="SkillBridge Interest"
            value={number(counts.skillbridge)}
            detail="Future transition pathway interest"
            href={adminRoutes.skillbridgeApplications}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Filter applicants
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Filter by program, status, or search applicant name, email,
                phone, ZIP, partner source, school, services, or notes.
              </p>
            </div>

            <form
              action={adminRoutes.programApplications}
              className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
            >
              {selectedProgram && selectedProgram !== "all" ? (
                <input type="hidden" name="program" value={selectedProgram} />
              ) : null}

              {selectedStatus && selectedStatus !== "all" ? (
                <input type="hidden" name="status" value={selectedStatus} />
              ) : null}

              <input
                name="q"
                defaultValue={query}
                placeholder="Search applicants..."
                className="min-h-[46px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100 sm:w-80"
              />

              <button
                type="submit"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
              >
                <Search size={16} />
                Search
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Program
              </p>

              <div className="flex flex-wrap gap-2">
                {programOptions.map((program) => (
                  <FilterPill
                    key={program.key}
                    href={buildHref(resolvedSearchParams, {
                      program: program.key,
                    })}
                    active={
                      selectedProgram === program.key ||
                      (!selectedProgram && program.key === "all")
                    }
                  >
                    {program.icon}
                    {program.shortLabel}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Status
              </p>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <FilterPill
                    key={status.key}
                    href={buildHref(resolvedSearchParams, {
                      status: status.key,
                    })}
                    active={
                      selectedStatus === status.key ||
                      (!selectedStatus && status.key === "all")
                    }
                  >
                    {status.label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </section>

        {filteredApplications.length > 0 ? (
          <section className="space-y-5">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </section>
        ) : (
          <EmptyState tableError={error} />
        )}

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">
              Recommended admin workflow
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Use these statuses consistently so the dashboard can track the
              applicant pipeline clearly.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
                1. New / Reviewing
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Confirm program routing, contact info, services, location,
                trust and safety acknowledgment, resume, and notes.
              </p>
            </div>

            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
                2. Contacted / Missing Info
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Email or text the applicant. Request missing resume, documents,
                availability, school, Ambassador source, or Veterans pathway
                details.
              </p>
            </div>

            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
                3. Onboarding / Trust & Safety
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Move qualified applicants through onboarding, profile readiness,
                training, and SitGuru trust and safety review steps.
              </p>
            </div>

            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
                4. Approved / Not Approved
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Finalize applicant status. Approved Gurus may move toward
                bookable Guru status based on SitGuru standards.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}