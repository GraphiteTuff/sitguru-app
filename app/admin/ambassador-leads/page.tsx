import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type AmbassadorLeadsPageProps = {
  searchParams?: SearchParams;
};

type ZipLocation = {
  city: string;
  state: string;
  county: string;
  country: string;
};

type NormalizedLead = {
  raw: AnyRow;
  id: string;
  sourceTable: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  source: string;
  status: string;
  zipCode: string;
  city: string;
  state: string;
  county: string;
  country: string;
  location: string;
  notes: string;
  date: string | null;
  lastContacted: string | null;
  documents: {
    resumeUrl: string;
    resumeName: string;
    coverLetterUrl: string;
    coverLetterName: string;
    otherDocumentUrl: string;
    otherDocumentName: string;
  };
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  referrals: "/admin/referrals",
  partners: "/admin/partners",
  ambassadorLeads: "/admin/ambassador-leads",
};

const programOrder = ["Student Hire", "Community Hire", "Military Hire"];

const statusOrder = [
  "New",
  "Contacted",
  "Interested",
  "Signed Up",
  "Approved",
  "Not Moving Forward",
  "Archived",
];

const sourceOrder = [
  "PA CareerLink",
  "Indeed",
  "ZipRecruiter",
  "Handshake",
  "LinkedIn",
  "College / University",
  "Student Organization",
  "Military / Veteran Organization",
  "Referral",
  "Website",
  "Other",
];

const quickStatusActions = [
  {
    label: "Contacted",
    value: "contacted",
    tone:
      "bg-blue-50 text-blue-800 ring-blue-100 hover:bg-blue-100 hover:text-blue-900",
    icon: <MessageCircle size={13} />,
  },
  {
    label: "Interested",
    value: "interested",
    tone:
      "bg-amber-50 text-amber-800 ring-amber-100 hover:bg-amber-100 hover:text-amber-900",
    icon: <Star size={13} />,
  },
  {
    label: "Not Moving",
    value: "not_moving_forward",
    tone:
      "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200 hover:text-slate-900",
    icon: <FileText size={13} />,
  },
  {
    label: "Archive",
    value: "archived",
    tone:
      "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100 hover:text-red-800",
    icon: <Archive size={13} />,
  },
];

const zipLocationFallbacks: Record<string, ZipLocation> = {
  "01085": {
    city: "Westfield",
    state: "MA",
    county: "Hampden",
    country: "United States",
  },
  "14476": {
    city: "Kendall",
    state: "NY",
    county: "Orleans",
    country: "United States",
  },
  "18951": {
    city: "Quakertown",
    state: "PA",
    county: "Bucks",
    country: "United States",
  },
  "27217": {
    city: "Burlington",
    state: "NC",
    county: "Alamance",
    country: "United States",
  },
  "38242": {
    city: "Paris",
    state: "TN",
    county: "Henry",
    country: "United States",
  },
  "46001": {
    city: "Alexandria",
    state: "IN",
    county: "Madison",
    country: "United States",
  },
  "64850": {
    city: "Neosho",
    state: "MO",
    county: "Newton",
    country: "United States",
  },
  "77494": {
    city: "Katy",
    state: "TX",
    county: "Fort Bend",
    country: "United States",
  },
  "81643": {
    city: "Mesa",
    state: "CO",
    county: "Mesa",
    country: "United States",
  },
  "93535": {
    city: "Lancaster",
    state: "CA",
    county: "Los Angeles",
    country: "United States",
  },
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
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

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function normalizeStateCode(value: string) {
  return value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
}

function resolveLeadLocation({
  zipCode,
  city,
  state,
  county,
  country,
}: {
  zipCode: string;
  city: string;
  state: string;
  county: string;
  country: string;
}) {
  const cleanZip = normalizeZipCode(zipCode);
  const fallback = cleanZip ? zipLocationFallbacks[cleanZip] : undefined;

  return {
    zipCode: cleanZip || zipCode,
    city: city || fallback?.city || "",
    state: normalizeStateCode(state || fallback?.state || ""),
    county: county || fallback?.county || "",
    country: country || fallback?.country || "United States",
  };
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.applied_at) ||
    asString(row.submitted_at) ||
    asString(row.last_contacted_at) ||
    asString(row.date) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "lead_status", "application_status", "approval_status"],
    "new",
  ).toLowerCase();
}

function getReadableStatus(row: AnyRow) {
  const status = getStatus(row);

  if (status === "new") return "New";
  if (status === "pending") return "New";
  if (status === "submitted") return "New";
  if (status === "review") return "New";
  if (status === "in_review") return "New";
  if (status === "conditional_offer_sent") return "Contacted";
  if (status === "onboarding_sent") return "Contacted";
  if (status === "contacted") return "Contacted";
  if (status === "interested") return "Interested";
  if (status === "signed_up") return "Signed Up";
  if (status === "signup") return "Signed Up";
  if (status === "converted") return "Signed Up";
  if (status === "approved") return "Approved";
  if (status === "active") return "Approved";
  if (status === "not_moving_forward") return "Not Moving Forward";
  if (status === "not_a_fit") return "Not Moving Forward";
  if (status === "not_moving") return "Not Moving Forward";
  if (status === "declined") return "Not Moving Forward";
  if (status === "rejected") return "Not Moving Forward";
  if (status === "inactive") return "Not Moving Forward";
  if (status === "archived") return "Archived";

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

function normalizeStatus(status: string) {
  const value = status.toLowerCase().trim().replace(/\s+/g, "_");

  if (value === "new") return "new";
  if (value === "contacted") return "contacted";
  if (value === "interested") return "interested";
  if (value === "signed_up") return "signed_up";
  if (value === "approved") return "approved";
  if (value === "not_moving_forward") return "not_moving_forward";
  if (value === "not_moving") return "not_moving_forward";
  if (value === "declined") return "not_moving_forward";
  if (value === "archived") return "archived";

  return "new";
}

function mapLeadStatusToAmbassadorStatus(status: string) {
  if (status === "not_moving_forward") return "not_a_fit";
  if (status === "signed_up") return "onboarding_sent";
  if (status === "approved") return "active";
  if (status === "archived") return "archived";

  return status;
}


function hasColumn(row: AnyRow, key: string) {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function setFirstExistingColumn(
  patch: Record<string, unknown>,
  row: AnyRow,
  keys: string[],
  value: unknown,
) {
  for (const key of keys) {
    if (hasColumn(row, key)) {
      patch[key] = value;
      return true;
    }
  }

  return false;
}

function setNameColumns(
  patch: Record<string, unknown>,
  row: AnyRow,
  fullName: string,
) {
  const cleanName = fullName || null;

  if (setFirstExistingColumn(
    patch,
    row,
    [
      "full_name",
      "display_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
      "contact_name",
    ],
    cleanName,
  )) {
    return;
  }

  if (hasColumn(row, "first_name") || hasColumn(row, "last_name")) {
    const [firstName = "", ...lastNameParts] = fullName.split(" ").filter(Boolean);

    if (hasColumn(row, "first_name")) {
      patch.first_name = firstName || null;
    }

    if (hasColumn(row, "last_name")) {
      patch.last_name = lastNameParts.join(" ") || null;
    }
  }
}

function buildLeadUpdatePatch({
  row,
  fullName,
  email,
  phone,
  program,
  source,
  status,
  resolvedLocation,
  location,
  notes,
  resumeFileUrl,
  resumeFileName,
  coverLetterFileUrl,
  coverLetterFileName,
  otherDocumentFileUrl,
  otherDocumentFileName,
  actionNote,
}: {
  row: AnyRow;
  fullName?: string;
  email?: string;
  phone?: string;
  program?: string;
  source?: string;
  status?: string;
  resolvedLocation?: ZipLocation & { zipCode: string };
  location?: string;
  notes?: string;
  resumeFileUrl?: string;
  resumeFileName?: string;
  coverLetterFileUrl?: string;
  coverLetterFileName?: string;
  otherDocumentFileUrl?: string;
  otherDocumentFileName?: string;
  actionNote?: string;
}) {
  const patch: Record<string, unknown> = {};

  if (fullName !== undefined) {
    setNameColumns(patch, row, fullName);
  }

  if (email !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["email", "lead_email", "applicant_email", "candidate_email", "contact_email"],
      email || null,
    );
  }

  if (phone !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["phone", "phone_number", "mobile", "lead_phone", "applicant_phone"],
      phone || null,
    );
  }

  if (program !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["program", "program_name", "program_type", "lead_program"],
      program || null,
    );
  }

  if (source !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["source", "lead_source", "signup_source", "utm_source", "referral_source"],
      source || null,
    );
  }

  if (status !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["status", "lead_status", "application_status", "approval_status"],
      status || "new",
    );
  }

  if (location !== undefined) {
    setFirstExistingColumn(patch, row, ["location", "market", "area"], location === "—" ? null : location);
  }

  if (resolvedLocation) {
    setFirstExistingColumn(
      patch,
      row,
      ["zip_code", "postal_code", "zip", "postcode"],
      resolvedLocation.zipCode || null,
    );
    setFirstExistingColumn(
      patch,
      row,
      ["city", "service_city", "location_city"],
      resolvedLocation.city || null,
    );
    setFirstExistingColumn(
      patch,
      row,
      ["state", "service_state", "location_state"],
      resolvedLocation.state || null,
    );
    setFirstExistingColumn(
      patch,
      row,
      ["county", "service_county", "location_county"],
      resolvedLocation.county || null,
    );
    setFirstExistingColumn(
      patch,
      row,
      ["country", "service_country", "location_country"],
      resolvedLocation.country || null,
    );
  }

  if (notes !== undefined || actionNote) {
    const nextNotes = actionNote ? concatNote(notes ?? getNotes(row), actionNote) : notes;
    setFirstExistingColumn(
      patch,
      row,
      ["notes", "message", "comments", "description"],
      nextNotes || null,
    );
  }

  if (resumeFileUrl !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["resume_file_url", "resume_url", "resume_link", "resume"],
      resumeFileUrl || null,
    );
  }

  if (resumeFileName !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["resume_file_name", "resume_name"],
      resumeFileName || null,
    );
  }

  if (coverLetterFileUrl !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["cover_letter_file_url", "cover_letter_url", "cover_letter_link", "cover_letter"],
      coverLetterFileUrl || null,
    );
  }

  if (coverLetterFileName !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["cover_letter_file_name", "cover_letter_name"],
      coverLetterFileName || null,
    );
  }

  if (otherDocumentFileUrl !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      [
        "other_document_file_url",
        "other_document_url",
        "supporting_document_url",
        "supporting_documents_url",
        "document_url",
        "documents_url",
      ],
      otherDocumentFileUrl || null,
    );
  }

  if (otherDocumentFileName !== undefined) {
    setFirstExistingColumn(
      patch,
      row,
      ["other_document_file_name", "other_document_name", "document_name"],
      otherDocumentFileName || null,
    );
  }

  const now = new Date().toISOString();

  if (status !== undefined) {
    if (hasColumn(row, "archived_at")) {
      patch.archived_at = status === "archived" ? now : null;
    }

    if (hasColumn(row, "archived_reason")) {
      patch.archived_reason =
        status === "archived"
          ? "Archived from Ambassador Leads page. Retained for applicant recordkeeping."
          : null;
    }

    if (status === "contacted") {
      if (hasColumn(row, "last_contacted_at")) {
        patch.last_contacted_at = now;
      }

      if (hasColumn(row, "contacted_at")) {
        patch.contacted_at = now;
      }
    }
  }

  if (hasColumn(row, "updated_at")) {
    patch.updated_at = now;
  }

  return patch;
}

function getPipelineActionNote(status: string, leadName: string) {
  if (status === "contacted") {
    return `Pipeline update: ${leadName} was marked contacted from the Ambassador Leads page.`;
  }

  if (status === "interested") {
    return `Pipeline update: ${leadName} was marked interested from the Ambassador Leads page.`;
  }

  if (status === "not_moving_forward") {
    return `Pipeline update: ${leadName} was marked not moving forward from the Ambassador Leads page. Retain applicant record for recordkeeping.`;
  }

  if (status === "archived") {
    return `Archive update: ${leadName} was archived from the Ambassador Leads page. Retained for applicant recordkeeping. Do not continue outreach or onboarding unless restored.`;
  }

  return `Pipeline update: ${leadName} status changed to ${status}.`;
}

const deletableLeadTables = [
  "ambassador_leads",
  "ambassadors",
  "partner_applications",
  "network_partner_leads",
  "network_program_participants",
  "launch_signups",
  "launch_waitlist",
  "program_applications",
] as const;

function isDeletableLeadTable(
  value: string,
): value is (typeof deletableLeadTables)[number] {
  return deletableLeadTables.includes(
    value as (typeof deletableLeadTables)[number],
  );
}

function withSourceTable(
  row: AnyRow,
  sourceTable: (typeof deletableLeadTables)[number],
) {
  return {
    ...row,
    __source_table: sourceTable,
  };
}

function getDisplayName(row: AnyRow, fallback = "Ambassador Lead") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
      "contact_name",
      "email",
    ],
    fallback,
  );
}

function getEmail(row: AnyRow) {
  return getText(
    row,
    [
      "email",
      "lead_email",
      "applicant_email",
      "candidate_email",
      "contact_email",
    ],
    "—",
  );
}

function getPhone(row: AnyRow) {
  return getText(
    row,
    ["phone", "phone_number", "mobile", "lead_phone", "applicant_phone"],
    "—",
  );
}

function getZipCode(row: AnyRow) {
  return getText(row, ["zip_code", "postal_code", "zip", "postcode"], "");
}

function getCity(row: AnyRow) {
  return getText(row, ["city", "service_city", "location_city"], "");
}

function getState(row: AnyRow) {
  return getText(row, ["state", "service_state", "location_state"], "");
}

function getCounty(row: AnyRow) {
  return getText(row, ["county", "service_county", "location_county"], "");
}

function getCountry(row: AnyRow) {
  return getText(row, ["country", "service_country", "location_country"], "");
}

function buildLocationDisplay({
  city,
  state,
  zipCode,
  county,
  country,
  fallback,
}: {
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  country?: string;
  fallback?: string;
}) {
  const cityStateZip = [city, state].filter(Boolean).join(", ");
  const primary = [cityStateZip, zipCode].filter(Boolean).join(" ");
  const secondary = [county, country].filter(Boolean).join(", ");

  if (primary && secondary) return `${primary} • ${secondary}`;
  if (primary) return primary;
  if (secondary) return secondary;

  return fallback || "—";
}

function getLocation(row: AnyRow) {
  const zipCode = getZipCode(row);
  const resolvedLocation = resolveLeadLocation({
    zipCode,
    city: getCity(row),
    state: getState(row),
    county: getCounty(row),
    country: getCountry(row),
  });
  const location = getText(row, ["location", "market", "area"]);

  return buildLocationDisplay({
    city: resolvedLocation.city,
    state: resolvedLocation.state,
    zipCode: resolvedLocation.zipCode,
    county: resolvedLocation.county,
    country: resolvedLocation.country,
    fallback: location,
  });
}

function getNotes(row: AnyRow) {
  return getText(
    row,
    ["notes", "message", "interest", "comments", "description"],
    "No notes yet.",
  );
}

function getDocumentUrl(row: AnyRow, keys: string[]) {
  const value = getText(row, keys);

  if (!value) return "";

  return value;
}

function getDocumentName(row: AnyRow, keys: string[], fallback: string) {
  return getText(row, keys, fallback);
}

function getLeadDocuments(row: AnyRow) {
  const resumeUrl = getDocumentUrl(row, [
    "resume_file_url",
    "resume_url",
    "resume_link",
    "resume",
  ]);
  const coverLetterUrl = getDocumentUrl(row, [
    "cover_letter_file_url",
    "cover_letter_url",
    "cover_letter_link",
    "cover_letter",
  ]);
  const otherDocumentUrl = getDocumentUrl(row, [
    "other_document_file_url",
    "other_document_url",
    "supporting_document_url",
    "supporting_documents_url",
    "document_url",
    "documents_url",
  ]);

  return {
    resumeUrl,
    resumeName: getDocumentName(
      row,
      ["resume_file_name", "resume_name"],
      "Resume",
    ),
    coverLetterUrl,
    coverLetterName: getDocumentName(
      row,
      ["cover_letter_file_name", "cover_letter_name"],
      "Cover Letter",
    ),
    otherDocumentUrl,
    otherDocumentName: getDocumentName(
      row,
      ["other_document_file_name", "other_document_name", "document_name"],
      "Other Document",
    ),
  };
}

function getCombinedText(row: AnyRow) {
  return [
    getText(row, ["program", "program_name", "program_type"]),
    getText(row, ["participant_type", "partner_type", "type", "role"]),
    getText(row, ["source", "lead_source", "signup_source", "utm_source"]),
    getText(row, ["campaign", "campaign_name", "utm_campaign"]),
    getText(row, ["title", "name", "interest", "notes", "message"]),
    getText(row, ["position", "job_title", "posting_title"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getParticipantType(row: AnyRow) {
  return getText(
    row,
    ["participant_type", "partner_type", "program_type", "type", "role"],
    "",
  ).toLowerCase();
}

function getProgramLabel(row: AnyRow) {
  const text = getCombinedText(row);
  const explicitProgram = getText(
    row,
    ["program", "program_name", "program_type", "lead_program"],
    "",
  );

  if (programOrder.includes(explicitProgram)) return explicitProgram;

  if (text.includes("student")) return "Student Hire";
  if (text.includes("community")) return "Community Hire";

  if (
    text.includes("military") ||
    text.includes("veteran") ||
    text.includes("active-duty") ||
    text.includes("active duty") ||
    text.includes("guard") ||
    text.includes("reserve")
  ) {
    return "Military Hire";
  }

  return "Community Hire";
}

function getSourceLabel(row: AnyRow) {
  const source = getText(
    row,
    ["source", "lead_source", "signup_source", "utm_source", "referral_source"],
    "",
  );
  const text = `${source} ${getCombinedText(row)}`.toLowerCase();

  if (text.includes("careerlink") || text.includes("career link")) {
    return "PA CareerLink";
  }
  if (text.includes("indeed")) return "Indeed";
  if (text.includes("ziprecruiter") || text.includes("zip recruiter")) {
    return "ZipRecruiter";
  }
  if (text.includes("handshake")) return "Handshake";
  if (text.includes("linkedin") || text.includes("linked in")) return "LinkedIn";
  if (
    text.includes("college") ||
    text.includes("university") ||
    text.includes("campus")
  ) {
    return "College / University";
  }
  if (
    text.includes("student organization") ||
    text.includes("student org") ||
    text.includes("club") ||
    text.includes("fraternity") ||
    text.includes("sorority")
  ) {
    return "Student Organization";
  }
  if (
    text.includes("military") ||
    text.includes("veteran") ||
    text.includes("active-duty") ||
    text.includes("active duty") ||
    text.includes("guard") ||
    text.includes("reserve")
  ) {
    return "Military / Veteran Organization";
  }
  if (text.includes("referral")) return "Referral";
  if (text.includes("website") || text.includes("site")) return "Website";

  return source || "Other";
}

function isAmbassadorLead(row: AnyRow) {
  const text = getCombinedText(row);
  const participantType = getParticipantType(row);

  return (
    text.includes("ambassador") ||
    text.includes("careerlink") ||
    text.includes("career link") ||
    text.includes("student hire") ||
    text.includes("community hire") ||
    text.includes("military hire") ||
    text.includes("veteran") ||
    participantType.includes("ambassador")
  );
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Ambassador leads query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Ambassador leads query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function mergeRows(...groups: AnyRow[][]) {
  const merged: AnyRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const sourceTable = getText(row, ["__source_table"], "unknown");
      const id = getText(row, ["id"]);
      const fallbackKey = `${sourceTable}:${getEmail(row)}:${getDisplayName(
        row,
      )}:${getDate(row)}:${merged.length}`;
      const key = id ? `${sourceTable}:${id}` : fallbackKey;

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(row);
    }
  }

  return merged;
}

function formatPhoneForStorage(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value.trim();
}

async function createAmbassadorLead(formData: FormData) {
  "use server";

  const fullName = asString(formData.get("full_name"));
  const email = asString(formData.get("email"));
  const phone = formatPhoneForStorage(asString(formData.get("phone")));
  const program = asString(formData.get("program"));
  const source = asString(formData.get("source"));
  const status = normalizeStatus(asString(formData.get("status")));
  const resolvedLocation = resolveLeadLocation({
    zipCode: asString(formData.get("zip_code")),
    city: asString(formData.get("city")),
    state: asString(formData.get("state")),
    county: asString(formData.get("county")),
    country: asString(formData.get("country")),
  });
  const location = buildLocationDisplay({
    city: resolvedLocation.city,
    state: resolvedLocation.state,
    zipCode: resolvedLocation.zipCode,
    county: resolvedLocation.county,
    country: resolvedLocation.country,
  });
  const notes = asString(formData.get("notes"));
  const resumeFileUrl = asString(formData.get("resume_file_url"));
  const resumeFileName = asString(formData.get("resume_file_name"));
  const coverLetterFileUrl = asString(formData.get("cover_letter_file_url"));
  const coverLetterFileName = asString(formData.get("cover_letter_file_name"));
  const otherDocumentFileUrl = asString(formData.get("other_document_file_url"));
  const otherDocumentFileName = asString(
    formData.get("other_document_file_name"),
  );

  if (!fullName && !email && !phone) {
    redirect(`${adminRoutes.ambassadorLeads}?created=missing`);
  }

  const { error } = await supabaseAdmin.from("ambassador_leads").insert({
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    program,
    source,
    status,
    location: location === "—" ? null : location,
    zip_code: resolvedLocation.zipCode || null,
    city: resolvedLocation.city || null,
    state: resolvedLocation.state || null,
    county: resolvedLocation.county || null,
    country: resolvedLocation.country || null,
    notes: notes || null,
    resume_file_url: resumeFileUrl || null,
    resume_file_name: resumeFileName || null,
    cover_letter_file_url: coverLetterFileUrl || null,
    cover_letter_file_name: coverLetterFileName || null,
    other_document_file_url: otherDocumentFileUrl || null,
    other_document_file_name: otherDocumentFileName || null,
    archived_at: status === "archived" ? new Date().toISOString() : null,
    archived_reason:
      status === "archived"
        ? "Lead was created directly into archived status."
        : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Unable to create ambassador lead:", error);
    redirect(`${adminRoutes.ambassadorLeads}?created=error`);
  }

  redirect(`${adminRoutes.ambassadorLeads}?created=success`);
}

async function updateAmbassadorLead(formData: FormData) {
  "use server";

  const leadId = asString(formData.get("lead_id"));
  const sourceTable = asString(formData.get("source_table")) || "ambassador_leads";
  const fullName = asString(formData.get("full_name"));
  const email = asString(formData.get("email"));
  const phone = formatPhoneForStorage(asString(formData.get("phone")));
  const program = asString(formData.get("program"));
  const source = asString(formData.get("source"));
  const status = normalizeStatus(asString(formData.get("status")));
  const resolvedLocation = resolveLeadLocation({
    zipCode: asString(formData.get("zip_code")),
    city: asString(formData.get("city")),
    state: asString(formData.get("state")),
    county: asString(formData.get("county")),
    country: asString(formData.get("country")),
  });
  const location = buildLocationDisplay({
    city: resolvedLocation.city,
    state: resolvedLocation.state,
    zipCode: resolvedLocation.zipCode,
    county: resolvedLocation.county,
    country: resolvedLocation.country,
  });
  const notes = asString(formData.get("notes"));
  const resumeFileUrl = asString(formData.get("resume_file_url"));
  const resumeFileName = asString(formData.get("resume_file_name"));
  const coverLetterFileUrl = asString(formData.get("cover_letter_file_url"));
  const coverLetterFileName = asString(formData.get("cover_letter_file_name"));
  const otherDocumentFileUrl = asString(formData.get("other_document_file_url"));
  const otherDocumentFileName = asString(
    formData.get("other_document_file_name"),
  );

  if (!leadId || !isDeletableLeadTable(sourceTable)) {
    redirect(`${adminRoutes.ambassadorLeads}?updated=missing`);
  }

  const { data: existingLead, error: fetchError } = await supabaseAdmin
    .from(sourceTable)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError || !existingLead) {
    console.warn("Unable to find ambassador lead for edit:", fetchError);
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        fetchError?.message || `Unable to find this row in ${sourceTable}.`,
      )}`,
    );
  }

  const isPrimaryAmbassadorLead = sourceTable === "ambassador_leads";

  const leadPatch = buildLeadUpdatePatch({
    row: existingLead as AnyRow,
    fullName,
    email,
    phone,
    // Only the ambassador_leads table uses the SitGuru HR program labels
    // like "Student Hire" and "Community Hire". Source tables such as
    // program_applications can have their own database constraints, so do
    // not overwrite their program/source fields from this HR pipeline view.
    program: isPrimaryAmbassadorLead ? program : undefined,
    source: isPrimaryAmbassadorLead ? source : undefined,
    status,
    resolvedLocation,
    location,
    notes,
    resumeFileUrl,
    resumeFileName,
    coverLetterFileUrl,
    coverLetterFileName,
    otherDocumentFileUrl,
    otherDocumentFileName,
  });

  if (!Object.keys(leadPatch).length) {
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        `No editable columns were found on ${sourceTable} for this row.`,
      )}`,
    );
  }

  const { error } = await supabaseAdmin
    .from(sourceTable)
    .update(leadPatch)
    .eq("id", leadId);

  if (error) {
    console.warn("Unable to update ambassador lead:", error);
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(`${adminRoutes.ambassadorLeads}?updated=success`);
}

async function updateAmbassadorLeadPipelineStatus(formData: FormData) {
  "use server";

  const leadId = asString(formData.get("lead_id"));
  const sourceTable = asString(formData.get("source_table")) || "ambassador_leads";
  const nextStatus = normalizeStatus(asString(formData.get("next_status")));

  if (!leadId || !isDeletableLeadTable(sourceTable)) {
    redirect(`${adminRoutes.ambassadorLeads}?updated=missing`);
  }

  const { data: existingLead, error: fetchError } = await supabaseAdmin
    .from(sourceTable)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError || !existingLead) {
    console.warn("Unable to find ambassador lead for status update:", fetchError);
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        fetchError?.message || `Unable to find this row in ${sourceTable}.`,
      )}`,
    );
  }

  const leadRow = existingLead as AnyRow;
  const leadName = getDisplayName(leadRow, "Ambassador Lead");
  const email = getEmail(leadRow);
  const referralCode = getText(leadRow, ["referral_code"]);
  const actionNote = getPipelineActionNote(nextStatus, leadName);

  const leadPatch = buildLeadUpdatePatch({
    row: leadRow,
    status: nextStatus,
    actionNote,
  });

  if (!Object.keys(leadPatch).length) {
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        `No editable status column was found on ${sourceTable} for this row.`,
      )}`,
    );
  }

  const { error: leadUpdateError } = await supabaseAdmin
    .from(sourceTable)
    .update(leadPatch)
    .eq("id", leadId);

  if (leadUpdateError) {
    console.warn("Unable to update ambassador lead status:", leadUpdateError);
    redirect(
      `${adminRoutes.ambassadorLeads}?updated=error&message=${encodeURIComponent(
        leadUpdateError.message,
      )}`,
    );
  }

  const ambassadorStatus = mapLeadStatusToAmbassadorStatus(nextStatus);

  const ambassadorPatch: Record<string, unknown> = {
    status: ambassadorStatus,
    updated_at: new Date().toISOString(),
  };

  const ambassadorFilters = [
    referralCode ? `referral_code.eq.${referralCode}` : "",
    email && email !== "—" ? `email.eq.${email}` : "",
    leadName ? `full_name.eq.${leadName}` : "",
  ]
    .filter(Boolean)
    .join(",");

  if (ambassadorFilters) {
    const { error: ambassadorUpdateError } = await supabaseAdmin
      .from("ambassadors")
      .update(ambassadorPatch)
      .or(ambassadorFilters);

    if (ambassadorUpdateError) {
      console.warn(
        "Ambassador mirror update skipped after lead update succeeded:",
        ambassadorUpdateError,
      );
    }
  }

  redirect(`${adminRoutes.ambassadorLeads}?updated=success`);
}

function concatNote(existingNotes: string, note: string) {
  const cleanExisting = existingNotes === "No notes yet." ? "" : existingNotes;

  return [cleanExisting, note].filter(Boolean).join("\n\n");
}

async function deleteAmbassadorLead(formData: FormData) {
  "use server";

  const leadId = asString(formData.get("lead_id"));
  const sourceTable = asString(formData.get("source_table")) || "ambassador_leads";
  const leadName = asString(formData.get("lead_name"));

  if (!leadId || !isDeletableLeadTable(sourceTable)) {
    redirect(`${adminRoutes.ambassadorLeads}?deleted=missing`);
  }

  const { data: existingLead, error: fetchError } = await supabaseAdmin
    .from(sourceTable)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError || !existingLead) {
    console.warn("Unable to find ambassador lead before archive:", fetchError);
    redirect(`${adminRoutes.ambassadorLeads}?deleted=error`);
  }

  const archivedAt = new Date().toISOString();

  const { error: archiveError } = await supabaseAdmin
    .from("ambassador_leads_archive")
    .insert({
      source_table: sourceTable,
      source_id: leadId,
      full_name: getDisplayName(
        existingLead as AnyRow,
        leadName || "Ambassador Lead",
      ),
      email: getEmail(existingLead as AnyRow),
      phone: getPhone(existingLead as AnyRow),
      program: getProgramLabel(existingLead as AnyRow),
      source: getSourceLabel(existingLead as AnyRow),
      status: getReadableStatus(existingLead as AnyRow),
      location: getLocation(existingLead as AnyRow),
      notes: getNotes(existingLead as AnyRow),
      archived_payload: existingLead,
      archived_reason: "Deleted from Ambassador Leads pipeline",
      archived_at: archivedAt,
      created_at: archivedAt,
    });

  if (archiveError) {
    console.warn("Unable to archive ambassador lead before delete:", archiveError);
    redirect(`${adminRoutes.ambassadorLeads}?deleted=archive_error`);
  }

  const { error: deleteError } = await supabaseAdmin
    .from(sourceTable)
    .delete()
    .eq("id", leadId);

  if (deleteError) {
    console.warn("Unable to delete ambassador lead after archive:", deleteError);
    redirect(`${adminRoutes.ambassadorLeads}?deleted=error`);
  }

  redirect(`${adminRoutes.ambassadorLeads}?deleted=success`);
}

async function getAmbassadorLeadData() {
  const [
    ambassadorLeadsResult,
    partnerApplicationsResult,
    networkPartnerLeadsResult,
    networkParticipantsResult,
    launchSignupsResult,
    launchWaitlistResult,
    programApplicationsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("ambassador_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "ambassador_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_partner_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_program_participants")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_program_participants",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("program_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "program_applications",
    ),
  ]);

  const ambassadorLeads = ((ambassadorLeadsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const partnerApplications = (
    (partnerApplicationsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const networkPartnerLeads = (
    (networkPartnerLeadsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const networkParticipants = (
    (networkParticipantsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const launchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const launchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const programApplications = (
    (programApplicationsResult.data || []) as AnyRow[]
  ).filter(Boolean);

  const allLeads = mergeRows(
    ambassadorLeads.map((row) => withSourceTable(row, "ambassador_leads")),
    partnerApplications
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "partner_applications")),
    networkPartnerLeads
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "network_partner_leads")),
    networkParticipants
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "network_program_participants")),
    launchSignups
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "launch_signups")),
    launchWaitlist
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "launch_waitlist")),
    programApplications
      .filter(isAmbassadorLead)
      .map((row) => withSourceTable(row, "program_applications")),
  ).sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const normalizedLeads = allLeads.map((lead) => {
    const rawZipCode = getZipCode(lead);
    const resolvedLocation = resolveLeadLocation({
      zipCode: rawZipCode,
      city: getCity(lead),
      state: getState(lead),
      county: getCounty(lead),
      country: getCountry(lead),
    });

    return {
      raw: lead,
      id: getText(lead, ["id"]),
      sourceTable: getText(lead, ["__source_table"], "ambassador_leads"),
      name: getDisplayName(lead),
      email: getEmail(lead),
      phone: formatPhoneForStorage(getPhone(lead)),
      program: getProgramLabel(lead),
      source: getSourceLabel(lead),
      status: getReadableStatus(lead),
      zipCode: resolvedLocation.zipCode,
      city: resolvedLocation.city,
      state: resolvedLocation.state,
      county: resolvedLocation.county,
      country: resolvedLocation.country || "United States",
      location: getLocation(lead),
      notes: getNotes(lead),
      date: getDate(lead),
      lastContacted:
        asString(lead.last_contacted_at) ||
        asString(lead.contacted_at) ||
        asString(lead.updated_at) ||
        null,
      documents: getLeadDocuments(lead),
    };
  });

  const metrics = {
    total: normalizedLeads.length,
    careerLink: normalizedLeads.filter((lead) => lead.source === "PA CareerLink")
      .length,
    student: normalizedLeads.filter((lead) => lead.program === "Student Hire")
      .length,
    community: normalizedLeads.filter((lead) => lead.program === "Community Hire")
      .length,
    military: normalizedLeads.filter((lead) => lead.program === "Military Hire")
      .length,
    newCount: normalizedLeads.filter((lead) => lead.status === "New").length,
    contacted: normalizedLeads.filter((lead) => lead.status === "Contacted")
      .length,
    interested: normalizedLeads.filter((lead) => lead.status === "Interested")
      .length,
    signedUp: normalizedLeads.filter((lead) => lead.status === "Signed Up")
      .length,
    approved: normalizedLeads.filter((lead) => lead.status === "Approved").length,
    notMovingForward: normalizedLeads.filter(
      (lead) => lead.status === "Not Moving Forward",
    ).length,
    archived: normalizedLeads.filter((lead) => lead.status === "Archived").length,
    recent: normalizedLeads.filter((lead) => isWithinLastDays(lead.date, 14))
      .length,
  };

  return {
    leads: normalizedLeads,
    metrics,
  };
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const created = searchParams?.created;

  if (created === "success") {
    return {
      title: "Lead added",
      message: "The ambassador lead was saved successfully.",
      tone: "success" as const,
    };
  }

  if (created === "missing") {
    return {
      title: "Lead not added",
      message: "Add at least a name, email, or phone number before saving.",
      tone: "warning" as const,
    };
  }

  if (created === "error") {
    return {
      title: "Lead not saved",
      message:
        "The page is ready, but the ambassador_leads table may not have all required columns yet.",
      tone: "warning" as const,
    };
  }

  const updated = searchParams?.updated;

  if (updated === "success") {
    return {
      title: "Lead updated",
      message: "The ambassador lead was updated successfully.",
      tone: "success" as const,
    };
  }

  if (updated === "missing") {
    return {
      title: "Lead not updated",
      message: "The lead ID or source table was missing.",
      tone: "warning" as const,
    };
  }

  if (updated === "error") {
    const message = searchParams?.message;
    const readableMessage = Array.isArray(message) ? message[0] : message;

    return {
      title: "Lead not updated",
      message:
        readableMessage ||
        "The lead could not be updated. The exact Supabase error was not returned.",
      tone: "warning" as const,
    };
  }

  const deleted = searchParams?.deleted;

  if (deleted === "success") {
    return {
      title: "Lead deleted and archived",
      message:
        "The ambassador lead was removed from the active pipeline and copied to the archive for tracking.",
      tone: "success" as const,
    };
  }

  if (deleted === "archive_error") {
    return {
      title: "Lead not deleted",
      message:
        "The lead was not deleted because it could not be archived first. Confirm the ambassador_leads_archive table exists.",
      tone: "warning" as const,
    };
  }

  if (deleted === "error") {
    return {
      title: "Lead not deleted",
      message: "The lead could not be deleted from Supabase.",
      tone: "warning" as const,
    };
  }

  return null;
}

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) return value[0] || "";

  return value || "";
}

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}

function applyLeadFilters(
  leads: NormalizedLead[],
  filters: {
    query: string;
    program: string;
    source: string;
    status: string;
    documents: string;
  },
) {
  const query = normalizeFilterValue(filters.query);
  const program = normalizeFilterValue(filters.program);
  const source = normalizeFilterValue(filters.source);
  const status = normalizeFilterValue(filters.status);
  const documents = normalizeFilterValue(filters.documents);

  return leads.filter((lead) => {
    const searchable = [
      lead.name,
      lead.email,
      lead.phone,
      lead.program,
      lead.source,
      lead.status,
      lead.city,
      lead.state,
      lead.county,
      lead.country,
      lead.location,
      lead.notes,
    ]
      .join(" ")
      .toLowerCase();

    const hasDocument =
      Boolean(lead.documents.resumeUrl) ||
      Boolean(lead.documents.coverLetterUrl) ||
      Boolean(lead.documents.otherDocumentUrl);

    if (query && !searchable.includes(query)) return false;
    if (program && normalizeFilterValue(lead.program) !== program) return false;
    if (source && normalizeFilterValue(lead.source) !== source) return false;
    if (status && normalizeFilterValue(lead.status) !== status) return false;
    if (documents === "with_documents" && !hasDocument) return false;
    if (documents === "missing_documents" && hasDocument) return false;

    return true;
  });
}

export default async function AmbassadorLeadsPage({
  searchParams,
}: AmbassadorLeadsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const data = await getAmbassadorLeadData();
  const pipelineFilters = {
    query: getSearchParamValue(resolvedSearchParams, "q"),
    program: getSearchParamValue(resolvedSearchParams, "program"),
    source: getSearchParamValue(resolvedSearchParams, "source"),
    status: getSearchParamValue(resolvedSearchParams, "status"),
    documents: getSearchParamValue(resolvedSearchParams, "documents"),
  };
  const filteredLeads = applyLeadFilters(data.leads, pipelineFilters);
  const filteredMetrics = {
    total: filteredLeads.length,
    student: filteredLeads.filter((lead) => lead.program === "Student Hire")
      .length,
    community: filteredLeads.filter((lead) => lead.program === "Community Hire")
      .length,
    military: filteredLeads.filter((lead) => lead.program === "Military Hire")
      .length,
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <Link
            href={adminRoutes.dashboard}
            className="mb-3 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl 2xl:text-[3.25rem] 2xl:leading-none">
              Ambassador Leads
            </h1>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-800">
              Hiring Pipeline
            </span>
          </div>

          <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-slate-600">
            Track Student Hire, Community Hire, and Military Hire ambassador
            applicants from Indeed, ZipRecruiter, PA CareerLink, social media, referrals,
            events, and website interest forms.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href={adminRoutes.programs}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <ClipboardList size={17} />
            Programs
          </Link>

          <Link
            href={adminRoutes.referrals}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
          >
            <Sparkles size={17} />
            Referrals
          </Link>
        </div>
      </div>

      {notice ? (
        <NoticeCard
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
        />
      ) : null}

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-gradient-to-r from-[#f7fbf4] via-white to-[#f7fbf4] p-4 sm:grid-cols-2 xl:grid-cols-6">
        <DataHealthTile label="Total Leads" value={number(data.metrics.total)} />
        <DataHealthTile
          label="PA CareerLink"
          value={number(data.metrics.careerLink)}
        />
        <DataHealthTile
          label="Student Hire"
          value={number(filteredMetrics.student)}
        />
        <DataHealthTile
          label="Community Hire"
          value={number(filteredMetrics.community)}
        />
        <DataHealthTile
          label="Military Hire"
          value={number(filteredMetrics.military)}
        />
        <DataHealthTile
          label="Recent 14 Days"
          value={number(data.metrics.recent)}
        />
      </section>

      <section className="grid w-full min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          title="New"
          value={number(data.metrics.newCount)}
          detail="Needs first review"
          icon={<Plus size={20} />}
        />
        <MetricCard
          title="Contacted"
          value={number(data.metrics.contacted)}
          detail="Outreach started"
          icon={<MessageCircle size={20} />}
        />
        <MetricCard
          title="Interested"
          value={number(data.metrics.interested)}
          detail="Warm candidate"
          icon={<Star size={20} />}
        />
        <MetricCard
          title="Signed Up"
          value={number(data.metrics.signedUp)}
          detail="Created SitGuru interest"
          icon={<UserCheck size={20} />}
        />
        <MetricCard
          title="Approved"
          value={number(data.metrics.approved)}
          detail="Ready to activate"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Not Moving"
          value={number(data.metrics.notMovingForward)}
          detail="Closed or declined"
          icon={<FileText size={20} />}
        />
        <MetricCard
          title="Archived"
          value={number(data.metrics.archived)}
          detail="Retained on file"
          icon={<Archive size={20} />}
        />
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Add Ambassador Lead
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Add hiring-focused ambassador applicants from PA CareerLink,
                Indeed, ZipRecruiter, Handshake, LinkedIn, schools, military organizations,
                referrals, and the SitGuru website.
              </p>
            </div>

            <form action={createAmbassadorLead} className="space-y-4">
              <FormField label="Lead name">
                <input
                  name="full_name"
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input
                    name="email"
                    type="email"
                    placeholder="name@email.com"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(XXX) XXX-XXXX"
                    data-phone-input="true"
                    maxLength={14}
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Program">
                  <select
                    name="program"
                    defaultValue="Student Hire"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {programOrder.map((program) => (
                      <option key={program}>{program}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Source">
                  <select
                    name="source"
                    defaultValue="Indeed"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {sourceOrder.map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <select
                    name="status"
                    defaultValue="New"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {statusOrder.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="ZIP code">
                  <input
                    name="zip_code"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="12345"
                    data-zip-input="true"
                    maxLength={10}
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="City">
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="City"
                    data-city-input="true"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>

                <FormField label="State">
                  <input
                    name="state"
                    autoComplete="address-level1"
                    placeholder="State"
                    data-state-input="true"
                    maxLength={2}
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="County">
                  <input
                    name="county"
                    placeholder="County"
                    data-county-input="true"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>

                <FormField label="Country">
                  <input
                    name="country"
                    autoComplete="country-name"
                    placeholder="United States"
                    defaultValue="United States"
                    data-country-input="true"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <p
                data-location-helper="true"
                className="rounded-2xl bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-900"
              >
                Enter a ZIP code to auto-fill city, state, county, and country.
                You can still edit any location field before saving.
              </p>

              <FormField label="Notes">
                <textarea
                  name="notes"
                  placeholder="Example: Applied through ZipRecruiter for Student Ambassador posting."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div className="rounded-[24px] border border-green-100 bg-green-50/70 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-green-950">
                      Applicant documents
                    </h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-green-900/70">
                      Paste a private Supabase Storage path or secure document
                      link. Resume buttons open through the admin-only viewer.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Resume path or link">
                    <input
                      name="resume_file_url"
                      placeholder="student-hire/resume.pdf"
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="Resume label">
                    <input
                      name="resume_file_name"
                      placeholder="Resume"
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="Cover letter link">
                    <input
                      name="cover_letter_file_url"
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="Cover letter label">
                    <input
                      name="cover_letter_file_name"
                      placeholder="Cover Letter"
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="Other document link">
                    <input
                      name="other_document_file_url"
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="Other document label">
                    <input
                      name="other_document_file_name"
                      placeholder="References, portfolio, transcript, etc."
                      className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <Plus size={18} />
                Save Lead
              </button>

              <p className="rounded-2xl bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-900">
                HR intake is connected to the{" "}
                <span className="font-black">ambassador_leads</span> table.
                Use quick buttons in the pipeline to move candidates to
                Contacted, Interested, Not Moving, Archived, or Restored without
                running SQL.
              </p>

              <AmbassadorLeadFormEnhancementScript />
            </form>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-8">
          <DashboardCard>
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Lead Pipeline
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Current ambassador leads grouped by program, source, status,
                  and last known contact information.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill label="Student Hire" />
                <StatusPill label="Community Hire" />
                <StatusPill label="Military Hire" />
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <ProgramMiniCard
                title="Student Hire"
                detail="Campus, school, and student outreach."
                value={number(filteredMetrics.student)}
                icon={<GraduationCap size={18} />}
              />
              <ProgramMiniCard
                title="Community Hire"
                detail="Neighborhood and local outreach."
                value={number(filteredMetrics.community)}
                icon={<Users size={18} />}
              />
              <ProgramMiniCard
                title="Military Hire"
                detail="Veterans, spouses, and service families."
                value={number(filteredMetrics.military)}
                icon={<ShieldCheck size={18} />}
              />
            </div>

            <PipelineFilterPanel
              filters={pipelineFilters}
              resultCount={filteredMetrics.total}
              totalCount={data.leads.length}
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1380px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">Lead</th>
                    <th className="pb-3">Program</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Documents</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.length ? (
                    filteredLeads.map((lead, index) => (
                      <Fragment
                        key={`${lead.sourceTable}-${lead.id || lead.name}-${lead.email}-${lead.date}-${index}`}
                      >
                        <tr className="border-b border-[#f1f5f2] align-top">
                          <td className="py-4">
                            <div className="flex items-start gap-3">
                              <Avatar name={lead.name} />
                              <div className="min-w-0">
                                <p className="font-black text-slate-950">
                                  {lead.name}
                                </p>
                                <p className="mt-1 line-clamp-2 max-w-[260px] text-xs font-semibold leading-5 text-slate-500">
                                  {lead.notes}
                                </p>
                                <PipelineProgressFlow status={lead.status} />
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <ProgramBadge program={lead.program} />
                          </td>

                          <td className="py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {lead.source}
                            </span>
                          </td>

                          <td className="py-4">
                            <LeadStatusBadge status={lead.status} />
                          </td>

                          <td className="py-4">
                            <div className="space-y-1.5">
                              <ContactLine
                                icon={<Mail size={13} />}
                                value={lead.email}
                              />
                              <ContactLine
                                icon={<Phone size={13} />}
                                value={lead.phone}
                              />
                            </div>
                          </td>

                          <td className="py-4">
                            <DocumentButtonGroup
                              leadId={lead.id}
                              documents={lead.documents}
                            />
                          </td>

                          <td className="py-4 font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} />
                              {lead.location}
                            </span>
                          </td>

                          <td className="py-4 font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={13} />
                              {formatDate(lead.date)}
                            </span>
                          </td>

                          <td className="py-4">
                            <div className="flex min-w-[170px] flex-col gap-2">
                              <a
                                href={`#edit-lead-${lead.id || index}`}
                                className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800 transition hover:bg-green-100"
                              >
                                Edit
                              </a>

                              <LeadQuickStatusButtons lead={lead} />

                              <details className="group relative">
                                <summary className="inline-flex cursor-pointer list-none items-center justify-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 transition hover:bg-red-100">
                                  <Trash2 size={12} />
                                  Delete
                                </summary>

                                <div className="absolute right-0 z-20 mt-2 w-[280px] rounded-2xl border border-red-100 bg-white p-4 text-left shadow-xl">
                                  <p className="text-sm font-black text-red-800">
                                    Are you sure you want to delete this lead?
                                  </p>
                                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                    For normal declined candidates, use Archive
                                    instead. Delete should only be used for fake,
                                    duplicate, or mistake records.
                                  </p>

                                  <form
                                    action={deleteAmbassadorLead}
                                    className="mt-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="lead_id"
                                      value={lead.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="source_table"
                                      value={lead.sourceTable}
                                    />
                                    <input
                                      type="hidden"
                                      name="lead_name"
                                      value={lead.name}
                                    />
                                    <button
                                      type="submit"
                                      className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700"
                                    >
                                      Yes, Delete and Archive Copy
                                    </button>
                                  </form>
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>

                        <tr
                          id={`edit-lead-${lead.id || index}`}
                          className="border-b border-[#f1f5f2]"
                        >
                          <td colSpan={9} className="bg-[#fbfcf9] px-4 py-5">
                            <PipelineEditForm lead={lead} />
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-10">
                        <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-8 text-center">
                          <Search
                            className="mx-auto mb-3 text-green-700"
                            size={32}
                          />
                          <h3 className="text-lg font-black text-green-950">
                            No matching ambassador leads found
                          </h3>
                          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/70">
                            Adjust the pipeline filters or clear them to view all
                            ambassador leads.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-4 lg:grid-cols-3">
        <DashboardCard>
          <ActionCard
            icon={<BriefcaseBusiness size={20} />}
            title="Indeed / ZipRecruiter / PA CareerLink Workflow"
            detail="Use this page to enter applicants after Indeed, ZipRecruiter, PA CareerLink, referral, or website leads come in."
            href={adminRoutes.ambassadorLeads}
            action="Stay here"
          />
        </DashboardCard>

        <DashboardCard>
          <ActionCard
            icon={<ClipboardList size={20} />}
            title="Program Command Center"
            detail="Review Student Hire, Community Hire, Military Hire, PawPerks, referrals, and growth programs."
            href={adminRoutes.programs}
            action="Open Programs"
          />
        </DashboardCard>

        <DashboardCard>
          <ActionCard
            icon={<ExternalLink size={20} />}
            title="Partner & Referral Admin"
            detail="Track broader partners, affiliates, referrals, rewards, and campaigns."
            href={adminRoutes.partners}
            action="Open Partners"
          />
        </DashboardCard>
      </section>
    </div>
  );
}

function AmbassadorLeadFormEnhancementScript() {
  const script = `
    (() => {
      const zipFallbacks = {
        "01085": {
          city: "Westfield",
          state: "MA",
          county: "Hampden",
          country: "United States",
        },
        "14476": {
          city: "Kendall",
          state: "NY",
          county: "Orleans",
          country: "United States",
        },
        "18951": {
          city: "Quakertown",
          state: "PA",
          county: "Bucks",
          country: "United States",
        },
        "27217": {
          city: "Burlington",
          state: "NC",
          county: "Alamance",
          country: "United States",
        },
        "38242": {
          city: "Paris",
          state: "TN",
          county: "Henry",
          country: "United States",
        },
        "46001": {
          city: "Alexandria",
          state: "IN",
          county: "Madison",
          country: "United States",
        },
        "64850": {
          city: "Neosho",
          state: "MO",
          county: "Newton",
          country: "United States",
        },
        "77494": {
          city: "Katy",
          state: "TX",
          county: "Fort Bend",
          country: "United States",
        },
        "81643": {
          city: "Mesa",
          state: "CO",
          county: "Mesa",
          country: "United States",
        },
        "93535": {
          city: "Lancaster",
          state: "CA",
          county: "Los Angeles",
          country: "United States",
        },
      };

      const zipTimers = new WeakMap();

      const formatPhone = (value) => {
        let digits = String(value || "").replace(/\\D/g, "");

        if (digits.length === 11 && digits.startsWith("1")) {
          digits = digits.slice(1);
        }

        digits = digits.slice(0, 10);

        if (digits.length <= 3) return digits;

        if (digits.length <= 6) {
          return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
        }

        return (
          "(" +
          digits.slice(0, 3) +
          ") " +
          digits.slice(3, 6) +
          "-" +
          digits.slice(6)
        );
      };

      const normalizeZip = (value) => {
        return String(value || "").replace(/\\D/g, "").slice(0, 5);
      };

      const normalizeState = (value) => {
        return String(value || "")
          .replace(/[^a-z]/gi, "")
          .slice(0, 2)
          .toUpperCase();
      };

      const getFormScope = (input) => {
        return input?.closest?.("form") || document;
      };

      const getPairedInput = (zipInput, selector) => {
        const scope = getFormScope(zipInput);
        return scope.querySelector(selector);
      };

      const getLocationHelper = (zipInput) => {
        const scope = getFormScope(zipInput);

        return (
          scope.querySelector("[data-location-helper='true']") ||
          document.querySelector("[data-location-helper='true']")
        );
      };

      const setHelper = (helper, message, tone = "green") => {
        if (!helper) return;

        helper.textContent = message;

        if (tone === "amber") {
          helper.className =
            "rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900";
          return;
        }

        if (tone === "red") {
          helper.className =
            "rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-900";
          return;
        }

        helper.className =
          "rounded-2xl bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-900";
      };

      const setLocationValues = (zipInput, location, message) => {
        const cityInput = getPairedInput(zipInput, "[data-city-input='true']");
        const stateInput = getPairedInput(zipInput, "[data-state-input='true']");
        const countyInput = getPairedInput(zipInput, "[data-county-input='true']");
        const countryInput = getPairedInput(zipInput, "[data-country-input='true']");
        const helper = getLocationHelper(zipInput);

        if (cityInput && location.city) cityInput.value = location.city;
        if (stateInput && location.state) stateInput.value = normalizeState(location.state);
        if (countyInput && location.county) countyInput.value = location.county;
        if (countryInput && location.country) countryInput.value = location.country;

        setHelper(
          helper,
          message ||
            "Location auto-filled from ZIP. Please confirm city, state, county, and country before saving.",
        );
      };

      const applyZipFallback = (zipInput, zip) => {
        const fallback = zipFallbacks[zip];

        if (!fallback) return false;

        setLocationValues(
          zipInput,
          fallback,
          "Location auto-filled from SitGuru ZIP fallback. Please confirm before saving.",
        );
        zipInput.dataset.lastLookupZip = zip;

        return true;
      };

      const lookupCounty = async ({ latitude, longitude }) => {
        if (!latitude || !longitude) return "";

        try {
          const countyResponse = await fetch(
            "https://geo.fcc.gov/api/census/block/find?format=json&latitude=" +
              encodeURIComponent(latitude) +
              "&longitude=" +
              encodeURIComponent(longitude),
          );

          if (!countyResponse.ok) return "";

          const countyData = await countyResponse.json();
          const countyName = countyData?.County?.name || "";

          return countyName.replace(/ County$/i, "");
        } catch {
          return "";
        }
      };

      const lookupZip = async (zipInput) => {
        if (!zipInput) return;

        const zip = normalizeZip(zipInput.value);
        zipInput.value = zip;

        if (zip.length !== 5) return;

        const helper = getLocationHelper(zipInput);

        if (applyZipFallback(zipInput, zip)) {
          return;
        }

        if (zipInput.dataset.lastLookupZip === zip) return;

        zipInput.dataset.lastLookupZip = zip;

        setHelper(helper, "Looking up ZIP code details...");

        try {
          const response = await fetch("https://api.zippopotam.us/us/" + zip);

          if (!response.ok) {
            setHelper(
              helper,
              "ZIP lookup did not find a match. You can enter the location manually.",
              "amber",
            );
            return;
          }

          const data = await response.json();
          const place = data?.places?.[0];

          if (!place) {
            setHelper(
              helper,
              "ZIP lookup did not find a city/state. You can enter the location manually.",
              "amber",
            );
            return;
          }

          const latitude = place.latitude || "";
          const longitude = place.longitude || "";
          const county = await lookupCounty({ latitude, longitude });

          setLocationValues(zipInput, {
            city: place["place name"] || "",
            state: place["state abbreviation"] || "",
            county,
            country: data.country || "United States",
          });
        } catch {
          if (!applyZipFallback(zipInput, zip)) {
            setHelper(
              helper,
              "ZIP lookup is temporarily unavailable. You can enter the location manually.",
              "amber",
            );
          }
        }
      };

      const scheduleZipLookup = (zipInput) => {
        if (!zipInput) return;

        zipInput.value = normalizeZip(zipInput.value);
        zipInput.dataset.lastLookupZip = "";

        const zip = normalizeZip(zipInput.value);

        if (zip.length === 5 && applyZipFallback(zipInput, zip)) {
          return;
        }

        const existingTimer = zipTimers.get(zipInput);

        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(() => {
          lookupZip(zipInput);
        }, 200);

        zipTimers.set(zipInput, timer);
      };

      const normalizeStateInput = (stateInput) => {
        if (!stateInput) return;

        stateInput.value = normalizeState(stateInput.value);
      };

      const normalizePhoneInput = (phoneInput) => {
        if (!phoneInput) return;

        phoneInput.value = formatPhone(phoneInput.value);
      };

      const enhanceInput = (input) => {
        if (!input || !input.matches) return;

        if (input.matches("[data-phone-input='true']")) {
          normalizePhoneInput(input);
          return;
        }

        if (input.matches("[data-state-input='true']")) {
          normalizeStateInput(input);
          return;
        }

        if (input.matches("[data-zip-input='true']")) {
          scheduleZipLookup(input);
        }
      };

      const applyInitialEnhancements = () => {
        document
          .querySelectorAll("[data-phone-input='true']")
          .forEach((input) => {
            normalizePhoneInput(input);
          });

        document
          .querySelectorAll("[data-state-input='true']")
          .forEach((input) => {
            normalizeStateInput(input);
          });

        document
          .querySelectorAll("[data-zip-input='true']")
          .forEach((input) => {
            const zip = normalizeZip(input.value);
            input.value = zip;

            if (zip.length === 5) {
              lookupZip(input);
            }
          });
      };

      if (window.__sitguruAmbassadorLeadEnhancementsLoaded !== true) {
        window.__sitguruAmbassadorLeadEnhancementsLoaded = true;

        document.addEventListener("input", (event) => {
          enhanceInput(event.target);
        });

        document.addEventListener("change", (event) => {
          enhanceInput(event.target);
        });

        document.addEventListener("keyup", (event) => {
          enhanceInput(event.target);
        });

        document.addEventListener("paste", (event) => {
          const input = event.target;

          if (!input || !input.matches) return;

          if (
            input.matches("[data-phone-input='true']") ||
            input.matches("[data-zip-input='true']") ||
            input.matches("[data-state-input='true']")
          ) {
            window.setTimeout(() => {
              enhanceInput(input);
            }, 0);
          }
        });

        document.addEventListener(
          "blur",
          (event) => {
            enhanceInput(event.target);
          },
          true,
        );

        document.addEventListener(
          "submit",
          (event) => {
            const form = event.target;

            if (!form || !form.querySelectorAll) return;

            form
              .querySelectorAll("[data-phone-input='true']")
              .forEach((input) => normalizePhoneInput(input));

            form
              .querySelectorAll("[data-state-input='true']")
              .forEach((input) => normalizeStateInput(input));

            form
              .querySelectorAll("[data-zip-input='true']")
              .forEach((input) => {
                const zip = normalizeZip(input.value);
                input.value = zip;

                if (zip.length === 5) {
                  applyZipFallback(input, zip);
                }
              });
          },
          true,
        );

        window.addEventListener("pageshow", () => {
          window.setTimeout(applyInitialEnhancements, 0);
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyInitialEnhancements);
      } else {
        window.setTimeout(applyInitialEnhancements, 0);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function NoticeCard({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        tone === "success"
          ? "border-green-200 bg-green-50 text-green-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
    </div>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function DataHealthTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-green-950">{value}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function ProgramMiniCard({
  title,
  detail,
  value,
  icon,
}: {
  title: string;
  detail: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-800 text-white">
          {icon}
        </div>
        <span className="text-xl font-black text-green-950">{value}</span>
      </div>
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
      {label}
    </span>
  );
}

function ProgramBadge({ program }: { program: string }) {
  const styles =
    program === "Student Hire"
      ? "bg-blue-50 text-blue-800 border-blue-100"
      : program === "Military Hire"
        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
        : "bg-green-50 text-green-800 border-green-100";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles}`}
    >
      {program}
    </span>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved"
      ? "bg-green-100 text-green-800"
      : status === "Signed Up"
        ? "bg-emerald-100 text-emerald-800"
        : status === "Contacted"
          ? "bg-blue-100 text-blue-800"
          : status === "Interested"
            ? "bg-amber-100 text-amber-800"
            : status === "Not Moving Forward"
              ? "bg-slate-100 text-slate-600"
              : status === "Archived"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function PipelineProgressFlow({ status }: { status: string }) {
  const stages = ["New", "Contacted", "Interested", "Signed Up", "Approved"];
  const currentIndex = stages.indexOf(status);
  const isClosed = status === "Not Moving Forward";
  const isArchived = status === "Archived";

  if (isArchived) {
    return (
      <div className="mt-3 max-w-[360px] rounded-2xl border border-red-100 bg-red-50 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {stages.map((stage) => (
            <span
              key={stage}
              className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400"
            >
              {stage}
            </span>
          ))}
          <span className="rounded-full bg-red-700 px-2 py-1 text-[10px] font-black text-white">
            Archived
          </span>
        </div>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="mt-3 max-w-[360px] rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {stages.map((stage) => (
            <span
              key={stage}
              className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400"
            >
              {stage}
            </span>
          ))}
          <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] font-black text-white">
            Not Moving
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 max-w-[380px] rounded-2xl border border-green-100 bg-[#fbfcf9] p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {stages.map((stage, index) => {
          const isComplete = currentIndex >= 0 && index < currentIndex;
          const isCurrent = currentIndex === index;
          const isFuture = currentIndex === -1 || index > currentIndex;

          return (
            <span
              key={stage}
              className={`rounded-full px-2 py-1 text-[10px] font-black ${
                isComplete
                  ? "bg-green-600 text-white"
                  : isCurrent
                    ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
                    : isFuture
                      ? "bg-slate-100 text-slate-500"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {stage}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LeadQuickStatusButtons({ lead }: { lead: NormalizedLead }) {
  if (!lead.id) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-black text-slate-500">
        No actions
      </span>
    );
  }

  if (lead.status === "Archived") {
    return (
      <form action={updateAmbassadorLeadPipelineStatus}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="source_table" value={lead.sourceTable} />
        <input type="hidden" name="next_status" value="contacted" />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800 ring-1 ring-green-100 transition hover:bg-green-100"
        >
          <RotateCcw size={13} />
          Restore
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-1.5">
      {quickStatusActions.map((action) => (
        <form key={action.value} action={updateAmbassadorLeadPipelineStatus}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <input type="hidden" name="source_table" value={lead.sourceTable} />
          <input type="hidden" name="next_status" value={action.value} />
          <button
            type="submit"
            className={`inline-flex w-full items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 transition ${action.tone}`}
          >
            {action.icon}
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function PipelineFilterPanel({
  filters,
  resultCount,
  totalCount,
}: {
  filters: {
    query: string;
    program: string;
    source: string;
    status: string;
    documents: string;
  };
  resultCount: number;
  totalCount: number;
}) {
  const hasFilters =
    Boolean(filters.query) ||
    Boolean(filters.program) ||
    Boolean(filters.source) ||
    Boolean(filters.status) ||
    Boolean(filters.documents);

  return (
    <div className="mb-5 rounded-[24px] border border-green-100 bg-[#fbfcf9] p-4">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-600">
            Pipeline filters
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Showing {number(resultCount)} of {number(totalCount)} ambassador
            leads.
          </p>
        </div>

        {hasFilters ? (
          <Link
            href={adminRoutes.ambassadorLeads}
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-black text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      <form
        action={adminRoutes.ambassadorLeads}
        className="grid gap-3 lg:grid-cols-6"
      >
        <label className="lg:col-span-2">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Search
          </span>
          <input
            name="q"
            defaultValue={filters.query}
            placeholder="Name, email, phone, city, notes..."
            className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />
        </label>

        <FilterSelect label="Program" name="program" value={filters.program}>
          <option value="">All programs</option>
          {programOrder.map((program) => (
            <option key={program} value={program}>
              {program}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Source" name="source" value={filters.source}>
          <option value="">All sources</option>
          {sourceOrder.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Status" name="status" value={filters.status}>
          <option value="">All statuses</option>
          {statusOrder.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Documents"
          name="documents"
          value={filters.documents}
        >
          <option value="">All documents</option>
          <option value="with_documents">With documents</option>
          <option value="missing_documents">Missing documents</option>
        </FilterSelect>

        <div className="flex items-end lg:col-span-6">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 sm:w-auto"
          >
            <Search size={16} />
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
      >
        {children}
      </select>
    </label>
  );
}

function PipelineEditForm({ lead }: { lead: NormalizedLead }) {
  return (
    <details className="rounded-[24px] border border-green-100 bg-white p-4">
      <summary className="cursor-pointer text-sm font-black text-green-900">
        Edit {lead.name}
      </summary>

      <form action={updateAmbassadorLead} className="mt-4 grid gap-4">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="source_table" value={lead.sourceTable} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PipelineEditField label="Lead Name">
            <input
              name="full_name"
              defaultValue={lead.name}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Email">
            <input
              name="email"
              type="email"
              defaultValue={lead.email === "—" ? "" : lead.email}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Phone">
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={14}
              defaultValue={lead.phone === "—" ? "" : lead.phone}
              data-phone-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Status">
            <select
              name="status"
              defaultValue={lead.status}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </PipelineEditField>

          <PipelineEditField label="Program">
            <select
              name="program"
              defaultValue={lead.program}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              {programOrder.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </PipelineEditField>

          <PipelineEditField label="Source">
            <select
              name="source"
              defaultValue={lead.source}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              {sourceOrder.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </PipelineEditField>

          <PipelineEditField label="ZIP Code">
            <input
              name="zip_code"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={10}
              defaultValue={lead.zipCode}
              data-zip-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="City">
            <input
              name="city"
              defaultValue={lead.city}
              data-city-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="State">
            <input
              name="state"
              maxLength={2}
              defaultValue={lead.state}
              data-state-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="County">
            <input
              name="county"
              defaultValue={lead.county}
              data-county-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Country">
            <input
              name="country"
              defaultValue={lead.country}
              data-country-input="true"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>
        </div>

        <PipelineEditField label="Notes">
          <textarea
            name="notes"
            defaultValue={lead.notes}
            rows={3}
            className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />
        </PipelineEditField>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <PipelineEditField label="Resume path or link">
            <input
              name="resume_file_url"
              defaultValue={lead.documents.resumeUrl}
              placeholder="student-hire/resume.pdf"
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Cover letter link">
            <input
              name="cover_letter_file_url"
              defaultValue={lead.documents.coverLetterUrl}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Other document link">
            <input
              name="other_document_file_url"
              defaultValue={lead.documents.otherDocumentUrl}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Resume label">
            <input
              name="resume_file_name"
              defaultValue={lead.documents.resumeName}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Cover letter label">
            <input
              name="cover_letter_file_name"
              defaultValue={lead.documents.coverLetterName}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>

          <PipelineEditField label="Other document label">
            <input
              name="other_document_file_name"
              defaultValue={lead.documents.otherDocumentName}
              className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </PipelineEditField>
        </div>

        <p
          data-location-helper="true"
          className="rounded-2xl bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-900"
        >
          ZIP edits can auto-fill city, state, county, and country. You can
          still edit any location field before saving.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
          >
            Save Changes
          </button>
        </div>
      </form>
    </details>
  );
}

function PipelineEditField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DocumentButtonGroup({
  leadId,
  documents,
}: {
  leadId: string;
  documents: {
    resumeUrl: string;
    resumeName: string;
    coverLetterUrl: string;
    coverLetterName: string;
    otherDocumentUrl: string;
    otherDocumentName: string;
  };
}) {
  const items = [
    {
      label: documents.resumeName || "Resume",
      href:
        documents.resumeUrl && leadId
          ? `/admin/ambassador-leads/${leadId}/resume`
          : documents.resumeUrl,
      shortLabel: "Resume",
      secure: Boolean(documents.resumeUrl && leadId),
    },
    {
      label: documents.coverLetterName || "Cover Letter",
      href: documents.coverLetterUrl,
      shortLabel: "Cover",
      secure: false,
    },
    {
      label: documents.otherDocumentName || "Other Document",
      href: documents.otherDocumentUrl,
      shortLabel: "Docs",
      secure: false,
    },
  ].filter((item) => item.href);

  if (!items.length) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
        No documents
      </span>
    );
  }

  return (
    <div className="flex max-w-[260px] flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={`${item.shortLabel}-${item.href}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={
            item.secure
              ? `${item.label} opens through secure admin viewer`
              : item.label
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800 transition hover:bg-green-100"
        >
          <FileText size={13} />
          {item.shortLabel}
          <ExternalLink size={11} />
        </Link>
      ))}
    </div>
  );
}

function ContactLine({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
      {icon}
      <span className="max-w-[190px] truncate">{value}</span>
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800">
      {initials || "SG"}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  detail,
  href,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
      >
        {action}
        <span>→</span>
      </Link>
    </div>
  );
}