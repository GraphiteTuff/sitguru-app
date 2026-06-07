import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabase/admin";
import GuruLeadForm from "./GuruLeadForm";

export const dynamic = "force-dynamic";

const RESUME_BUCKET = "guru-resumes";
const RESUME_FOLDER = "dog-sitters/guru-leads";
const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;

type GuruLead = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lead_source: string | null;
  referral_code: string | null;
  referred_by_name: string | null;
  referred_by_email: string | null;
  interested_services: string[] | null;
  experience_level: string | null;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
  assigned_to: string | null;
  converted_guru_id: string | null;
  converted_at: string | null;
  resume_file_path: string | null;
  resume_file_name: string | null;
  resume_mime_type: string | null;
  resume_size_bytes: number | null;
  resume_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

type GuruLeadWithResumeUrl = GuruLead & {
  resume_signed_url: string | null;
};

type CountItem = {
  label: string;
  value: number;
};

const statusOptions = [
  "New",
  "Contacted",
  "Interested",
  "Application Sent",
  "Applied",
  "Approved Guru",
  "Not Moving Forward",
];

const leadSourceOptions = [
  "Facebook Group",
  "Nextdoor",
  "ZipRecruiter",
  "Indeed",
  "PA CareerLink",
  "Event",
  "Flyer / Door Hanger",
  "Referral",
  "Website",
  "Partner",
  "Other",
];

const serviceOptions = [
  "Dog Walking",
  "Pet Sitting",
  "Drop-ins",
  "Boarding",
  "Day Care",
  "Training",
  "Grooming",
  "Pet Transportation",
  "Other",
];

const experienceOptions = [
  "New",
  "Some Experience",
  "Experienced",
  "Professional",
  "Licensed / Certified",
];

const assignedToOptions = ["Jason", "Danette", "Support"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getRequiredString(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function normalizeEmail(value: string | null) {
  return value ? value.toLowerCase() : null;
}

function normalizeReferralCode(value: string | null) {
  return value ? value.trim().toUpperCase() : null;
}

function normalizePhone(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
}

function normalizeZip(value: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/\D/g, "").slice(0, 5) || null;
}

function getResumeFile(formData: FormData) {
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return null;
  }

  if (!file.name || file.size === 0) {
    return null;
  }

  return file;
}

function sanitizeFileName(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() || "pdf" : "pdf";
  const baseName = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "resume"}.${extension}`;
}

function validateResumeFile(file: File) {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedExtensions = [".pdf", ".doc", ".docx"];
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );

  if (!allowedMimeTypes.includes(file.type) && !hasAllowedExtension) {
    throw new Error("Resume must be a PDF, DOC, or DOCX file.");
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    throw new Error("Resume must be 10MB or smaller.");
  }
}

async function uploadResumeForLead({
  leadId,
  file,
}: {
  leadId: string;
  file: File;
}) {
  validateResumeFile(file);

  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${RESUME_FOLDER}/${leadId}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return {
    resume_file_path: filePath,
    resume_file_name: file.name,
    resume_mime_type: file.type || "application/octet-stream",
    resume_size_bytes: file.size,
    resume_uploaded_at: new Date().toISOString(),
  };
}

function countByLabel(items: GuruLead[], getLabel: (lead: GuruLead) => string | null) {
  const map = new Map<string, number>();

  for (const item of items) {
    const label = getLabel(item)?.trim() || "Not Added";
    map.set(label, (map.get(label) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function getTopLabel(items: CountItem[]) {
  return items.length > 0 ? items[0].label : "None yet";
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusClass(status: string) {
  switch (status) {
    case "New":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "Contacted":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Interested":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Application Sent":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "Applied":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "Approved Guru":
      return "bg-green-50 text-green-700 ring-green-200";
    case "Not Moving Forward":
      return "bg-slate-100 text-slate-700 ring-slate-300";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-300";
  }
}

function buildReferralCode(lead: GuruLead) {
  if (lead.referral_code) {
    return lead.referral_code;
  }

  return `${lead.first_name}${lead.last_name || ""}`
    .replace(/\s+/g, "")
    .toUpperCase();
}

function getEmailHref(lead: GuruLead) {
  const referralCode = buildReferralCode(lead);
  const subject = encodeURIComponent("SitGuru Guru Opportunity — Next Steps");

  const body = encodeURIComponent(
    `Hi ${lead.first_name},

Thank you for your interest in SitGuru. We reviewed your resume and liked your background and experience.

SitGuru is currently speaking with candidates interested in becoming pet care sitters, dog walkers, and local Pet Care Gurus. We would like to see if you are still interested and discuss the next steps in the process.

You can sign up now for free and begin creating your Guru profile here:

https://www.sitguru.com/become-a-guru?ref=${referralCode}

Referral Code: ${referralCode}

Once your profile is started, we can also schedule a conference call if you would like help setting up your profile, services, experience, availability, and service area.

After a Guru profile is reviewed and approved, SitGuru will work to drive Pet Parents to approved Guru profiles as we continue growing in each local area.

Please reply and let us know if you are still interested in moving forward.

Thank you,

Jason Graff
Founder, SitGuru
https://www.sitguru.com`,
  );

  return `mailto:${lead.email}?subject=${subject}&body=${body}`;
}

async function addGuruLead(formData: FormData) {
  "use server";

  const firstName = getRequiredString(formData, "first_name");
  const lastName = getString(formData, "last_name");
  const email = normalizeEmail(getString(formData, "email"));
  const phone = normalizePhone(getString(formData, "phone"));
  const city = getString(formData, "city");
  const state = getString(formData, "state");
  const zip = normalizeZip(getString(formData, "zip"));
  const leadSource = getString(formData, "lead_source");
  const referralCode = normalizeReferralCode(getString(formData, "referral_code"));
  const referredByName = getString(formData, "referred_by_name");
  const referredByEmail = normalizeEmail(getString(formData, "referred_by_email"));
  const experienceLevel = getString(formData, "experience_level");
  const status = getString(formData, "status") || "New";
  const notes = getString(formData, "notes");
  const followUpDate = getString(formData, "follow_up_date");
  const assignedTo = getString(formData, "assigned_to");
  const resumeFile = getResumeFile(formData);

  const interestedServices = formData
    .getAll("interested_services")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const { data: insertedLead, error } = await supabaseAdmin
    .from("guru_leads")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      city,
      state,
      zip,
      lead_source: leadSource,
      referral_code: referralCode,
      referred_by_name: referredByName,
      referred_by_email: referredByEmail,
      interested_services: interestedServices,
      experience_level: experienceLevel,
      status,
      notes,
      follow_up_date: followUpDate,
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (resumeFile && insertedLead?.id) {
    const resumeData = await uploadResumeForLead({
      leadId: insertedLead.id,
      file: resumeFile,
    });

    const { error: resumeUpdateError } = await supabaseAdmin
      .from("guru_leads")
      .update({
        ...resumeData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insertedLead.id);

    if (resumeUpdateError) {
      throw new Error(resumeUpdateError.message);
    }
  }

  revalidatePath("/admin/gurus/leads");
  revalidatePath("/admin/gurus");
}

async function updateGuruLead(formData: FormData) {
  "use server";

  const id = getRequiredString(formData, "id");
  const firstName = getRequiredString(formData, "first_name");
  const lastName = getString(formData, "last_name");
  const email = normalizeEmail(getString(formData, "email"));
  const phone = normalizePhone(getString(formData, "phone"));
  const city = getString(formData, "city");
  const state = getString(formData, "state");
  const zip = normalizeZip(getString(formData, "zip"));
  const leadSource = getString(formData, "lead_source");
  const referralCode = normalizeReferralCode(getString(formData, "referral_code"));
  const referredByName = getString(formData, "referred_by_name");
  const referredByEmail = normalizeEmail(getString(formData, "referred_by_email"));
  const experienceLevel = getString(formData, "experience_level");
  const status = getString(formData, "status") || "New";
  const assignedTo = getString(formData, "assigned_to");
  const followUpDate = getString(formData, "follow_up_date");
  const notes = getString(formData, "notes");
  const resumeFile = getResumeFile(formData);

  const interestedServices = formData
    .getAll("interested_services")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const updatePayload: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    city,
    state,
    zip,
    lead_source: leadSource,
    referral_code: referralCode,
    referred_by_name: referredByName,
    referred_by_email: referredByEmail,
    interested_services: interestedServices,
    experience_level: experienceLevel,
    status,
    assigned_to: assignedTo,
    follow_up_date: followUpDate,
    notes,
    updated_at: new Date().toISOString(),
  };

  if (resumeFile) {
    const resumeData = await uploadResumeForLead({
      leadId: id,
      file: resumeFile,
    });

    Object.assign(updatePayload, resumeData);
  }

  const { error } = await supabaseAdmin
    .from("guru_leads")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/gurus/leads");
  revalidatePath("/admin/gurus");
}

async function deleteGuruLead(formData: FormData) {
  "use server";

  const id = getRequiredString(formData, "id");

  const { error } = await supabaseAdmin.from("guru_leads").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/gurus/leads");
  revalidatePath("/admin/gurus");
}

function SourceChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: CountItem[];
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => {
            const width = maxValue > 0 ? Math.max(8, (item.value / maxValue) * 100) : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-sm font-bold text-emerald-700">{item.value}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-700"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            No source data yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default async function GuruLeadsPage() {
  const { data: leads, error } = await supabaseAdmin
    .from("guru_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const baseGuruLeads = (leads || []) as GuruLead[];

  const guruLeads: GuruLeadWithResumeUrl[] = await Promise.all(
    baseGuruLeads.map(async (lead) => {
      if (!lead.resume_file_path) {
        return {
          ...lead,
          resume_signed_url: null,
        };
      }

      const { data: signedUrlData } = await supabaseAdmin.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(lead.resume_file_path, 60 * 60);

      return {
        ...lead,
        resume_signed_url: signedUrlData?.signedUrl || null,
      };
    }),
  );

  const totalLeads = guruLeads.length;
  const newLeads = guruLeads.filter((lead) => lead.status === "New").length;
  const interestedLeads = guruLeads.filter((lead) => lead.status === "Interested").length;
  const appliedLeads = guruLeads.filter((lead) => lead.status === "Applied").length;
  const approvedLeads = guruLeads.filter((lead) => lead.status === "Approved Guru").length;
  const referralLeads = guruLeads.filter(
    (lead) => lead.lead_source === "Referral" || Boolean(lead.referral_code),
  ).length;

  const sourceCounts = countByLabel(guruLeads, (lead) => lead.lead_source);
  const referralCodeCounts = countByLabel(
    guruLeads.filter((lead) => Boolean(lead.referral_code)),
    (lead) => lead.referral_code,
  );

  const topSource = getTopLabel(sourceCounts);
  const topReferralCode = getTopLabel(referralCodeCounts);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Link href="/admin" className="font-medium text-emerald-700 hover:text-emerald-800">
                Admin
              </Link>
              <span className="text-slate-400">/</span>
              <Link href="/admin/gurus" className="font-medium text-emerald-700 hover:text-emerald-800">
                Gurus
              </Link>
              <span className="text-slate-400">/</span>
              <span className="font-medium text-slate-600">Guru Leads</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Guru Leads
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Track interested dog sitters, walkers, boarders, trainers, referrals, resumes, and
              pet care providers before they become approved SitGuru Gurus.
            </p>
          </div>

          <Link
            href="/admin/gurus"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Gurus
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Could not load Guru Leads: {error.message}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Total Leads</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{totalLeads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">New</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{newLeads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Interested</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{interestedLeads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Applied</p>
            <p className="mt-2 text-3xl font-bold text-indigo-700">{appliedLeads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{approvedLeads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Referral Leads</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">{referralLeads}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <p className="text-sm font-medium text-slate-500">Top Lead Source</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{topSource}</p>
            <p className="mt-1 text-sm text-slate-600">
              This helps show where SitGuru is getting the most Guru interest.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <p className="text-sm font-medium text-slate-500">Top Referral Code</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{topReferralCode}</p>
            <p className="mt-1 text-sm text-slate-600">
              Tracks which referral code is generating the most Guru leads.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <SourceChart
            title="Lead Source Reporting"
            subtitle="Shows where interested Gurus are coming from."
            items={sourceCounts}
          />

          <SourceChart
            title="Referral Code Reporting"
            subtitle="Shows which referral codes are bringing in Guru prospects."
            items={referralCodeCounts}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Add Guru Lead</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add sitters, walkers, and pet care providers who show interest before they complete
              Guru signup.
            </p>

            <GuruLeadForm
              action={addGuruLead}
              leadSourceOptions={leadSourceOptions}
              experienceOptions={experienceOptions}
              serviceOptions={serviceOptions}
              statusOptions={statusOptions}
              assignedToOptions={assignedToOptions}
            />
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Lead Pipeline</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Work each lead from first contact to Guru application.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {guruLeads.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-base font-bold text-slate-800">No Guru Leads yet</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Add your first interested sitter, walker, or pet care provider using the form.
                  </p>
                </div>
              ) : (
                guruLeads.map((lead) => {
                  const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
                  const services = lead.interested_services || [];
                  const becomeGuruHref = lead.referral_code
                    ? `/become-a-guru?ref=${encodeURIComponent(lead.referral_code)}`
                    : "/become-a-guru";

                  return (
                    <article
                      key={lead.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-950">{fullName}</h3>

                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClass(
                                lead.status,
                              )}`}
                            >
                              {lead.status}
                            </span>

                            {lead.referral_code ? (
                              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-200">
                                Ref: {lead.referral_code}
                              </span>
                            ) : null}

                            {lead.resume_file_path ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                                Resume Uploaded
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <p>
                              <span className="font-semibold text-slate-800">Email:</span>{" "}
                              {lead.email ? (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="text-emerald-700 hover:text-emerald-800"
                                >
                                  {lead.email}
                                </a>
                              ) : (
                                "Not added"
                              )}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Phone:</span>{" "}
                              {lead.phone ? (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-emerald-700 hover:text-emerald-800"
                                >
                                  {lead.phone}
                                </a>
                              ) : (
                                "Not added"
                              )}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Location:</span>{" "}
                              {[lead.city, lead.state, lead.zip].filter(Boolean).join(", ") ||
                                "Not added"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Source:</span>{" "}
                              {lead.lead_source || "Not added"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Referral Code:</span>{" "}
                              {lead.referral_code || "Not added"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Referred By:</span>{" "}
                              {lead.referred_by_name || lead.referred_by_email || "Not added"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Experience:</span>{" "}
                              {lead.experience_level || "Not added"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Assigned:</span>{" "}
                              {lead.assigned_to || "Unassigned"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Follow-Up:</span>{" "}
                              {lead.follow_up_date || "Not set"}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-800">Added:</span>{" "}
                              {new Date(lead.created_at).toLocaleDateString()}
                            </p>

                            <p className="sm:col-span-2">
                              <span className="font-semibold text-slate-800">Resume:</span>{" "}
                              {lead.resume_signed_url ? (
                                <a
                                  href={lead.resume_signed_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-emerald-700 hover:text-emerald-800"
                                >
                                  View Resume
                                  {lead.resume_file_name ? ` (${lead.resume_file_name})` : ""}
                                  {lead.resume_size_bytes
                                    ? ` - ${formatFileSize(lead.resume_size_bytes)}`
                                    : ""}
                                </a>
                              ) : lead.resume_file_path ? (
                                "Resume uploaded, but signed link could not be created."
                              ) : (
                                "Not uploaded"
                              )}
                            </p>
                          </div>

                          {services.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {services.map((service) => (
                                <span
                                  key={service}
                                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {lead.notes ? (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                              <span className="font-semibold text-slate-900">Notes:</span>{" "}
                              {lead.notes}
                            </div>
                          ) : null}
                        </div>

                        <form
                          action={updateGuruLead}
                          encType="multipart/form-data"
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <input type="hidden" name="id" value={lead.id} />

                          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                            Edit Lead Information
                          </h4>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                First Name *
                              </span>
                              <input
                                name="first_name"
                                required
                                defaultValue={lead.first_name || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Last Name
                              </span>
                              <input
                                name="last_name"
                                defaultValue={lead.last_name || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Email
                              </span>
                              <input
                                name="email"
                                type="email"
                                defaultValue={lead.email || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Phone
                              </span>
                              <input
                                name="phone"
                                type="tel"
                                defaultValue={lead.phone || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                placeholder="(215) 555-1234"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                City
                              </span>
                              <input
                                name="city"
                                defaultValue={lead.city || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <div className="grid grid-cols-[90px_1fr] gap-3">
                              <label className="block">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  State
                                </span>
                                <input
                                  name="state"
                                  defaultValue={lead.state || ""}
                                  maxLength={2}
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                              </label>

                              <label className="block">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  ZIP
                                </span>
                                <input
                                  name="zip"
                                  inputMode="numeric"
                                  defaultValue={lead.zip || ""}
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                              </label>
                            </div>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Status
                              </span>
                              <select
                                name="status"
                                defaultValue={lead.status}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Lead Source
                              </span>
                              <select
                                name="lead_source"
                                defaultValue={lead.lead_source || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Select source</option>
                                {leadSourceOptions.map((source) => (
                                  <option key={source} value={source}>
                                    {source}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Experience
                              </span>
                              <select
                                name="experience_level"
                                defaultValue={lead.experience_level || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Select experience</option>
                                {experienceOptions.map((experience) => (
                                  <option key={experience} value={experience}>
                                    {experience}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Referral Code
                              </span>
                              <input
                                name="referral_code"
                                defaultValue={lead.referral_code || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Referred By Name
                              </span>
                              <input
                                name="referred_by_name"
                                defaultValue={lead.referred_by_name || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Referred By Email
                              </span>
                              <input
                                name="referred_by_email"
                                type="email"
                                defaultValue={lead.referred_by_email || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Assigned To
                              </span>
                              <select
                                name="assigned_to"
                                defaultValue={lead.assigned_to || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Unassigned</option>
                                {assignedToOptions.map((person) => (
                                  <option key={person} value={person}>
                                    {person}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Follow-Up Date
                              </span>
                              <input
                                name="follow_up_date"
                                type="date"
                                defaultValue={lead.follow_up_date || ""}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>

                            <label className="block md:col-span-2">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Replace / Upload Resume
                              </span>
                              <input
                                name="resume"
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-2 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-800"
                              />
                            </label>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Interested Services
                            </p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {serviceOptions.map((service) => (
                                <label
                                  key={service}
                                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    name="interested_services"
                                    value={service}
                                    defaultChecked={services.includes(service)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  {service}
                                </label>
                              ))}
                            </div>
                          </div>

                          <label className="mt-4 block">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Notes
                            </span>
                            <textarea
                              name="notes"
                              rows={4}
                              defaultValue={lead.notes || ""}
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                          </label>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                            >
                              Save Lead Changes
                            </button>

                            <div className="flex flex-wrap gap-2">
                              {lead.email ? (
                                <a
                                  href={getEmailHref(lead)}
                                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                                >
                                  Email Lead
                                </a>
                              ) : null}

                              <Link
                                href={becomeGuruHref}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Become-a-Guru Page
                              </Link>

                              {lead.resume_signed_url ? (
                                <a
                                  href={lead.resume_signed_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                  View Resume
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </form>

                        <form action={deleteGuruLead} className="flex justify-end">
                          <input type="hidden" name="id" value={lead.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                          >
                            Delete Lead
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}