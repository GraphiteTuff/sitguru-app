import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type AnyRow = Record<string, unknown>;

type SortKey =
  | "created_at"
  | "full_name"
  | "school_name"
  | "student_status"
  | "status"
  | "city"
  | "state"
  | "zip_code";

type StudentApplication = {
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
  school_name: string;
  student_status: string;
  graduation_year_or_availability: string;
  student_background: string;
  notes: string;
  admin_notes: string;
  next_step: string;
  created_at: string;
  updated_at: string;
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  programApplications: "/admin/program-applications",
  studentApplications: "/admin/program-applications?program=student-hire",
  studentOps: "/admin/programs/student-hire",
};

const studentAudiences = [
  "College students",
  "High school seniors 18+",
  "Trade school students",
  "Recent graduates",
  "Summer-break workers",
  "Students looking for after-class income",
  "Students looking for weekend or school-break income",
];

const studentPartnerSources = [
  "Universities",
  "High schools",
  "Career centers",
  "Student organizations",
  "Athletic teams and clubs",
  "Summer work programs",
  "Local education partners",
];

const studentGoals = [
  {
    key: "applications",
    label: "Increase qualified student applicants",
    metric: "Applications",
    target: 50,
    action: "Promote Student Hire around schools, clubs, summer work, and friend referrals.",
  },
  {
    key: "onboarding",
    label: "Move students into onboarding",
    metric: "Onboarding",
    target: 20,
    action: "Follow up quickly with students who have strong availability and service interest.",
  },
  {
    key: "background",
    label: "Complete background check readiness",
    metric: "Background consent",
    target: 35,
    action: "Make sure students understand Checkr may be required before pet care approval.",
  },
  {
    key: "approved",
    label: "Approve qualified students for next Guru steps",
    metric: "Approved",
    target: 15,
    action: "Prioritize applicants with complete profiles, good availability, and pet care fit.",
  },
  {
    key: "documents",
    label: "Collect resumes or profile links",
    metric: "Resume/profile",
    target: 35,
    action: "Request a resume, LinkedIn, portfolio, or simple profile link when missing.",
  },
];

const requirementDefinitions = [
  {
    key: "resume",
    label: "Resume/profile provided",
    action: "Request resume, profile link, or uploaded resume file.",
  },
  {
    key: "background_consent",
    label: "Background check consent",
    action: "Ask applicant to confirm Checkr/background check acknowledgement.",
  },
  {
    key: "services",
    label: "Services selected",
    action: "Ask which services they want to offer.",
  },
  {
    key: "availability",
    label: "Availability provided",
    action: "Ask when they can earn: after class, breaks, weekends, or summer.",
  },
  {
    key: "school",
    label: "School/program provided",
    action: "Ask for school, program, graduation year, or student status.",
  },
  {
    key: "location",
    label: "Location provided",
    action: "Ask for ZIP, city, and state to route local opportunities.",
  },
  {
    key: "admin_notes",
    label: "Admin notes added",
    action: "Add admin notes to document follow-up and review status.",
  },
  {
    key: "next_step",
    label: "Next step added",
    action: "Add a clear next action for admin follow-up.",
  },
];

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
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
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

function normalizeProgram(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-").trim();
}

function normalizeStatus(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");

  if (normalized === "pending" || normalized === "submitted") return "new";
  if (normalized === "in_review") return "reviewing";
  if (normalized === "background_check") return "checkr_pending";
  if (normalized === "rejected" || normalized === "declined") return "not_approved";

  return normalized || "new";
}

function statusLabel(value: string) {
  const normalized = normalizeStatus(value);

  const labels: Record<string, string> = {
    new: "New",
    reviewing: "Reviewing",
    contacted: "Contacted",
    missing_info: "Missing Info",
    onboarding: "Onboarding",
    checkr_pending: "Checkr Pending",
    approved: "Approved",
    not_approved: "Not Approved",
    archived: "Archived",
  };

  return labels[normalized] || value || "New";
}

function buildStudentApplication(row: AnyRow): StudentApplication {
  return {
    id: getText(row, ["id", "application_id", "uuid"]),
    program: getText(row, ["program", "program_key", "program_slug"], "student-hire"),
    status: normalizeStatus(getText(row, ["status"], "new")),
    checkr_status: getText(row, ["checkr_status", "background_check_status"], "not_started"),
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
    school_name: getText(row, ["school_name", "schoolName"]),
    student_status: getText(row, ["student_status", "studentStatus"]),
    graduation_year_or_availability: getText(row, [
      "graduation_year_or_availability",
      "graduationYearOrAvailability",
    ]),
    student_background: getText(row, ["student_background", "studentBackground"]),
    notes: getText(row, ["notes", "additional_notes"]),
    admin_notes: getText(row, ["admin_notes", "adminNotes"]),
    next_step: getText(row, ["next_step", "nextStep"]),
    created_at: getText(row, ["created_at", "submitted_at", "application_date"]),
    updated_at: getText(row, ["updated_at"]),
  };
}

function isStudentHire(row: AnyRow) {
  const program = normalizeProgram(
    getText(row, ["program", "program_key", "program_slug", "program_type"]),
  );

  if (program === "student-hire") return true;

  const search = JSON.stringify(row).toLowerCase();

  return [
    "student-hire",
    "student hire",
    "student",
    "college",
    "university",
    "school",
    "summer",
    "recent grad",
    "graduate",
    "campus",
    "after class",
    "between classes",
  ].some((keyword) => search.includes(keyword));
}

function getParam(searchParams: SearchParams, key: string, fallback = "") {
  const value = searchParams[key];

  if (Array.isArray(value)) return value[0] || fallback;
  if (typeof value === "string") return value;

  return fallback;
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

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function countBy(items: StudentApplication[], getter: (item: StudentApplication) => string | string[]) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const rawValue = getter(item);
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    values.forEach((value) => {
      const normalized = value.trim() || "Not provided";
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function sortApplications(
  applications: StudentApplication[],
  sort: SortKey,
  direction: "asc" | "desc",
) {
  return [...applications].sort((a, b) => {
    const aValue = (a[sort] || "").toString().toLowerCase();
    const bValue = (b[sort] || "").toString().toLowerCase();

    if (sort === "created_at") {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return direction === "asc" ? aTime - bTime : bTime - aTime;
    }

    const comparison = aValue.localeCompare(bValue);
    return direction === "asc" ? comparison : -comparison;
  });
}

function buildSortHref(current: SearchParams, sort: SortKey) {
  const currentSort = getParam(current, "sort", "created_at");
  const currentDirection = getParam(current, "direction", "desc");
  const nextDirection =
    currentSort === sort && currentDirection === "desc" ? "asc" : "desc";

  const params = new URLSearchParams();

  Object.entries(current).forEach(([key, value]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (nextValue) params.set(key, nextValue);
  });

  params.set("sort", sort);
  params.set("direction", nextDirection);

  return `${adminRoutes.studentOps}?${params.toString()}`;
}

function escapeCsv(value: string | number | boolean) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(applications: StudentApplication[]) {
  const headers = [
    "Application ID",
    "Full Name",
    "Email",
    "Phone",
    "Status",
    "Checkr Status",
    "School",
    "Student Status",
    "Graduation / Availability",
    "City",
    "State",
    "ZIP",
    "Availability",
    "Services",
    "Referral Source",
    "Resume Link",
    "Resume File",
    "Background Consent",
    "Next Step",
    "Admin Notes",
    "Submitted",
  ];

  const rows = applications.map((item) => [
    item.id,
    item.full_name,
    item.email,
    item.phone,
    statusLabel(item.status),
    item.checkr_status,
    item.school_name,
    item.student_status,
    item.graduation_year_or_availability,
    item.city,
    item.state,
    item.zip_code,
    item.availability,
    item.services_interested.join("; "),
    item.referral_source,
    item.resume_link,
    item.resume_url,
    item.background_check_consent ? "Yes" : "No",
    item.next_step,
    item.admin_notes,
    item.created_at,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n");
}

function statusClass(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") return "border-green-200 bg-green-50 text-green-800";
  if (normalized === "onboarding") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized === "checkr_pending") return "border-blue-200 bg-blue-50 text-blue-800";
  if (normalized === "missing_info") return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized === "not_approved") return "border-rose-200 bg-rose-50 text-rose-800";

  return "border-slate-200 bg-white text-slate-700";
}

function completeRequirement(application: StudentApplication, key: string) {
  if (key === "resume") return Boolean(application.resume_link || application.resume_url);
  if (key === "background_consent") return application.background_check_consent;
  if (key === "services") return application.services_interested.length > 0;
  if (key === "availability") return Boolean(application.availability);
  if (key === "school") {
    return Boolean(
      application.school_name ||
        application.student_status ||
        application.graduation_year_or_availability,
    );
  }
  if (key === "location") {
    return Boolean(application.zip_code || application.city || application.state);
  }
  if (key === "admin_notes") return Boolean(application.admin_notes);
  if (key === "next_step") return Boolean(application.next_step);

  return false;
}

type SafeQueryResult = {
  data: AnyRow[];
  error: string;
};

async function safeStudentHireQuery(
  query: PromiseLike<{ data: unknown; error: { message?: string } | null }>,
  label: string,
): Promise<SafeQueryResult> {
  try {
    const result = await query;

    if (result.error) {
      const message = result.error.message || `${label} query failed`;
      console.warn(`Student Hire query skipped for ${label}:`, message);
      return { data: [], error: message };
    }

    return {
      data: ((result.data || []) as AnyRow[]).filter(Boolean),
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Student Hire query skipped for ${label}:`, message);
    return { data: [], error: message };
  }
}

function normalizeLeadStatus(value: string) {
  const normalized = normalizeStatus(value);

  if (normalized === "conditional_offer_sent") return "contacted";
  if (normalized === "active") return "approved";
  if (normalized === "not_a_fit") return "not_approved";
  if (normalized === "not_moving_forward") return "not_approved";
  if (normalized === "signed_up") return "onboarding";
  if (normalized === "interested") return "reviewing";

  return normalized;
}

function getLeadProgram(row: AnyRow) {
  const directProgram = getText(row, ["program", "program_name", "program_type"]);

  if (directProgram) return directProgram;

  const search = JSON.stringify(row).toLowerCase();

  if (search.includes("student")) return "student-hire";
  if (search.includes("military") || search.includes("veteran")) {
    return "veterans-hire";
  }

  return "student-hire";
}

function buildStudentLeadApplication(row: AnyRow): StudentApplication {
  const id = getText(row, ["id", "lead_id", "uuid"]);
  const resumeUrl = getText(row, [
    "resume_file_url",
    "resume_url",
    "resume_link",
    "resume_path",
  ]);
  const coverLetterUrl = getText(row, [
    "cover_letter_file_url",
    "cover_letter_url",
    "cover_letter_link",
  ]);
  const otherDocumentUrl = getText(row, [
    "other_document_file_url",
    "other_document_url",
    "supporting_document_url",
    "document_url",
  ]);
  const source = getText(row, [
    "source",
    "lead_source",
    "signup_source",
    "referral_source",
    "program_source",
  ]);
  const city = getText(row, ["city", "location_city"]);
  const state = getText(row, ["state", "location_state"]);
  const zipCode = getText(row, ["zip_code", "zipcode", "zip", "postal_code"]);
  const notes = getText(row, ["notes", "message", "comments", "description"]);
  const status = normalizeLeadStatus(getText(row, ["status"], "new"));

  return {
    id: id ? `lead-${id}` : `lead-${getText(row, ["email", "phone"], Math.random().toString(36).slice(2))}`,
    program: normalizeProgram(getLeadProgram(row)) || "student-hire",
    status,
    checkr_status: normalizeStatus(getText(row, ["checkr_status"], "not_started")),
    full_name: getText(row, [
      "full_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
    ]),
    email: getText(row, [
      "email",
      "lead_email",
      "applicant_email",
      "candidate_email",
      "contact_email",
    ]),
    phone: getText(row, [
      "phone",
      "phone_number",
      "mobile",
      "lead_phone",
      "applicant_phone",
    ]),
    zip_code: zipCode,
    city,
    state,
    availability: getText(row, ["availability", "availability_window"]),
    services_interested: asArray(
      row.services_interested ||
        row.servicesInterested ||
        row.services ||
        row.service_interest,
    ),
    referral_source: source || "Ambassador Leads / HR",
    resume_link: resumeUrl,
    resume_url: resumeUrl,
    additional_documents: [coverLetterUrl, otherDocumentUrl].filter(Boolean),
    background_check_consent: asBoolean(
      row.background_check_consent || row.backgroundCheckConsent,
    ),
    experience: getText(row, [
      "experience",
      "work_experience",
      "why",
      "reason",
      "summary",
    ]),
    school_name: getText(row, ["school_name", "schoolName", "school"]),
    student_status: getText(row, ["student_status", "studentStatus"]),
    graduation_year_or_availability: getText(row, [
      "graduation_year_or_availability",
      "graduationYearOrAvailability",
      "availability",
    ]),
    student_background: getText(row, [
      "student_background",
      "studentBackground",
      "background",
    ]),
    notes,
    admin_notes: getText(row, ["admin_notes", "adminNotes"]),
    next_step:
      getText(row, ["next_step", "nextStep"]) ||
      (status === "reviewing" || status === "contacted"
        ? "Confirm preferred portal email, then create/link Ambassador dashboard access."
        : ""),
    created_at: getText(row, ["created_at", "submitted_at", "application_date"]),
    updated_at: getText(row, ["updated_at"]),
  };
}

function buildStudentAmbassadorApplication(row: AnyRow): StudentApplication {
  const referralCode = getText(row, ["referral_code"]);
  const loginUsername = getText(row, ["login_username"]);
  const loginEmail = getText(row, ["login_email", "email", "contact_email"]);
  const dashboardEnabled = asBoolean(row.dashboard_enabled);
  const loginEnabled = asBoolean(row.login_enabled);
  const userId = getText(row, ["user_id"]);
  const status = normalizeLeadStatus(getText(row, ["status"], "new"));
  const readiness = [
    referralCode ? `Referral code: ${referralCode}` : "",
    loginUsername ? `Login username: ${loginUsername}` : "",
    dashboardEnabled ? "Dashboard enabled" : "Dashboard not enabled",
    loginEnabled ? "Login enabled" : "Login not enabled",
    userId ? "Linked to Auth" : "Missing Auth link",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: `ambassador-${getText(row, ["id"], referralCode || loginEmail || Math.random().toString(36).slice(2))}`,
    program: "student-hire",
    status,
    checkr_status: normalizeStatus(getText(row, ["checkr_status"], "not_started")),
    full_name: getText(row, ["full_name", "display_name", "name"]),
    email: loginEmail,
    phone: getText(row, ["phone", "phone_number", "mobile"]),
    zip_code: getText(row, ["zip_code", "zipcode", "zip", "postal_code"]),
    city: getText(row, ["city"]),
    state: getText(row, ["state"]),
    availability: getText(row, ["availability"]),
    services_interested: asArray(row.services_interested || row.services),
    referral_source:
      getText(row, ["source", "lead_source", "referral_source"]) ||
      "Ambassador dashboard record",
    resume_link: getText(row, ["resume_link", "resume_url", "resume_file_url"]),
    resume_url: getText(row, ["resume_url", "resume_file_url", "resume_path"]),
    additional_documents: asArray(
      row.additional_documents || row.documents || row.document_urls,
    ),
    background_check_consent: asBoolean(
      row.background_check_consent || row.backgroundCheckConsent,
    ),
    experience: getText(row, ["experience", "bio", "summary"]),
    school_name: getText(row, ["school_name", "schoolName", "school"]),
    student_status: getText(row, ["student_status", "studentStatus"]),
    graduation_year_or_availability: getText(row, [
      "graduation_year_or_availability",
      "graduationYearOrAvailability",
    ]),
    student_background: readiness,
    notes: [getText(row, ["notes"]), readiness].filter(Boolean).join("\n\n"),
    admin_notes: getText(row, ["admin_notes", "adminNotes"]),
    next_step:
      getText(row, ["next_step", "nextStep"]) ||
      (userId
        ? "Confirm training, documents, and final certification progress."
        : "Create or link Supabase Auth user so Ambassador can log in."),
    created_at: getText(row, ["created_at", "submitted_at", "application_date"]),
    updated_at: getText(row, ["updated_at"]),
  };
}

function isActiveStudentAmbassador(row: AnyRow) {
  if (normalizeStatus(getText(row, ["status"])) === "archived") return false;

  const search = JSON.stringify(row).toLowerCase();

  return (
    search.includes("student") ||
    search.includes("sg2026") ||
    Boolean(getText(row, ["referral_code", "login_username"]))
  );
}

function dedupeApplications(applications: StudentApplication[]) {
  const byKey = new Map<string, StudentApplication>();

  for (const application of applications) {
    const normalizedEmail = application.email.trim().toLowerCase();
    const normalizedName = application.full_name.trim().toLowerCase();
    const key =
      normalizedEmail ||
      `${normalizedName}:${application.phone.trim()}` ||
      application.id;

    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, application);
      continue;
    }

    const existingScore =
      Number(Boolean(existing.resume_link || existing.resume_url)) +
      Number(Boolean(existing.phone)) +
      Number(Boolean(existing.next_step)) +
      Number(Boolean(existing.student_background));
    const nextScore =
      Number(Boolean(application.resume_link || application.resume_url)) +
      Number(Boolean(application.phone)) +
      Number(Boolean(application.next_step)) +
      Number(Boolean(application.student_background));

    if (nextScore >= existingScore) {
      byKey.set(key, {
        ...existing,
        ...application,
        id: existing.id,
        notes: [existing.notes, application.notes].filter(Boolean).join("\n\n"),
      });
    }
  }

  return Array.from(byKey.values());
}

async function getStudentApplications() {
  const [
    programApplicationsResult,
    ambassadorLeadsResult,
    ambassadorsResult,
  ] = await Promise.all([
    safeStudentHireQuery(
      supabaseAdmin
        .from("program_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "program_applications",
    ),
    safeStudentHireQuery(
      supabaseAdmin
        .from("ambassador_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "ambassador_leads",
    ),
    safeStudentHireQuery(
      supabaseAdmin
        .from("ambassadors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "ambassadors",
    ),
  ]);

  const programApplications = programApplicationsResult.data
    .filter(isStudentHire)
    .map(buildStudentApplication);

  const ambassadorLeadApplications = ambassadorLeadsResult.data
    .filter(isStudentHire)
    .map(buildStudentLeadApplication);

  const ambassadorApplications = ambassadorsResult.data
    .filter(isActiveStudentAmbassador)
    .map(buildStudentAmbassadorApplication);

  const applications = dedupeApplications([
    ...programApplications,
    ...ambassadorLeadApplications,
    ...ambassadorApplications,
  ]).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const errors = [
    programApplicationsResult.error
      ? `program_applications: ${programApplicationsResult.error}`
      : "",
    ambassadorLeadsResult.error
      ? `ambassador_leads: ${ambassadorLeadsResult.error}`
      : "",
    ambassadorsResult.error ? `ambassadors: ${ambassadorsResult.error}` : "",
  ].filter(Boolean);

  return {
    applications,
    error: errors.join(" | "),
  };
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-500 group-hover:text-white">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
        {detail}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
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

function TopFiveCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { label: string; count: number }[];
}) {
  const topItems = items.slice(0, 5);
  const max = Math.max(...topItems.map((item) => item.count), 0);

  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
          Top 5
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {topItems.length > 0 ? (
          topItems.map((item, index) => {
            const width = max > 0 ? (item.count / max) * 100 : 0;

            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-black text-slate-800">
                    {item.label}
                  </p>
                  <p className="shrink-0 text-sm font-black text-amber-700">
                    {number(item.count)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-amber-50">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${Math.max(4, width)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
            No data yet.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function BreakdownLedger({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Record<string, ReactNode>[];
  columns: { key: string; label: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e3ece5] bg-white shadow-sm">
      <div className="border-b border-[#edf3ee] p-5">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-[#fbfcf9]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf3ee]">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={index} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 text-sm font-bold leading-6 text-slate-700"
                    >
                      {row[column.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm font-bold text-slate-500"
                >
                  No ledger rows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressLine({
  label,
  value,
  total,
  detail,
}: {
  label: string;
  value: number;
  total: number;
  detail: string;
}) {
  const rate = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
        </div>

        <p className="shrink-0 text-sm font-black text-amber-700">
          {number(value)} / {number(total)}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-amber-50">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${Math.max(3, clampPercent(rate))}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-black text-slate-500">{percent(rate)}</p>
    </div>
  );
}

function SortLink({
  label,
  sort,
  current,
}: {
  label: string;
  sort: SortKey;
  current: SearchParams;
}) {
  return (
    <Link
      href={buildSortHref(current, sort)}
      className="inline-flex items-center gap-1 hover:text-amber-700"
    >
      {label}
      <span className="text-[10px]">↕</span>
    </Link>
  );
}

export default async function AdminStudentHireProgramPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const sort = getParam(resolvedSearchParams, "sort", "created_at") as SortKey;
  const direction = getParam(resolvedSearchParams, "direction", "desc") === "asc" ? "asc" : "desc";

  const { applications, error } = await getStudentApplications();
  const sortedApplications = sortApplications(applications, sort, direction);
  const csv = buildCsv(sortedApplications);

  const total = applications.length;
  const pending = applications.filter((item) =>
    ["new", "reviewing", "contacted", "missing_info"].includes(normalizeStatus(item.status)),
  ).length;
  const onboarding = applications.filter((item) => normalizeStatus(item.status) === "onboarding").length;
  const approved = applications.filter((item) => normalizeStatus(item.status) === "approved").length;
  const checkrPending = applications.filter(
    (item) =>
      normalizeStatus(item.status) === "checkr_pending" ||
      item.checkr_status.includes("pending") ||
      item.checkr_status.includes("invited"),
  ).length;
  const backgroundConsent = applications.filter((item) => item.background_check_consent).length;
  const resumeProvided = applications.filter((item) => item.resume_link || item.resume_url).length;
  const servicesProvided = applications.filter((item) => item.services_interested.length > 0).length;
  const conversionRate = total > 0 ? (approved / total) * 100 : 0;

  const schools = countBy(applications, (item) => item.school_name);
  const studentStatuses = countBy(applications, (item) => item.student_status);
  const graduationWindows = countBy(applications, (item) => item.graduation_year_or_availability);
  const services = countBy(applications, (item) => item.services_interested);
  const zips = countBy(applications, (item) => item.zip_code);
  const sources = countBy(applications, (item) => item.referral_source);
  const availability = countBy(applications, (item) => item.availability);
  const states = countBy(applications, (item) => item.state);

  const partnerRows = sources.slice(0, 25).map((source) => {
    const matching = applications.filter(
      (item) => (item.referral_source || "Not provided") === source.label,
    );
    const sourcePending = matching.filter((item) =>
      ["new", "reviewing", "contacted", "missing_info"].includes(normalizeStatus(item.status)),
    ).length;
    const sourceOnboarding = matching.filter((item) => normalizeStatus(item.status) === "onboarding").length;
    const sourceApproved = matching.filter((item) => normalizeStatus(item.status) === "approved").length;
    const sourceCheckr = matching.filter(
      (item) => normalizeStatus(item.status) === "checkr_pending",
    ).length;
    const latest = matching
      .map((item) => item.created_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      source: <span className="font-black text-slate-950">{source.label}</span>,
      applications: number(matching.length),
      pending: number(sourcePending),
      onboarding: number(sourceOnboarding),
      approved: number(sourceApproved),
      checkr: number(sourceCheckr),
      conversion: percent(matching.length > 0 ? (sourceApproved / matching.length) * 100 : 0),
      latest: formatDate(latest),
    };
  });

  const goalRows = studentGoals.map((goal) => {
    const current =
      goal.key === "applications"
        ? total
        : goal.key === "onboarding"
          ? onboarding
          : goal.key === "background"
            ? backgroundConsent
            : goal.key === "approved"
              ? approved
              : resumeProvided;

    const rate = goal.target > 0 ? (current / goal.target) * 100 : 0;

    return {
      goal: <span className="font-black text-slate-950">{goal.label}</span>,
      metric: goal.metric,
      current: number(current),
      target: number(goal.target),
      progress: (
        <div className="min-w-[180px]">
          <div className="h-3 overflow-hidden rounded-full bg-amber-50">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.max(3, clampPercent(rate))}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-black text-slate-500">{percent(rate)}</p>
        </div>
      ),
      status:
        rate >= 100 ? (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
            On target
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
            Building
          </span>
        ),
      action: goal.action,
    };
  });

  const requirementRows = requirementDefinitions.map((requirement) => {
    const complete = applications.filter((item) =>
      completeRequirement(item, requirement.key),
    ).length;
    const missing = Math.max(0, total - complete);
    const rate = total > 0 ? (complete / total) * 100 : 0;
    const missingApplicants = applications
      .filter((item) => !completeRequirement(item, requirement.key))
      .slice(0, 5)
      .map((item) => item.full_name || item.email || item.id)
      .join(", ");

    return {
      requirement: <span className="font-black text-slate-950">{requirement.label}</span>,
      complete: number(complete),
      missing: number(missing),
      completion: (
        <div className="min-w-[180px]">
          <div className="h-3 overflow-hidden rounded-full bg-amber-50">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.max(3, clampPercent(rate))}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-black text-slate-500">{percent(rate)}</p>
        </div>
      ),
      missing_applicants: missingApplicants || "None",
      action: requirement.action,
    };
  });

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="overflow-hidden rounded-[34px] border border-amber-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-emerald-500 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <Link
                  href={adminRoutes.programs}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/30 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-white"
                >
                  <ArrowLeft size={17} />
                  Back to Program Operations
                </Link>

                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                  Admin / Programs / Student Hire
                </p>

                <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                  Student Hire Program Ops
                </h1>

                <p className="mt-4 max-w-4xl text-base font-bold leading-7 text-slate-900 sm:text-lg">
                  Visualize the student applicant pipeline: who we support,
                  partner sources, goals, requirements, top 5s, sorted ledgers,
                  and export-ready reporting for easy extra-cash student growth.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={adminRoutes.studentApplications}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
                >
                  <UserCheck size={17} />
                  Review Student Applicants
                </Link>

                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
                  download="sitguru-student-hire-ops.csv"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-950/20 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-50"
                >
                  <Download size={17} />
                  Export CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">
            Supabase returned: {error}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<UsersRound size={22} />}
            label="Applications"
            value={number(total)}
            detail="Total Student Hire applicants"
            href={adminRoutes.studentApplications}
          />

          <StatCard
            icon={<Search size={22} />}
            label="Pending Review"
            value={number(pending)}
            detail="New, reviewing, contacted, or missing info"
          />

          <StatCard
            icon={<Sparkles size={22} />}
            label="Onboarding"
            value={number(onboarding)}
            detail="Students moving into next steps"
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Checkr Pending"
            value={number(checkrPending)}
            detail="Background check workflow"
          />

          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Approved"
            value={number(approved)}
            detail={`${percent(conversionRate)} approval conversion`}
          />

          <StatCard
            icon={<FileText size={22} />}
            label="Resume/Profile"
            value={number(resumeProvided)}
            detail={`${percent(total > 0 ? (resumeProvided / total) * 100 : 0)} complete`}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Who it supports"
            title="Student applicant audience breakdown"
            description="Track who is applying, where they go to school, when they can earn, and which services they want to offer."
            icon={<GraduationCap size={24} />}
          />

          <div className="mb-5 flex flex-wrap gap-2">
            {studentAudiences.map((audience) => (
              <span
                key={audience}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900"
              >
                {audience}
              </span>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <TopFiveCard
              title="Schools"
              subtitle="Most common school or program entries."
              items={schools}
            />
            <TopFiveCard
              title="Student Status"
              subtitle="Student type, recent grad, summer worker, or status."
              items={studentStatuses}
            />
            <TopFiveCard
              title="Availability Windows"
              subtitle="After class, weekend, break, summer, or custom availability."
              items={graduationWindows.length ? graduationWindows : availability}
            />
            <TopFiveCard
              title="Services"
              subtitle="Most selected ways students want to earn."
              items={services}
            />
            <TopFiveCard
              title="ZIP Codes"
              subtitle="Where student applicants are located."
              items={zips}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Partner sources"
            title="Student referral and partner source leaderboard"
            description="See which schools, clubs, community partners, campaigns, and referral sources are bringing in student applicants."
            icon={<Trophy size={24} />}
          />

          <div className="mb-5 flex flex-wrap gap-2">
            {studentPartnerSources.map((source) => (
              <span
                key={source}
                className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900"
              >
                {source}
              </span>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <TopFiveCard
              title="Referral Sources"
              subtitle="Top partner or referral entries."
              items={sources}
            />
            <TopFiveCard
              title="States"
              subtitle="State distribution by applicant."
              items={states}
            />
            <TopFiveCard
              title="Availability"
              subtitle="When students say they can earn."
              items={availability}
            />
          </div>

          <div className="mt-5">
            <BreakdownLedger
              title="Partner/source ledger"
              columns={[
                { key: "source", label: "Partner/source" },
                { key: "applications", label: "Applications" },
                { key: "pending", label: "Pending" },
                { key: "onboarding", label: "Onboarding" },
                { key: "approved", label: "Approved" },
                { key: "checkr", label: "Checkr" },
                { key: "conversion", label: "Conversion" },
                { key: "latest", label: "Latest" },
              ]}
              rows={partnerRows}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Program goals"
            title="Student Hire goal progress"
            description="Measure growth toward applications, onboarding, background readiness, approvals, and profile completeness."
            icon={<BarChart3 size={24} />}
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <ProgressLine
              label="Qualified applicants"
              value={total}
              total={50}
              detail="Target student applicant pool"
            />
            <ProgressLine
              label="Onboarding"
              value={onboarding}
              total={20}
              detail="Moved into next steps"
            />
            <ProgressLine
              label="Background consent"
              value={backgroundConsent}
              total={35}
              detail="Checkr readiness signal"
            />
            <ProgressLine
              label="Approved"
              value={approved}
              total={15}
              detail="Approved for next Guru steps"
            />
            <ProgressLine
              label="Services selected"
              value={servicesProvided}
              total={35}
              detail="Applicants selected earning services"
            />
          </div>

          <div className="mt-5">
            <BreakdownLedger
              title="Goal ledger"
              columns={[
                { key: "goal", label: "Goal" },
                { key: "metric", label: "Metric" },
                { key: "current", label: "Current" },
                { key: "target", label: "Target" },
                { key: "progress", label: "Progress" },
                { key: "status", label: "Status" },
                { key: "action", label: "Recommended action" },
              ]}
              rows={goalRows}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Requirements"
            title="Student applicant readiness requirements"
            description="Track what is complete, what is missing, and what admins should request before moving applicants forward."
            icon={<CheckCircle2 size={24} />}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {requirementDefinitions.map((requirement) => {
              const complete = applications.filter((item) =>
                completeRequirement(item, requirement.key),
              ).length;

              return (
                <ProgressLine
                  key={requirement.key}
                  label={requirement.label}
                  value={complete}
                  total={total}
                  detail={requirement.action}
                />
              );
            })}
          </div>

          <div className="mt-5">
            <BreakdownLedger
              title="Requirements ledger"
              columns={[
                { key: "requirement", label: "Requirement" },
                { key: "complete", label: "Complete" },
                { key: "missing", label: "Missing" },
                { key: "completion", label: "Completion" },
                { key: "missing_applicants", label: "Top missing applicants" },
                { key: "action", label: "Action" },
              ]}
              rows={requirementRows}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[#e3ece5] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#edf3ee] p-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                Sortable ledger
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Student applicant ledger
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Sorted by {sort.replace(/_/g, " ")} / {direction}. Export button includes this full dataset.
              </p>
            </div>

            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
              download="sitguru-student-hire-applicant-ledger.csv"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              <Download size={17} />
              Export Ledger
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] text-left">
              <thead className="bg-[#fbfcf9]">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <SortLink label="Submitted" sort="created_at" current={resolvedSearchParams} />
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <SortLink label="Name" sort="full_name" current={resolvedSearchParams} />
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <SortLink label="Status" sort="status" current={resolvedSearchParams} />
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <SortLink label="School" sort="school_name" current={resolvedSearchParams} />
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <SortLink label="Student status" sort="student_status" current={resolvedSearchParams} />
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Location
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Services
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Requirements
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Next Step
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf3ee]">
                {sortedApplications.length > 0 ? (
                  sortedApplications.map((application) => (
                    <tr key={application.id} className="align-top">
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {formatDate(application.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {application.full_name || "Unnamed applicant"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          ID: {application.id}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold leading-6 text-slate-700">
                        {application.email ? (
                          <a
                            href={`mailto:${application.email}`}
                            className="flex items-center gap-2 text-green-800 hover:underline"
                          >
                            <Mail size={14} />
                            {application.email}
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                        {application.phone ? (
                          <p className="mt-1">{application.phone}</p>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                            application.status,
                          )}`}
                        >
                          {statusLabel(application.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {application.school_name || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {application.student_status || "—"}
                        {application.graduation_year_or_availability ? (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {application.graduation_year_or_availability}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="mt-1 text-amber-700" />
                          <span>
                            {[application.city, application.state, application.zip_code]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {application.services_interested.length > 0 ? (
                            application.services_interested.map((service) => (
                              <span
                                key={service}
                                className="rounded-full border border-green-100 bg-green-50 px-2 py-1 text-xs font-black text-green-900"
                              >
                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm font-bold text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {application.resume_link || application.resume_url ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-800">
                              Resume
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                              Resume missing
                            </span>
                          )}

                          {application.background_check_consent ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-800">
                              Consent
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                              Consent missing
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold leading-6 text-slate-700">
                        {application.next_step || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      No Student Hire applicants found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}