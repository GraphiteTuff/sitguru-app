import Link from "next/link";
import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    saved?: string;
    submitted?: string;
    message?: string;
    error?: string;
  }>;
};

type GuruRow = Record<string, unknown>;
type SafeQueryResponse = { data: unknown; error: unknown };

const guruPhotoBucket = "guru-profile-photos";
const guruApplicationFormId = "guru-application-form";

const serviceOptions = [
  "Dog Walking",
  "Drop-In Visits",
  "Pet Sitting",
  "Boarding",
  "Overnight Care",
  "Cat Care",
  "Senior Pet Care",
  "Puppy Care",
  "Pet Transportation",
  "Training Support",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  return Boolean(value);
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "arrayBuffer" in value &&
    Number(value.size) > 0
  );
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || "";
}

async function updateWithColumnFallback({
  table,
  idColumn,
  idValue,
  payload,
  requiredColumns = [],
}: {
  table: string;
  idColumn: string;
  idValue: string;
  payload: Record<string, unknown>;
  requiredColumns?: string[];
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabaseAdmin
      .from(table)
      .update(workingPayload)
      .eq(idColumn, idValue);

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          `${table} update succeeded after removing missing optional columns:`,
          removedColumns
        );
      }
      return null;
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn) &&
      !requiredColumns.includes(missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return error;
  }

  return {
    message: `Unable to update ${table} record after removing optional missing columns.`,
  };
}

async function upsertWithColumnFallback({
  table,
  payload,
  onConflict,
  requiredColumns = [],
}: {
  table: string;
  payload: Record<string, unknown>;
  onConflict: string;
  requiredColumns?: string[];
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabaseAdmin
      .from(table)
      .upsert(workingPayload, { onConflict });

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          `${table} upsert succeeded after removing missing optional columns:`,
          removedColumns
        );
      }
      return null;
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn) &&
      !requiredColumns.includes(missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return error;
  }

  return {
    message: `Unable to save ${table} record after removing optional missing columns.`,
  };
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getSelectedServices(formData: FormData) {
  return formData
    .getAll("services")
    .map((service) => String(service).trim())
    .filter(Boolean);
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruServices(guru: GuruRow) {
  if (Array.isArray(guru.services)) {
    return guru.services.map((service) => String(service).trim()).filter(Boolean);
  }

  const singleService =
    asTrimmedString(guru.service) ||
    asTrimmedString(guru.service_name) ||
    asTrimmedString(guru.specialty);

  return singleService ? [singleService] : [];
}

function getGuruPhotoUrl(guru: GuruRow) {
  return (
    asTrimmedString(guru.avatar_url) ||
    asTrimmedString(guru.photo_url) ||
    asTrimmedString(guru.image_url) ||
    asTrimmedString(guru.profile_photo_url)
  );
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadGuruProfilePhoto({
  file,
  userId,
  guruId,
}: {
  file: File;
  userId: string;
  guruId: string;
}) {
  if (!file.type.startsWith("image/")) {
    return { url: "", error: "Please upload an image file for your profile photo." };
  }

  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { url: "", error: "Profile photo must be 5MB or smaller." };
  }

  const safeName = sanitizeFileName(file.name || "profile-photo.jpg");
  const path = `${userId}/${guruId}-${Date.now()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(guruPhotoBucket)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    return {
      url: "",
      error:
        error.message ||
        "Unable to upload profile photo. Make sure the guru-profile-photos storage bucket exists.",
    };
  }

  const { data } = supabaseAdmin.storage.from(guruPhotoBucket).getPublicUrl(path);
  return { url: data.publicUrl, error: "" };
}

function calculateProfileCompletion(input: {
  displayName: string;
  phone: string;
  city: string;
  state: string;
  bio: string;
  hourlyRate: number;
  services: string[];
  experienceYears: number;
  petExperience: string;
  serviceArea: string;
  availabilityNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  safetyAgreementAccepted: boolean;
  profilePhotoUrl: string;
}) {
  const checks = [
    Boolean(input.displayName),
    Boolean(input.phone),
    Boolean(input.city && input.state),
    Boolean(input.profilePhotoUrl),
    Boolean(input.bio),
    input.hourlyRate > 0,
    input.services.length > 0,
    input.experienceYears > 0,
    Boolean(input.petExperience),
    Boolean(input.serviceArea),
    Boolean(input.availabilityNotes),
    Boolean(input.emergencyContactName && input.emergencyContactPhone),
    input.safetyAgreementAccepted,
  ];

  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
}

function getApplicationStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "new") return "Application Started";
  if (normalized === "profile_incomplete") return "Profile Incomplete";
  if (normalized === "submitted") return "Application Submitted";
  if (normalized === "reviewing") return "Under Review";
  if (normalized === "needs_info") return "More Info Needed";
  if (normalized === "pre_approved") return "Pre-Approved";
  if (normalized === "verification_pending") return "Verification Needed";
  if (normalized === "approved") return "Approved";
  if (normalized === "bookable") return "Bookable";
  if (normalized === "rejected") return "Not Approved";
  if (normalized === "suspended") return "Paused";

  return "Application Started";
}

function getApplicationStatusClasses(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "bookable") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (
    normalized === "approved" ||
    normalized === "pre_approved" ||
    normalized === "submitted" ||
    normalized === "reviewing"
  ) {
    return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  }

  if (normalized === "needs_info" || normalized === "profile_incomplete") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  if (normalized === "rejected" || normalized === "suspended") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-white/10 bg-white/5 text-slate-200";
}

function getCredentialStatus(value: unknown) {
  const normalized = asTrimmedString(value).toLowerCase();

  if (!normalized) return "Not Started";
  if (normalized === "not_started") return "Not Started";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "pending") return "Pending";
  if (normalized === "verified") return "Verified";
  if (normalized === "clear") return "Clear";
  if (normalized === "cleared") return "Cleared";
  if (normalized === "approved") return "Approved";
  if (normalized === "failed") return "Failed";
  if (normalized === "rejected") return "Rejected";

  return normalized
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function credentialClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (normalized === "pending" || normalized === "in progress") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  }

  if (normalized === "failed" || normalized === "rejected") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

async function getCurrentGuru() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/guru/login");
  }

  const { data: existingGuru } = (await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()) as SafeQueryResponse;

  if (existingGuru) {
    return { user, guru: existingGuru as GuruRow };
  }

  const fullName =
    [
      asTrimmedString(user.user_metadata?.first_name),
      asTrimmedString(user.user_metadata?.last_name),
    ]
      .filter(Boolean)
      .join(" ") ||
    asTrimmedString(user.user_metadata?.full_name) ||
    user.email?.split("@")[0] ||
    "New Guru";

  const now = new Date().toISOString();

  const createPayload = {
    user_id: user.id,
    display_name: fullName,
    full_name: fullName,
    email: user.email || null,
    status: "pending",
    application_status: "new",
    is_bookable: false,
    profile_completion: 0,
    credential_level: "pending",
    stripe_connect_status: "not_started",
    stripe_identity_status: "not_started",
    identity_status: "not_started",
    background_check_status: "not_started",
    safety_cert_status: "not_started",
    is_identity_verified: false,
    is_background_checked: false,
    is_safety_certified: false,
    founding_guru: true,
    created_at: now,
    updated_at: now,
  };

  const createError = await upsertWithColumnFallback({
    table: "gurus",
    payload: createPayload,
    onConflict: "user_id",
    requiredColumns: ["user_id"],
  });

  if (createError) {
    redirect(
      `/guru/dashboard?error=${encodeURIComponent(
        createError.message || "Unable to create Guru application."
      )}`
    );
  }

  const { data: createdGuru } = (await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()) as SafeQueryResponse;

  return { user, guru: (createdGuru || createPayload) as GuruRow };
}

async function saveGuruApplication(formData: FormData) {
  "use server";

  const { user, guru } = await getCurrentGuru();
  const guruId = getGuruId(guru);

  const displayName = getFormString(formData, "displayName");
  const phone = getFormString(formData, "phone");
  const city = getFormString(formData, "city");
  const state = getFormString(formData, "state");
  const serviceArea = getFormString(formData, "serviceArea");
  const availabilityNotes = getFormString(formData, "availabilityNotes");
  const bio = getFormString(formData, "bio");
  const petExperience = getFormString(formData, "petExperience");
  const emergencyContactName = getFormString(formData, "emergencyContactName");
  const emergencyContactPhone = getFormString(formData, "emergencyContactPhone");
  const serviceTitle = getFormString(formData, "serviceTitle");
  const hourlyRate = Number(getFormString(formData, "hourlyRate")) || 0;
  const experienceYears = Number(getFormString(formData, "experienceYears")) || 0;
  const services = getSelectedServices(formData);
  const safetyAgreementAccepted = formData.get("safetyAgreementAccepted") === "on";
  const existingPhotoUrl = getGuruPhotoUrl(guru);
  const photoFile = formData.get("profilePhoto");
  const now = new Date().toISOString();

  let profilePhotoUrl = existingPhotoUrl;

  if (isUploadedFile(photoFile)) {
    const uploadResult = await uploadGuruProfilePhoto({ file: photoFile, userId: user.id, guruId });
    if (uploadResult.error) {
      redirect(`/guru/application?error=${encodeURIComponent(uploadResult.error)}`);
    }
    profilePhotoUrl = uploadResult.url;
  }

  const profileCompletion = calculateProfileCompletion({
    displayName,
    phone,
    city,
    state,
    bio,
    hourlyRate,
    services,
    experienceYears,
    petExperience,
    serviceArea,
    availabilityNotes,
    emergencyContactName,
    emergencyContactPhone,
    safetyAgreementAccepted,
    profilePhotoUrl,
  });

  const currentStatus = asTrimmedString(guru.application_status) || "new";
  const nextStatus =
    currentStatus === "new" && profileCompletion < 80 ? "profile_incomplete" : currentStatus;

  const payload = {
    display_name: displayName || null,
    full_name: displayName || null,
    name: displayName || null,
    email: user.email || asTrimmedString(guru.email) || null,
    phone: phone || null,
    phone_number: phone || null,
    city: city || null,
    state: state || null,
    service_area: serviceArea || null,
    availability_notes: availabilityNotes || null,
    bio: bio || null,
    pet_experience: petExperience || null,
    service_title: serviceTitle || null,
    specialty: serviceTitle || null,
    title: serviceTitle || null,
    services,
    hourly_rate: hourlyRate || null,
    price: hourlyRate || null,
    experience_years: experienceYears || null,
    years_experience: experienceYears || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
    safety_agreement_accepted: safetyAgreementAccepted,
    safety_agreement_accepted_at: safetyAgreementAccepted ? now : null,
    avatar_url: profilePhotoUrl || null,
    photo_url: profilePhotoUrl || null,
    image_url: profilePhotoUrl || null,
    profile_photo_url: profilePhotoUrl || null,
    profile_completion: profileCompletion,
    application_status: nextStatus,
    status: "pending",
    is_bookable: false,
    updated_at: now,
  };

  const updateError = await updateWithColumnFallback({
    table: "gurus",
    idColumn: "id",
    idValue: guruId,
    payload,
  });

  if (updateError) {
    redirect(
      `/guru/application?error=${encodeURIComponent(
        updateError.message || "Unable to save your Guru application."
      )}`
    );
  }

  revalidatePath("/guru/application");
  revalidatePath("/guru/dashboard");
  revalidatePath("/admin/gurus");
  revalidatePath("/admin/guru-approvals");

  redirect("/guru/application?saved=1");
}

async function submitGuruApplication(formData: FormData) {
  "use server";

  const { user, guru } = await getCurrentGuru();
  const guruId = getGuruId(guru);

  const displayName = getFormString(formData, "displayName");
  const phone = getFormString(formData, "phone");
  const city = getFormString(formData, "city");
  const state = getFormString(formData, "state");
  const serviceArea = getFormString(formData, "serviceArea");
  const availabilityNotes = getFormString(formData, "availabilityNotes");
  const bio = getFormString(formData, "bio");
  const petExperience = getFormString(formData, "petExperience");
  const emergencyContactName = getFormString(formData, "emergencyContactName");
  const emergencyContactPhone = getFormString(formData, "emergencyContactPhone");
  const serviceTitle = getFormString(formData, "serviceTitle");
  const hourlyRate = Number(getFormString(formData, "hourlyRate")) || 0;
  const experienceYears = Number(getFormString(formData, "experienceYears")) || 0;
  const services = getSelectedServices(formData);
  const safetyAgreementAccepted = formData.get("safetyAgreementAccepted") === "on";
  const existingPhotoUrl = getGuruPhotoUrl(guru);
  const photoFile = formData.get("profilePhoto");
  const now = new Date().toISOString();

  let profilePhotoUrl = existingPhotoUrl;

  if (isUploadedFile(photoFile)) {
    const uploadResult = await uploadGuruProfilePhoto({ file: photoFile, userId: user.id, guruId });
    if (uploadResult.error) {
      redirect(`/guru/application?error=${encodeURIComponent(uploadResult.error)}`);
    }
    profilePhotoUrl = uploadResult.url;
  }

  const profileCompletion = calculateProfileCompletion({
    displayName,
    phone,
    city,
    state,
    bio,
    hourlyRate,
    services,
    experienceYears,
    petExperience,
    serviceArea,
    availabilityNotes,
    emergencyContactName,
    emergencyContactPhone,
    safetyAgreementAccepted,
    profilePhotoUrl,
  });

  if (!profilePhotoUrl) {
    redirect(
      `/guru/application?error=${encodeURIComponent(
        "Please upload a profile photo before submitting your Guru application."
      )}`
    );
  }

  if (profileCompletion < 80) {
    redirect(
      `/guru/application?error=${encodeURIComponent(
        "Please complete more of your profile before submitting for review. Aim for at least 80% complete."
      )}`
    );
  }

  const payload = {
    display_name: displayName || null,
    full_name: displayName || null,
    name: displayName || null,
    email: user.email || asTrimmedString(guru.email) || null,
    phone: phone || null,
    phone_number: phone || null,
    city: city || null,
    state: state || null,
    service_area: serviceArea || null,
    availability_notes: availabilityNotes || null,
    bio: bio || null,
    pet_experience: petExperience || null,
    service_title: serviceTitle || null,
    specialty: serviceTitle || null,
    title: serviceTitle || null,
    services,
    hourly_rate: hourlyRate || null,
    price: hourlyRate || null,
    experience_years: experienceYears || null,
    years_experience: experienceYears || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
    safety_agreement_accepted: safetyAgreementAccepted,
    safety_agreement_accepted_at: safetyAgreementAccepted ? now : null,
    avatar_url: profilePhotoUrl || null,
    photo_url: profilePhotoUrl || null,
    image_url: profilePhotoUrl || null,
    profile_photo_url: profilePhotoUrl || null,
    profile_completion: profileCompletion,
    application_status: "submitted",
    status: "pending",
    is_bookable: false,
    application_submitted_at: now,
    updated_at: now,
  };

  const updateError = await updateWithColumnFallback({
    table: "gurus",
    idColumn: "id",
    idValue: guruId,
    payload,
  });

  if (updateError) {
    redirect(
      `/guru/application?error=${encodeURIComponent(
        updateError.message || "Unable to submit your Guru application."
      )}`
    );
  }

  try {
    await supabaseAdmin.from("guru_application_events").insert({
      guru_id: guruId,
      admin_user_id: null,
      event_type: "submitted",
      old_status: asTrimmedString(guru.application_status) || "new",
      new_status: "submitted",
      note: "Guru submitted application for SitGuru review.",
      created_at: now,
    });
  } catch (error) {
    console.warn("Guru application event insert skipped:", error);
  }

  revalidatePath("/guru/application");
  revalidatePath("/guru/dashboard");
  revalidatePath("/admin/gurus");
  revalidatePath("/admin/guru-approvals");

  redirect("/guru/application?submitted=1");
}

async function sendAdminMessage(formData: FormData) {
  "use server";

  const { user, guru } = await getCurrentGuru();
  const guruId = getGuruId(guru);
  const subject = getFormString(formData, "subject");
  const message = getFormString(formData, "message");

  if (!message) {
    redirect(`/guru/application?error=${encodeURIComponent("Please enter a message before sending.")}`);
  }

  try {
    const { error } = await supabaseAdmin.from("guru_admin_messages").insert({
      guru_id: guruId,
      user_id: user.id,
      sender_role: "guru",
      subject: subject || "Guru application question",
      message,
      status: "open",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Guru admin message insert skipped:", error);
      redirect(
        `/guru/application?error=${encodeURIComponent(
          "Message could not be saved yet. Please make sure the guru_admin_messages table exists."
        )}`
      );
    }
  } catch (error) {
    console.warn("Guru admin message insert skipped:", error);
    redirect(
      `/guru/application?error=${encodeURIComponent(
        "Message could not be saved yet. Please make sure the guru_admin_messages table exists."
      )}`
    );
  }

  revalidatePath("/guru/application");
  revalidatePath("/guru/dashboard");

  redirect("/guru/application?message=1");
}

function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-200">
        {label}
        {required ? <span className="text-emerald-300"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50"
      />
    </label>
  );
}

function FileInput({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-200">
        {label}
        {required ? <span className="text-emerald-300"> *</span> : null}
      </span>
      <input
        name={name}
        type="file"
        accept="image/*"
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950 hover:file:bg-emerald-400"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Upload a clear, friendly profile photo. JPG, PNG, or WebP. Max 5MB.
      </p>
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 5,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-200">
        {label}
        {required ? <span className="text-emerald-300"> *</span> : null}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50"
      />
    </label>
  );
}

function RequirementPill({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        complete
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/20 bg-amber-400/10 text-amber-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{label}</span>
        <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-black">
          {complete ? "Complete" : "Needed"}
        </span>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
  active = false,
  complete = false,
}: {
  number: string;
  title: string;
  text: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        complete
          ? "border-emerald-400/20 bg-emerald-400/10"
          : active
            ? "border-amber-400/25 bg-amber-400/10"
            : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
            complete
              ? "bg-emerald-500 text-slate-950"
              : active
                ? "bg-amber-400 text-slate-950"
                : "bg-white/10 text-white"
          }`}
        >
          {number}
        </div>
        <div>
          <h3 className="font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function SubmittedWelcomeNotice() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_32%),linear-gradient(135deg,#052e2b,#0f172a_55%,#020617)] p-6 shadow-[0_24px_80px_rgba(16,185,129,0.14)] sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            Application Submitted
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            We’re happy to have you as part of the SitGuru team.
          </h2>

          <p className="mt-4 text-base leading-8 text-slate-200 sm:text-lg">
            Thank you for applying to become a Guru on SitGuru, a premier pet care
            platform built around trust, dependable care, and stronger local
            connections between pet parents and providers.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Your application has been submitted to SitGuru for review. Our team
            will review your profile, services, experience, safety information,
            and trust details. If we need anything else, we’ll contact you through
            your SitGuru messages or update your application status.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 lg:min-w-[280px]">
          <p className="text-sm font-black text-emerald-100">What happens next?</p>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
            <p>✓ SitGuru reviews your profile</p>
            <p>✓ Admin checks required application details</p>
            <p>✓ Trust and safety steps are confirmed</p>
            <p>✓ You’ll be notified if more information is needed</p>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm font-black text-emerald-100">
              Full access unlocks after approval
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Your full Guru dashboard unlocks once SitGuru approves your
              application and makes your profile bookable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function GuruApplicationPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { guru } = await getCurrentGuru();

  const selectedServices = getGuruServices(guru);
  const displayName =
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name);
  const phone = asTrimmedString(guru.phone) || asTrimmedString(guru.phone_number);
  const city = asTrimmedString(guru.city);
  const state = asTrimmedString(guru.state) || asTrimmedString(guru.state_code);
  const bio = asTrimmedString(guru.bio);
  const serviceTitle =
    asTrimmedString(guru.service_title) ||
    asTrimmedString(guru.specialty) ||
    asTrimmedString(guru.title);
  const hourlyRate = toNumber(guru.hourly_rate) || toNumber(guru.price);
  const experienceYears =
    toNumber(guru.experience_years) ||
    toNumber(guru.years_experience) ||
    toNumber(guru.years_of_experience);
  const petExperience = asTrimmedString(guru.pet_experience);
  const serviceArea = asTrimmedString(guru.service_area);
  const availabilityNotes = asTrimmedString(guru.availability_notes);
  const emergencyContactName = asTrimmedString(guru.emergency_contact_name);
  const emergencyContactPhone = asTrimmedString(guru.emergency_contact_phone);
  const safetyAgreementAccepted = toBoolean(guru.safety_agreement_accepted);
  const profilePhotoUrl = getGuruPhotoUrl(guru);

  const profileCompletion =
    toNumber(guru.profile_completion) ||
    calculateProfileCompletion({
      displayName,
      phone,
      city,
      state,
      bio,
      hourlyRate,
      services: selectedServices,
      experienceYears,
      petExperience,
      serviceArea,
      availabilityNotes,
      emergencyContactName,
      emergencyContactPhone,
      safetyAgreementAccepted,
      profilePhotoUrl,
    });

  const applicationStatus = asTrimmedString(guru.application_status) || "new";
  const statusLabel = getApplicationStatusLabel(applicationStatus);
  const isBookable =
    toBoolean(guru.is_bookable) ||
    applicationStatus === "bookable" ||
    asTrimmedString(guru.status).toLowerCase() === "active";

  const identityStatus = getCredentialStatus(guru.stripe_identity_status || guru.identity_status);
  const backgroundStatus = getCredentialStatus(guru.background_check_status);
  const safetyCertStatus = getCredentialStatus(guru.safety_cert_status);
  const stripeConnectStatus = getCredentialStatus(guru.stripe_connect_status);

  const requiredChecks = {
    basicInfo: Boolean(displayName && phone),
    location: Boolean(city && state),
    profilePhoto: Boolean(profilePhotoUrl),
    services: selectedServices.length > 0,
    rate: hourlyRate > 0,
    bio: Boolean(bio),
    experience: experienceYears > 0 && Boolean(petExperience),
    serviceArea: Boolean(serviceArea),
    availability: Boolean(availabilityNotes),
    emergencyContact: Boolean(emergencyContactName && emergencyContactPhone),
    safetyAgreement: safetyAgreementAccepted,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              Guru Application
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Complete Your Guru Application
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              Finish your profile, services, profile photo, experience, and trust
              steps so SitGuru can review your application and unlock your full Guru dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              form={guruApplicationFormId}
              type="submit"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
            >
              Save Progress
            </button>

            <Link
              href="/guru/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/guru/messages"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Messages
            </Link>

            {isBookable ? (
              <Link
                href="/guru/profile"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Public Profile
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {resolvedSearchParams.saved ? (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
            Your Guru application progress has been saved.
          </div>
        ) : null}

        {resolvedSearchParams.submitted ? <SubmittedWelcomeNotice /> : null}

        {resolvedSearchParams.message ? (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
            Your message has been sent to SitGuru.
          </div>
        ) : null}

        {resolvedSearchParams.error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm font-bold text-rose-100">
            {resolvedSearchParams.error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_32%),linear-gradient(180deg,#0f172a,#020617)] p-6 sm:p-8">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Apply Free. Get Approved. Get Booked.
            </span>

            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Unlock full Guru access.
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Your full Guru dashboard stays locked until your application,
              profile photo, profile details, trust steps, background screening,
              and SitGuru approval are complete. Once Admin makes you bookable,
              your full dashboard unlocks automatically.
            </p>

            <div className="mt-6 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-5">
              <p className="text-sm font-black text-emerald-100">
                No upfront screening fee to apply
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                If approved, screening costs may be deducted from your first
                completed SitGuru booking.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Application Status
            </p>

            <div
              className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-black ${getApplicationStatusClasses(
                applicationStatus
              )}`}
            >
              {statusLabel}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-white">Profile Completion</p>
                <p className="text-2xl font-black text-white">{profileCompletion}%</p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, profileCompletion)}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                You can submit for review once your application is at least 80%
                complete. A profile photo is required before submitting. SitGuru
                still controls final approval and bookable status.
              </p>
            </div>

            {profilePhotoUrl ? (
              <div className="mt-6 flex items-center gap-4 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4">
                <img
                  src={profilePhotoUrl}
                  alt="Guru profile photo"
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-sm font-black text-emerald-100">Profile photo uploaded</p>
                  <p className="mt-1 text-sm text-slate-300">
                    You can upload a new photo below to replace it.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-sm font-black text-amber-100">Profile photo required</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Upload a clear photo before submitting your application for review.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Stripe Connect", stripeConnectStatus],
                ["Identity", identityStatus],
                ["Background", backgroundStatus],
                ["Safety Cert", safetyCertStatus],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-2xl border px-4 py-3 ${credentialClasses(value)}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em]">{label}</p>
                  <p className="mt-2 text-sm font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Steps to Unlock Full Access
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Work through your application checklist
            </h2>

            <div className="mt-6 grid gap-4">
              <StepCard number="1" title="Create account" text="Your Guru account is active." complete />
              <StepCard
                number="2"
                title="Complete profile"
                text="Add your name, phone, city, state, profile photo, services, and rates."
                active={profileCompletion < 80}
                complete={profileCompletion >= 80}
              />
              <StepCard
                number="3"
                title="Submit application"
                text="Send your completed profile to SitGuru for Admin review."
                active={profileCompletion >= 80 && applicationStatus !== "submitted"}
                complete={[
                  "submitted",
                  "reviewing",
                  "pre_approved",
                  "verification_pending",
                  "approved",
                  "bookable",
                ].includes(applicationStatus)}
              />
              <StepCard
                number="4"
                title="SitGuru review"
                text="Admin reviews your profile and may request more information."
                active={["submitted", "reviewing", "needs_info"].includes(applicationStatus)}
                complete={["pre_approved", "verification_pending", "approved", "bookable"].includes(
                  applicationStatus
                )}
              />
              <StepCard
                number="5"
                title="Verification"
                text="Complete identity, background, and payout steps when requested."
                active={["pre_approved", "verification_pending"].includes(applicationStatus)}
                complete={["approved", "bookable"].includes(applicationStatus)}
              />
              <StepCard
                number="6"
                title="Full access unlocked"
                text="Admin makes your profile bookable and your full dashboard unlocks."
                active={applicationStatus === "approved"}
                complete={isBookable}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-400/15 bg-emerald-400/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Message SitGuru
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Need help with your application?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Ask SitGuru about your profile, background check, verification,
              missing information, or anything you need before approval.
            </p>

            <form action={sendAdminMessage} className="mt-6 space-y-4">
              <TextInput label="Subject" name="subject" placeholder="Question about my Guru application" />
              <TextArea label="Message" name="message" placeholder="Type your message to SitGuru..." rows={6} required />
              <button
                type="submit"
                className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
              >
                Send Message to SitGuru
              </button>
            </form>
          </div>
        </section>

        <form id={guruApplicationFormId} action={saveGuruApplication} className="space-y-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                  Profile Builder
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Complete your Guru profile
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  This information helps SitGuru review your application and helps
                  customers understand your care style once you are approved and bookable.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-black text-white">Required to submit</p>
                <p className="mt-2 leading-6">
                  Aim for at least 80% completion and upload a profile photo before
                  submitting your application for review.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <TextInput label="Display name" name="displayName" defaultValue={displayName} placeholder="Example: Jane Smith" required />
                <TextInput label="Phone number" name="phone" defaultValue={phone} placeholder="Example: 555-123-4567" required />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput label="City" name="city" defaultValue={city} placeholder="Example: Pittsburgh" required />
                  <TextInput label="State" name="state" defaultValue={state} placeholder="Example: PA" required />
                </div>
                <FileInput label={profilePhotoUrl ? "Replace profile photo" : "Upload profile photo"} name="profilePhoto" required={!profilePhotoUrl} />
                <TextInput label="Service title" name="serviceTitle" defaultValue={serviceTitle} placeholder="Example: Loving dog walker and sitter" required />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput label="Starting hourly rate" name="hourlyRate" type="number" defaultValue={hourlyRate || ""} placeholder="25" required />
                  <TextInput label="Years of pet care experience" name="experienceYears" type="number" defaultValue={experienceYears || ""} placeholder="3" required />
                </div>
              </div>

              <div className="space-y-5">
                <TextArea
                  label="Short Guru bio"
                  name="bio"
                  defaultValue={bio}
                  placeholder="Tell pet parents who you are, your care style, and why pets are safe with you."
                  rows={6}
                  required
                />
                <TextArea
                  label="Pet care experience"
                  name="petExperience"
                  defaultValue={petExperience}
                  placeholder="Tell us about the pets you have cared for, special needs, medication experience, senior pets, puppies, anxious pets, etc."
                  rows={6}
                  required
                />
                <TextInput label="Service area" name="serviceArea" defaultValue={serviceArea} placeholder="Example: Pittsburgh, PA and nearby areas" required />
                <TextArea label="Availability notes" name="availabilityNotes" defaultValue={availabilityNotes} placeholder="Example: Weekday evenings, weekends, flexible for drop-ins." rows={4} required />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Services</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Select the pet care services you offer</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Choose the services you are comfortable offering. You can update these later after SitGuru approval.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {serviceOptions.map((service) => {
                  const checked = selectedServices.includes(service);
                  return (
                    <label key={service} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                      <input type="checkbox" name="services" value={service} defaultChecked={checked} className="h-4 w-4 accent-emerald-500" />
                      {service}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Trust & Safety</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Required before becoming bookable</h2>
              <div className="mt-6 space-y-4">
                <TextInput label="Emergency contact name" name="emergencyContactName" defaultValue={emergencyContactName} placeholder="Emergency contact full name" required />
                <TextInput label="Emergency contact phone" name="emergencyContactPhone" defaultValue={emergencyContactPhone} placeholder="Emergency contact phone number" required />
                <label className="flex gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <input type="checkbox" name="safetyAgreementAccepted" defaultChecked={safetyAgreementAccepted} className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" />
                  <span>
                    <span className="block text-sm font-black text-emerald-100">I agree to follow SitGuru’s safety standards.</span>
                    <span className="mt-2 block text-sm leading-6 text-slate-300">
                      I understand I must provide trustworthy pet care, follow customer instructions, keep pets safe,
                      communicate clearly, and complete required verification before becoming bookable.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Checklist</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Required profile items</h2>
              <div className="mt-6 grid gap-3">
                <RequirementPill label="Name and phone" complete={requiredChecks.basicInfo} />
                <RequirementPill label="City and state" complete={requiredChecks.location} />
                <RequirementPill label="Profile photo" complete={requiredChecks.profilePhoto} />
                <RequirementPill label="Services selected" complete={requiredChecks.services} />
                <RequirementPill label="Starting rate" complete={requiredChecks.rate} />
                <RequirementPill label="Bio" complete={requiredChecks.bio} />
                <RequirementPill label="Experience details" complete={requiredChecks.experience} />
                <RequirementPill label="Service area" complete={requiredChecks.serviceArea} />
                <RequirementPill label="Availability" complete={requiredChecks.availability} />
                <RequirementPill label="Emergency contact" complete={requiredChecks.emergencyContact} />
                <RequirementPill label="Safety agreement" complete={requiredChecks.safetyAgreement} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Submit for Review</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Ready for SitGuru to review?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Save your progress anytime. Once your application is at least 80% complete and your profile photo is uploaded,
                submit it for SitGuru review. Admin may request more information before pre-approval or verification.
              </p>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-black text-white">Full dashboard remains locked</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Booking requests, earnings, customer activity, and full Guru tools unlock only after SitGuru makes your profile bookable.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto">
                  Save Progress
                </button>
                <button formAction={submitGuruApplication} type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 sm:w-auto">
                  Submit Application for Review
                </button>
              </div>
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}
