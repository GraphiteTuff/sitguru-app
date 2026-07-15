import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  GraduationCap,
  HandCoins,
  ImageOff,
  Mail,
  MessageCircle,
  MapPin,
  PauseCircle,
  PawPrint,
  Phone,
  PlayCircle,
  QrCode,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AmbassadorRow = {
  id: string;
  user_id: string | null;
  lead_id: string | null;
  full_name: string | null;
  display_name?: string | null;
  email: string | null;
  phone: string | null;
  program: string | null;
  internal_role: string | null;
  source: string | null;
  status: string | null;
  referral_status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
  referral_code: string | null;
  referral_link: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  notes: string | null;
  resume_label: string | null;
  resume_url: string | null;
  cover_letter_label: string | null;
  cover_letter_url: string | null;
  other_document_label: string | null;
  other_document_url: string | null;
  training_status: string | null;
  training_percent: number | null;
  onboarding_step?: number | null;
  onboarding_percent?: number | null;
  training_completed_at?: string | null;
  onboarding_completed_at?: string | null;
  documents_completed_at?: string | null;
  certification_signed_at?: string | null;
  certification_name?: string | null;
  eligibility_review_required: boolean | null;
  eligibility_review_complete: boolean | null;
  terms_accepted_at: string | null;
  activated_at: string | null;
  archived_at: string | null;
  archived_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  ambassador_photo_url: string | null;
  ambassador_photo_path: string | null;
  photo_approved: boolean | null;
  photo_uploaded_at: string | null;
  photo_approved_at: string | null;
  photo_approved_by: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  payout_status: string | null;
  payout_method: string | null;
  tax_info_status: string | null;
  ready_for_payout_at: string | null;
};

type ReferralRow = {
  id: string;
  ambassador_id: string;
  referral_code: string | null;
  referral_type: "pet_parent" | "guru" | "business" | string;
  referred_user_id: string | null;
  referred_lead_id: string | null;
  booking_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  status: string | null;
  booking_status: string | null;
  signup_date: string | null;
  qualified_at: string | null;
  completed_booking_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RewardRow = {
  id: string;
  ambassador_id: string;
  referral_id: string | null;
  booking_id: string | null;
  reward_type: string | null;
  commission_category: string | null;
  financial_category: string | null;
  amount: number | null;
  status: string | null;
  financial_status: string | null;
  payout_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  rejected_at: string | null;
  voided_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TrainingRow = {
  id: string;
  ambassador_id: string;
  training_item: string | null;
  status: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TrainingStepRow = {
  id: string;
  step_number: number | null;
  title: string | null;
  description: string | null;
  content_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  video_url: string | null;
  estimated_minutes: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
  requires_acknowledgment: boolean | null;
  requires_signature: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type TrainingProgressRow = {
  id: string;
  ambassador_id: string | null;
  training_step_id: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  acknowledged_at: string | null;
  signed_at: string | null;
  signature_name: string | null;
  signature_ip: string | null;
  certification_text: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminTrainingStep = TrainingStepRow & {
  progress: TrainingProgressRow | null;
};

type RequiredDocumentRow = {
  id: string;
  title: string | null;
  description: string | null;
  document_type: string | null;
  is_required: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type DocumentSubmissionRow = {
  id: string;
  ambassador_id: string | null;
  required_document_id: string | null;
  document_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: string | null;
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminRequiredDocument = RequiredDocumentRow & {
  submissions: DocumentSubmissionRow[];
};

type CompletionItem = {
  key: string;
  label: string;
  complete: boolean;
  required: boolean;
  detail: string;
};

type CompletionSummary = {
  score: number;
  completeRequired: boolean;
  completedRequiredCount: number;
  requiredCount: number;
  missingRequiredItems: CompletionItem[];
  items: CompletionItem[];
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

const AMBASSADOR_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interviewed", label: "Interviewed" },
  { value: "conditional_offer_sent", label: "Conditional Offer Sent" },
  { value: "onboarding_sent", label: "Onboarding Sent" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "nurture", label: "Nurture" },
  { value: "not_a_fit", label: "Not a Fit" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const ambassadorQuickActions = [
  {
    label: "Onboarding Sent",
    value: "onboarding_sent",
    icon: <Send className="h-3.5 w-3.5" />,
    className:
      "bg-blue-50 text-blue-800 ring-blue-100 hover:bg-blue-100 hover:text-blue-900",
  },
  {
    label: "Active",
    value: "active",
    icon: <PlayCircle className="h-3.5 w-3.5" />,
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100 hover:text-emerald-900",
  },
  {
    label: "Pause",
    value: "paused",
    icon: <PauseCircle className="h-3.5 w-3.5" />,
    className:
      "bg-amber-50 text-amber-800 ring-amber-100 hover:bg-amber-100 hover:text-amber-900",
  },
  {
    label: "Archive",
    value: "archived",
    icon: <Archive className="h-3.5 w-3.5" />,
    className:
      "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100 hover:text-red-800",
  },
];

function isSuperUserEmail(email: string | null | undefined) {
  return SUPER_USER_EMAILS.has((email || "").toLowerCase());
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isArchivedAmbassador(ambassador: AmbassadorRow) {
  return ambassador.status === "archived" || Boolean(ambassador.archived_at);
}

type AmbassadorStatusAccess = {
  dashboardEnabled: boolean;
  loginEnabled: boolean;
  referralStatus: "pending" | "active" | "paused" | "inactive" | "archived";
};

function getAmbassadorStatusAccess(
  nextStatus: string,
): AmbassadorStatusAccess {
  if (nextStatus === "active") {
    return {
      dashboardEnabled: true,
      loginEnabled: true,
      referralStatus: "active",
    };
  }

  if (nextStatus === "paused") {
    return {
      dashboardEnabled: true,
      loginEnabled: true,
      referralStatus: "paused",
    };
  }

  if (nextStatus === "archived") {
    return {
      dashboardEnabled: false,
      loginEnabled: false,
      referralStatus: "archived",
    };
  }

  if (nextStatus === "inactive" || nextStatus === "not_a_fit") {
    return {
      dashboardEnabled: false,
      loginEnabled: false,
      referralStatus: "inactive",
    };
  }

  return {
    dashboardEnabled: true,
    loginEnabled: true,
    referralStatus: "pending",
  };
}

async function applyAmbassadorStatusUpdate({
  supabase,
  ambassadorId,
  nextStatus,
  archivedReason,
}: {
  supabase: SupabaseServerClient;
  ambassadorId: string;
  nextStatus: string;
  archivedReason: string;
}) {
  const { data: ambassadorRecord, error: ambassadorLookupError } =
    await supabase
      .from("ambassadors")
      .select("user_id")
      .eq("id", ambassadorId)
      .maybeSingle();

  if (ambassadorLookupError) {
    throw new Error(ambassadorLookupError.message);
  }

  if (!ambassadorRecord) {
    throw new Error("Ambassador record was not found.");
  }

  const now = new Date().toISOString();
  const access = getAmbassadorStatusAccess(nextStatus);

  const updatePayload = {
    status: nextStatus,
    referral_status: access.referralStatus,
    dashboard_enabled: access.dashboardEnabled,
    login_enabled: access.loginEnabled,
    archived_at: nextStatus === "archived" ? now : null,
    archived_reason: nextStatus === "archived" ? archivedReason : null,
    updated_at: now,
    ...(nextStatus === "active" ? { activated_at: now } : {}),
  };

  const { error: updateError } = await supabase
    .from("ambassadors")
    .update(updatePayload)
    .eq("id", ambassadorId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (
    ambassadorRecord.user_id &&
    access.dashboardEnabled &&
    access.loginEnabled
  ) {
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: ambassadorRecord.user_id,
        role: "ambassador",
        updated_at: now,
      },
      {
        onConflict: "user_id,role",
      },
    );

    if (roleError) {
      throw new Error(
        `Ambassador status was updated, but workspace role synchronization failed: ${roleError.message}`,
      );
    }
  }

  return {
    now,
    access,
  };
}

async function getActivationCompletionSummary(
  supabase: SupabaseServerClient,
  ambassadorId: string,
) {
  const [
    { data: ambassador },
    { data: trainingStepsData },
    { data: trainingProgressData },
    { data: requiredDocumentsData },
    { data: documentSubmissionsData },
  ] = await Promise.all([
    supabase.from("ambassadors").select("*").eq("id", ambassadorId).maybeSingle(),
    supabase
      .from("ambassador_training_steps")
      .select("*")
      .eq("is_active", true)
      .order("step_number", { ascending: true }),
    supabase
      .from("ambassador_training_progress")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: true }),
    supabase
      .from("ambassador_required_documents")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ambassador_document_submissions")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("submitted_at", { ascending: false }),
  ]);

  const ambassadorRow = ambassador as AmbassadorRow | null;

  if (!ambassadorRow) {
    return null;
  }

  const trainingSteps = buildAdminTrainingSteps(
    (trainingStepsData || []) as TrainingStepRow[],
    (trainingProgressData || []) as TrainingProgressRow[],
  );
  const trainingCounts = getRequiredTrainingCounts(trainingSteps);
  const trainingPercent =
    getAdminTrainingPercent(trainingSteps) ||
    numberValue(ambassadorRow.onboarding_percent) ||
    numberValue(ambassadorRow.training_percent);

  const requiredDocuments = buildAdminRequiredDocuments(
    (requiredDocumentsData || []) as RequiredDocumentRow[],
    (documentSubmissionsData || []) as DocumentSubmissionRow[],
  );
  const documentCounts = getDocumentCompletionCounts(requiredDocuments);

  return buildProfileCompletionSummary({
    ambassador: ambassadorRow,
    trainingCounts,
    trainingPercent,
    documentCounts,
  });
}

async function updateAmbassadorStatus(
  ambassadorId: string,
  formData: FormData,
) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const nextStatus = String(formData.get("status") || "").trim();

  const isAllowedStatus = AMBASSADOR_STATUSES.some(
    (status) => status.value === nextStatus,
  );

  if (!isAllowedStatus) {
    throw new Error("Invalid Ambassador status.");
  }

  if (nextStatus === "active") {
    const completion = await getActivationCompletionSummary(
      supabase,
      ambassadorId,
    );

    if (!completion?.completeRequired) {
      redirect(`/admin/ambassadors/${ambassadorId}?activation=blocked`);
    }
  }

  const { access } = await applyAmbassadorStatusUpdate({
    supabase,
    ambassadorId,
    nextStatus,
    archivedReason:
      "Archived from Ambassador detail status control. Retained for applicant and contractor recordkeeping.",
  });

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "status_update",
    activity_title:
      nextStatus === "archived"
        ? "Ambassador archived"
        : `Status updated to ${prettyStatus(nextStatus)}`,
    activity_notes: `Updated by ${
      user.email || "Super Admin"
    } from the Ambassador detail page. Workspace access: ${
      access.dashboardEnabled && access.loginEnabled ? "enabled" : "disabled"
    }. Referral status: ${prettyStatus(access.referralStatus)}.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);
  revalidatePath("/admin/hr");

  redirect(`/admin/ambassadors/${ambassadorId}?updated=success`);
}

async function updateAmbassadorPipelineStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const ambassadorId = asString(formData.get("ambassador_id"));
  const nextStatus = asString(formData.get("next_status"));
  const ambassadorName =
    asString(formData.get("ambassador_name")) || "Ambassador";

  if (!ambassadorId || !nextStatus) {
    redirect("/admin/ambassadors");
  }

  const isAllowedStatus = AMBASSADOR_STATUSES.some(
    (status) => status.value === nextStatus,
  );

  if (!isAllowedStatus) {
    throw new Error("Invalid Ambassador status.");
  }

  if (nextStatus === "active") {
    const completion = await getActivationCompletionSummary(
      supabase,
      ambassadorId,
    );

    if (!completion?.completeRequired) {
      redirect(`/admin/ambassadors/${ambassadorId}?activation=blocked`);
    }
  }

  const { access } = await applyAmbassadorStatusUpdate({
    supabase,
    ambassadorId,
    nextStatus,
    archivedReason:
      "Archived from Ambassador detail quick action. Retained for applicant and contractor recordkeeping.",
  });

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "status_update",
    activity_title:
      nextStatus === "archived"
        ? "Ambassador archived"
        : `Ambassador status updated to ${prettyStatus(nextStatus)}`,
    activity_notes: `${ambassadorName} was updated by ${
      user.email || "Super Admin"
    } from the Ambassador detail quick actions. Workspace access: ${
      access.dashboardEnabled && access.loginEnabled ? "enabled" : "disabled"
    }. Referral status: ${prettyStatus(access.referralStatus)}.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);
  revalidatePath("/admin/hr");

  redirect(`/admin/ambassadors/${ambassadorId}?updated=success`);
}

async function updateAmbassadorPhoto(
  ambassadorId: string,
  formData: FormData,
) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const photoUrl = String(formData.get("ambassador_photo_url") || "").trim();
  const photoPath = String(formData.get("ambassador_photo_path") || "").trim();

  const hasPhoto = Boolean(photoUrl || photoPath);

  const { error } = await supabase
    .from("ambassadors")
    .update({
      ambassador_photo_url: photoUrl || null,
      ambassador_photo_path: photoPath || null,
      photo_uploaded_at: hasPhoto ? new Date().toISOString() : null,
      photo_approved: false,
      photo_approved_at: null,
      photo_approved_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "photo_update",
    activity_title: hasPhoto
      ? "Ambassador photo added or updated"
      : "Ambassador photo cleared",
    activity_notes: `Photo record updated by ${user.email || "Super Admin"}.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);

  redirect(`/admin/ambassadors/${ambassadorId}?photo=updated`);
}

async function approveAmbassadorPhoto(ambassadorId: string) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const { error } = await supabase
    .from("ambassadors")
    .update({
      photo_approved: true,
      photo_approved_at: new Date().toISOString(),
      photo_approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "photo_approval",
    activity_title: "Ambassador photo approved",
    activity_notes: `Approved by ${user.email || "Super Admin"}.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);

  redirect(`/admin/ambassadors/${ambassadorId}?photo=approved`);
}

async function clearAmbassadorPhoto(ambassadorId: string) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const { error } = await supabase
    .from("ambassadors")
    .update({
      ambassador_photo_url: null,
      ambassador_photo_path: null,
      photo_uploaded_at: null,
      photo_approved: false,
      photo_approved_at: null,
      photo_approved_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "photo_clear",
    activity_title: "Ambassador photo removed",
    activity_notes: `Removed by ${user.email || "Super Admin"}.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);

  redirect(`/admin/ambassadors/${ambassadorId}?photo=cleared`);
}

function numberValue(value: number | null | undefined) {
  return Number(value || 0);
}

function currency(value: number | null | undefined) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function prettyStatus(status: string | null | undefined) {
  if (!status) return "New";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not saved";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case "active":
    case "complete":
    case "qualified":
    case "booking_completed":
    case "paid":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "conditional_offer_sent":
    case "onboarding_sent":
    case "approved":
    case "ready_for_payout":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "pending":
    case "pending_review":
    case "booking_needed":
    case "application_started":
    case "profile_started":
    case "profile_completed":
    case "in_progress":
    case "paused":
    case "nurture":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "archived":
      return "bg-red-100 text-red-700 ring-red-200";
    case "not_a_fit":
    case "inactive":
    case "not_qualified":
    case "cancelled":
    case "rejected":
    case "voided":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function photoStatusClass(
  hasPhoto: boolean,
  approved: boolean | null | undefined,
) {
  if (!hasPhoto) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (approved) return "bg-emerald-100 text-emerald-800 ring-emerald-200";

  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function photoStatusLabel(
  hasPhoto: boolean,
  approved: boolean | null | undefined,
) {
  if (!hasPhoto) return "No Photo Uploaded";
  if (approved) return "Photo Approved";

  return "Photo Pending Review";
}

function getInitials(name: string | null | undefined) {
  const cleanName = name || "SitGuru Ambassador";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function referralTypeLabel(type: string | null | undefined) {
  switch (type) {
    case "pet_parent":
      return "Pet Parent";
    case "guru":
      return "Guru";
    case "business":
      return "Business";
    default:
      return "Referral";
  }
}

function getReferralDisplayName(referral: ReferralRow) {
  if (referral.referral_type === "business") {
    return referral.business_name || referral.display_name || "Unnamed Business";
  }

  return referral.display_name || "Unnamed Referral";
}

function getReferralSubtext(referral: ReferralRow) {
  const location = [referral.city, referral.state].filter(Boolean).join(", ");

  if (referral.referral_type === "business") {
    return [referral.business_type, location].filter(Boolean).join(" • ");
  }

  return location || referral.email || "Location not saved";
}

function getAmbassadorName(ambassador: AmbassadorRow) {
  return (
    ambassador.full_name ||
    ambassador.display_name ||
    ambassador.email ||
    "Unnamed Ambassador"
  );
}

function getAmbassadorRoleLabel(ambassador: AmbassadorRow) {
  const source = asString(ambassador.source).toLowerCase();
  const program = asString(ambassador.program).toLowerCase();
  const internalRole = asString(ambassador.internal_role).toLowerCase();

  if (source.includes("careerlink") || source.includes("career link")) {
    return "Community Ambassador";
  }

  if (program.includes("student") || internalRole.includes("student")) {
    return "Student Ambassador";
  }

  if (program.includes("veteran")) {
    return "Veteran Ambassador";
  }

  if (program.includes("military")) {
    return "Military Ambassador";
  }

  if (program.includes("trainer")) {
    return "Trainer Ambassador";
  }

  if (program.includes("groomer")) {
    return "Groomer Ambassador";
  }

  if (program.includes("vet") || program.includes("veterinary")) {
    return "Vet Tech Ambassador";
  }

  if (program.includes("community")) {
    return "Community Ambassador";
  }

  return "Ambassador";
}

function buildAmbassadorMessageHref({
  ambassador,
  ambassadorName,
  threadType,
}: {
  ambassador: AmbassadorRow;
  ambassadorName: string;
  threadType:
    | "ambassador_support"
    | "ambassador_guru_followup"
    | "ambassador_admin_note";
}) {
  const params = new URLSearchParams({
    threadType,
    inquiry: "partner",
    source: "admin_ambassador_dashboard",
    ambassadorId: ambassador.id,
    ambassadorName,
    referralCode: ambassador.referral_code || "",
    recipientRole: "ambassador",
  });

  if (ambassador.email) {
    params.set("recipientEmail", ambassador.email);
    params.set("ambassadorEmail", ambassador.email);
  }

  params.set("recipientName", ambassadorName);

  return `/admin/messages?${params.toString()}`;
}

function buildDetailCards(
  referrals: ReferralRow[],
  rewards: RewardRow[],
  trainingPercent: number,
) {
  const petParentCount = referrals.filter(
    (referral) => referral.referral_type === "pet_parent",
  ).length;

  const guruCount = referrals.filter(
    (referral) => referral.referral_type === "guru",
  ).length;

  const businessCount = referrals.filter(
    (referral) => referral.referral_type === "business",
  ).length;

  const completedBookings = referrals.filter(
    (referral) => referral.booking_status === "booking_completed",
  ).length;

  const pendingRewards = rewards
    .filter((reward) =>
      ["pending", "pending_review"].includes(reward.status || ""),
    )
    .reduce((sum, reward) => sum + numberValue(reward.amount), 0);

  const approvedRewards = rewards
    .filter((reward) => reward.status === "approved")
    .reduce((sum, reward) => sum + numberValue(reward.amount), 0);

  const readyRewards = rewards
    .filter((reward) => reward.status === "ready_for_payout")
    .reduce((sum, reward) => sum + numberValue(reward.amount), 0);

  const paidRewards = rewards
    .filter((reward) => reward.status === "paid")
    .reduce((sum, reward) => sum + numberValue(reward.amount), 0);

  return [
    {
      label: "Pet Parent Signups",
      value: petParentCount.toLocaleString(),
      subtext: "Referred Pet Parents",
      icon: PawPrint,
    },
    {
      label: "Guru Signups",
      value: guruCount.toLocaleString(),
      subtext: "Referred Gurus",
      icon: Users,
    },
    {
      label: "Business Signups",
      value: businessCount.toLocaleString(),
      subtext: "Local business/community leads",
      icon: BriefcaseBusiness,
    },
    {
      label: "Completed Bookings",
      value: completedBookings.toLocaleString(),
      subtext: "Referral-linked completed bookings",
      icon: CheckCircle2,
    },
    {
      label: "Pending Rewards",
      value: currency(pendingRewards),
      subtext: "Not yet approved",
      icon: Award,
    },
    {
      label: "Approved Rewards",
      value: currency(approvedRewards),
      subtext: "Approved unpaid rewards",
      icon: HandCoins,
    },
    {
      label: "Ready for Payout",
      value: currency(readyRewards),
      subtext: "Queued rewards",
      icon: Wallet,
    },
    {
      label: "Paid Rewards",
      value: currency(paidRewards),
      subtext: "Rewards already paid",
      icon: Wallet,
    },
    {
      label: "Training",
      value: `${trainingPercent}%`,
      subtext: "Training completion",
      icon: GraduationCap,
    },
  ];
}

function AmbassadorQuickActions({
  ambassador,
  ambassadorName,
  canActivate,
}: {
  ambassador: AmbassadorRow;
  ambassadorName: string;
  canActivate: boolean;
}) {
  if (isArchivedAmbassador(ambassador)) {
    return (
      <form action={updateAmbassadorPipelineStatus}>
        <input type="hidden" name="ambassador_id" value={ambassador.id} />
        <input type="hidden" name="ambassador_name" value={ambassadorName} />
        <input type="hidden" name="next_status" value="contacted" />
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-50 px-5 py-2 text-sm font-extrabold text-green-800 ring-1 ring-green-100 transition hover:bg-green-100 sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Restore Ambassador
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {ambassadorQuickActions.map((action) => {
        const isActiveAction = action.value === "active";
        const disabled = isActiveAction && !canActivate;

        return (
          <form key={action.value} action={updateAmbassadorPipelineStatus}>
            <input type="hidden" name="ambassador_id" value={ambassador.id} />
            <input type="hidden" name="ambassador_name" value={ambassadorName} />
            <input type="hidden" name="next_status" value={action.value} />
            <button
              type="submit"
              disabled={disabled}
              title={
                disabled
                  ? "Basic referral setup must be complete before this Ambassador can start referring."
                  : undefined
              }
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition ${
                disabled
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
                  : action.className
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}

function isAdminTrainingComplete(step: AdminTrainingStep) {
  const status = (step.progress?.status || "").toLowerCase();

  return Boolean(
    status === "completed" ||
      status === "complete" ||
      step.progress?.completed_at,
  );
}

function buildAdminTrainingSteps(
  steps: TrainingStepRow[],
  progressRows: TrainingProgressRow[],
) {
  const progressMap = new Map(
    progressRows.map((row) => [row.training_step_id || "", row]),
  );

  return steps.map((step) => ({
    ...step,
    progress: progressMap.get(step.id) || null,
  }));
}

function getAdminTrainingPercent(steps: AdminTrainingStep[]) {
  const requiredSteps = steps.filter((step) => step.is_required !== false);

  if (!requiredSteps.length) return 0;

  const completedSteps = requiredSteps.filter(isAdminTrainingComplete).length;

  return Math.round((completedSteps / requiredSteps.length) * 100);
}

function getRequiredTrainingCounts(steps: AdminTrainingStep[]) {
  const requiredSteps = steps.filter((step) => step.is_required !== false);
  const completedSteps = requiredSteps.filter(isAdminTrainingComplete);

  return {
    required: requiredSteps.length,
    completed: completedSteps.length,
  };
}

function buildAdminRequiredDocuments(
  requiredDocuments: RequiredDocumentRow[],
  submissions: DocumentSubmissionRow[],
) {
  return requiredDocuments.map((document) => ({
    ...document,
    submissions: submissions.filter(
      (submission) =>
        submission.required_document_id === document.id ||
        (document.document_type &&
          submission.document_type === document.document_type),
    ),
  }));
}

function getDocumentCompletionCounts(documents: AdminRequiredDocument[]) {
  const requiredDocuments = documents.filter(
    (document) => document.is_required !== false,
  );
  const submittedRequiredDocuments = requiredDocuments.filter((document) =>
    document.submissions.some((submission) =>
      ["submitted", "approved", "reviewed"].includes(
        (submission.status || "").toLowerCase(),
      ),
    ),
  );
  const approvedRequiredDocuments = requiredDocuments.filter((document) =>
    document.submissions.some((submission) =>
      ["approved", "reviewed"].includes((submission.status || "").toLowerCase()),
    ),
  );

  return {
    required: requiredDocuments.length,
    submitted: submittedRequiredDocuments.length,
    approved: approvedRequiredDocuments.length,
  };
}

function getTrainingMaterialLabel(step: TrainingStepRow) {
  const type = (step.content_type || "training").toLowerCase();

  if (type === "video") return "Video";
  if (type === "ppt" || type === "powerpoint") return "PowerPoint";
  if (type === "pdf") return "PDF";
  if (type === "document") return "Document";
  if (type === "link") return "Link";

  return prettyStatus(type);
}

function getTrainingMaterialUrl(step: TrainingStepRow) {
  const videoUrl = step.video_url || "";
  const externalUrl = step.external_url || "";

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  return "";
}

function getSubmissionLabel(submission: DocumentSubmissionRow) {
  return (
    submission.file_name ||
    submission.storage_path ||
    submission.document_type ||
    "Uploaded document"
  );
}

function buildProfileCompletionSummary({
  ambassador,
  trainingCounts,
  trainingPercent,
  documentCounts,
}: {
  ambassador: AmbassadorRow;
  trainingCounts: { required: number; completed: number };
  trainingPercent: number;
  documentCounts: { required: number; submitted: number; approved: number };
}): CompletionSummary {
  const hasName = Boolean(
    asString(ambassador.full_name) || asString(ambassador.display_name),
  );
  const hasEmail = Boolean(asString(ambassador.email));
  const hasPhone = Boolean(asString(ambassador.phone));
  const hasLocation = Boolean(
    asString(ambassador.city) && asString(ambassador.state),
  );
  const hasReferralCode = Boolean(asString(ambassador.referral_code));
  const hasPhoto = Boolean(
    asString(ambassador.ambassador_photo_url) ||
      asString(ambassador.ambassador_photo_path),
  );
  const photoApproved = hasPhoto && ambassador.photo_approved === true;
  const termsAccepted = Boolean(ambassador.terms_accepted_at);
  const eligibilityComplete =
    !ambassador.eligibility_review_required ||
    ambassador.eligibility_review_complete === true;
  const trainingComplete =
    trainingCounts.required === 0 ||
    trainingCounts.completed >= trainingCounts.required;
  const documentsComplete =
    documentCounts.required === 0 ||
    documentCounts.approved >= documentCounts.required;

  const items: CompletionItem[] = [
    {
      key: "name",
      label: "Name saved",
      complete: hasName,
      required: true,
      detail: hasName ? "Name is saved." : "Add full name or display name.",
    },
    {
      key: "email",
      label: "Email saved",
      complete: hasEmail,
      required: true,
      detail: hasEmail ? "Email is saved." : "Add an email address.",
    },
    {
      key: "phone",
      label: "Phone saved",
      complete: hasPhone,
      required: true,
      detail: hasPhone ? "Phone is saved." : "Add phone number.",
    },
    {
      key: "location",
      label: "City and state saved",
      complete: hasLocation,
      required: true,
      detail: hasLocation ? "Location is saved." : "Add city and state.",
    },
    {
      key: "referral_code",
      label: "Referral code saved",
      complete: hasReferralCode,
      required: true,
      detail: hasReferralCode ? "Referral code is saved." : "Add referral code.",
    },
    {
      key: "photo_uploaded",
      label: "Profile photo uploaded",
      complete: hasPhoto,
      required: false,
      detail: hasPhoto
        ? "Photo is uploaded."
        : "Recommended before public promotion, but not required to start referring.",
    },
    {
      key: "photo_approved",
      label: "Profile photo approved",
      complete: photoApproved,
      required: false,
      detail: photoApproved
        ? "Photo is approved."
        : "Recommended before public promotion, but not required to start referring.",
    },
    {
      key: "terms",
      label: "Terms accepted",
      complete: termsAccepted,
      required: false,
      detail: termsAccepted
        ? `Accepted ${formatDate(ambassador.terms_accepted_at)}.`
        : "Required before payout, but not required to start referring.",
    },
    {
      key: "eligibility",
      label: "Eligibility review complete",
      complete: eligibilityComplete,
      required: false,
      detail: ambassador.eligibility_review_required
        ? eligibilityComplete
          ? "Eligibility review is complete."
          : "Required before payout or public promotion."
        : "Eligibility review is not required.",
    },
    {
      key: "training",
      label: "Required training complete",
      complete: trainingComplete,
      required: false,
      detail:
        trainingCounts.required > 0
          ? `${trainingCounts.completed}/${trainingCounts.required} required training steps complete. Required before payout/public promotion, but not required to start referring.`
          : `No required training steps configured. Current training score: ${trainingPercent}%.`,
    },
    {
      key: "documents",
      label: "Required documents approved",
      complete: documentsComplete,
      required: false,
      detail:
        documentCounts.required > 0
          ? `${documentCounts.approved}/${documentCounts.required} required documents approved. Required before payout/public promotion, but not required to start referring.`
          : "No required documents configured.",
    },
  ];

  const requiredItems = items.filter((item) => item.required);
  const completedRequiredItems = requiredItems.filter((item) => item.complete);
  const score = requiredItems.length
    ? Math.round((completedRequiredItems.length / requiredItems.length) * 100)
    : 100;

  return {
    score,
    completeRequired: requiredItems.every((item) => item.complete),
    completedRequiredCount: completedRequiredItems.length,
    requiredCount: requiredItems.length,
    missingRequiredItems: requiredItems.filter((item) => !item.complete),
    items,
  };
}

function getProfileMeterClass(score: number) {
  if (score >= 90) return "bg-emerald-600";
  if (score >= 70) return "bg-blue-500";
  if (score >= 45) return "bg-amber-500";

  return "bg-rose-500";
}

function getPayoutReadiness({
  ambassador,
  completion,
}: {
  ambassador: AmbassadorRow;
  completion: CompletionSummary;
}) {
  const hasStripe = Boolean(asString(ambassador.stripe_account_id));
  const onboardingComplete = ambassador.stripe_onboarding_complete === true;
  const payoutsEnabled = ambassador.stripe_payouts_enabled === true;
  const taxStartedOrComplete =
    asString(ambassador.tax_info_status) !== "" &&
    ambassador.tax_info_status !== "not_started";
  const payoutMethodSaved = Boolean(asString(ambassador.payout_method));
  const termsAccepted = Boolean(ambassador.terms_accepted_at);

  const items: CompletionItem[] = [
    {
      key: "profile",
      label: "Basic referral setup complete",
      complete: completion.completeRequired,
      required: true,
      detail: completion.completeRequired
        ? "Ambassador can be active and start referring."
        : `Missing: ${completion.missingRequiredItems
            .map((item) => item.label)
            .join(", ")}.`,
    },
    {
      key: "terms",
      label: "Terms accepted",
      complete: termsAccepted,
      required: true,
      detail: termsAccepted
        ? `Accepted ${formatDate(ambassador.terms_accepted_at)}.`
        : "Terms must be accepted before commissions or rewards are paid.",
    },
    {
      key: "stripe_account",
      label: "Stripe Connect account created",
      complete: hasStripe,
      required: true,
      detail: hasStripe
        ? `Stripe account: ${ambassador.stripe_account_id}`
        : "No Stripe Connect account saved yet.",
    },
    {
      key: "stripe_onboarding",
      label: "Stripe onboarding complete",
      complete: onboardingComplete,
      required: true,
      detail: onboardingComplete
        ? "Stripe onboarding is complete."
        : "Stripe onboarding is not complete.",
    },
    {
      key: "stripe_payouts",
      label: "Stripe payouts enabled",
      complete: payoutsEnabled,
      required: true,
      detail: payoutsEnabled
        ? "Stripe payouts are enabled."
        : "Stripe payouts are not enabled yet.",
    },
    {
      key: "tax_info",
      label: "Tax information status started",
      complete: taxStartedOrComplete,
      required: true,
      detail: `Tax info status: ${prettyStatus(ambassador.tax_info_status)}.`,
    },
    {
      key: "payout_method",
      label: "Payout method saved",
      complete: payoutMethodSaved,
      required: true,
      detail: payoutMethodSaved
        ? `Payout method: ${ambassador.payout_method}.`
        : "Payout method is not saved.",
    },
  ];

  const ready = items.every((item) => item.complete);

  return {
    ready,
    items,
    missingItems: items.filter((item) => !item.complete),
  };
}

function RequirementItem({ item }: { item: CompletionItem }) {
  const complete = item.complete;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        complete
          ? "border-emerald-100 bg-emerald-50"
          : item.required
            ? "border-rose-100 bg-rose-50"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-full p-1 ${
            complete
              ? "bg-emerald-100 text-emerald-700"
              : item.required
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {complete ? (
            <CircleCheck className="h-4 w-4" />
          ) : item.required ? (
            <CircleAlert className="h-4 w-4" />
          ) : (
            <CircleDashed className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-extrabold ${
              complete
                ? "text-emerald-900"
                : item.required
                  ? "text-rose-900"
                  : "text-slate-700"
            }`}
          >
            {item.label}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileCompletionPanel({
  completion,
}: {
  completion: CompletionSummary;
}) {
  return (
    <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#2f6f3e]" />
            <h2 className="text-xl font-extrabold text-[#102819]">
              Activation Readiness Meter
            </h2>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Ambassadors can be marked Active once basic referral setup is
            complete. Photo, terms, training, documents, Stripe, and tax setup
            are tracked separately for public promotion and payout readiness.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2ecd9] bg-[#f8fbf6] p-4 xl:w-[340px]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Completion
              </p>
              <p className="mt-1 text-4xl font-black text-[#102819]">
                {completion.score}%
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${
                completion.completeRequired
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                  : "bg-rose-100 text-rose-800 ring-rose-200"
              }`}
            >
              {completion.completeRequired ? "Can Start Referring" : "Not Ready"}
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-[#e2ecd9]">
            <div
              className={`h-full rounded-full ${getProfileMeterClass(
                completion.score,
              )}`}
              style={{ width: `${completion.score}%` }}
            />
          </div>

          <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
            {completion.completedRequiredCount}/{completion.requiredCount} basic
            activation items complete.
          </p>
        </div>
      </div>

      {!completion.completeRequired ? (
        <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-700" />
            <div>
              <p className="font-extrabold text-rose-900">
                This Ambassador is not ready to start referring yet.
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-rose-800">
                Missing:{" "}
                {completion.missingRequiredItems
                  .map((item) => item.label)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {completion.items.map((item) => (
          <RequirementItem key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}

function PayoutReadinessPanel({
  ambassador,
  payoutReadiness,
}: {
  ambassador: AmbassadorRow;
  payoutReadiness: ReturnType<typeof getPayoutReadiness>;
}) {
  return (
    <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#2f6f3e]" />
            <h2 className="text-xl font-extrabold text-[#102819]">
              Payout Readiness & Stripe Connect
            </h2>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Ambassadors may be Active and start referring before Stripe is
            complete. Commissions and rewards remain blocked until terms, tax
            setup, Stripe Connect, and payout readiness are complete.
          </p>
        </div>

        <div
          className={`rounded-3xl border p-4 xl:w-[340px] ${
            payoutReadiness.ready
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50"
          }`}
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-600">
            Payout Status
          </p>
          <p
            className={`mt-2 text-2xl font-black ${
              payoutReadiness.ready ? "text-emerald-900" : "text-amber-900"
            }`}
          >
            {payoutReadiness.ready ? "Ready for Payout" : "Not Ready"}
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            Saved status: {prettyStatus(ambassador.payout_status)}
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            Ready date: {formatDate(ambassador.ready_for_payout_at)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {payoutReadiness.items.map((item) => (
          <RequirementItem key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#f8fbf6] p-4 ring-1 ring-[#e2ecd9]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Stripe Account
          </p>
          <p className="mt-1 break-all text-sm font-extrabold text-[#102819]">
            {ambassador.stripe_account_id || "Not saved"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8fbf6] p-4 ring-1 ring-[#e2ecd9]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Onboarding
          </p>
          <p className="mt-1 text-sm font-extrabold text-[#102819]">
            {ambassador.stripe_onboarding_complete ? "Complete" : "Not Complete"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8fbf6] p-4 ring-1 ring-[#e2ecd9]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Charges
          </p>
          <p className="mt-1 text-sm font-extrabold text-[#102819]">
            {ambassador.stripe_charges_enabled ? "Enabled" : "Not Enabled"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8fbf6] p-4 ring-1 ring-[#e2ecd9]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Payouts
          </p>
          <p className="mt-1 text-sm font-extrabold text-[#102819]">
            {ambassador.stripe_payouts_enabled ? "Enabled" : "Not Enabled"}
          </p>
        </div>
      </div>
    </section>
  );
}

function AdminNotice({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const activation = searchParams?.activation;
  const updated = searchParams?.updated;
  const photo = searchParams?.photo;

  if (activation === "blocked") {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Active status blocked</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              This Ambassador cannot be marked Active until basic referral setup
              is complete: name, email, phone, city/state, and referral code.
              Stripe setup is only required before payout.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (updated === "success") {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="font-black">Ambassador updated</p>
        <p className="mt-1 text-sm font-semibold leading-6">
          The Ambassador status, referral availability, and workspace access were saved successfully.
        </p>
      </section>
    );
  }

  if (photo) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="font-black">Photo updated</p>
        <p className="mt-1 text-sm font-semibold leading-6">
          The Ambassador photo record was {photo}.
        </p>
      </section>
    );
  }

  return null;
}

export default async function AdminAmbassadorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const { data: ambassador, error: ambassadorError } = await supabase
    .from("ambassadors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (ambassadorError || !ambassador) {
    notFound();
  }

  const [
    { data: referralsData, error: referralsError },
    { data: rewardsData, error: rewardsError },
    { data: legacyTrainingData, error: legacyTrainingError },
    { data: trainingStepsData, error: trainingStepsError },
    { data: trainingProgressData, error: trainingProgressError },
    { data: requiredDocumentsData, error: requiredDocumentsError },
    { data: documentSubmissionsData, error: documentSubmissionsError },
  ] = await Promise.all([
    supabase
      .from("ambassador_referrals")
      .select("*")
      .eq("ambassador_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ambassador_rewards")
      .select("*")
      .eq("ambassador_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ambassador_training_progress")
      .select("*")
      .eq("ambassador_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ambassador_training_steps")
      .select("*")
      .eq("is_active", true)
      .order("step_number", { ascending: true }),
    supabase
      .from("ambassador_training_progress")
      .select("*")
      .eq("ambassador_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ambassador_required_documents")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ambassador_document_submissions")
      .select("*")
      .eq("ambassador_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  const ambassadorRow = ambassador as AmbassadorRow;
  const referrals = (referralsData || []) as ReferralRow[];
  const rewards = (rewardsData || []) as RewardRow[];
  const training = (legacyTrainingData || []) as TrainingRow[];
  const trainingSteps = buildAdminTrainingSteps(
    (trainingStepsData || []) as TrainingStepRow[],
    (trainingProgressData || []) as TrainingProgressRow[],
  );
  const trainingCounts = getRequiredTrainingCounts(trainingSteps);
  const trainingPercent =
    getAdminTrainingPercent(trainingSteps) ||
    numberValue(ambassadorRow.onboarding_percent) ||
    numberValue(ambassadorRow.training_percent);
  const requiredDocuments = buildAdminRequiredDocuments(
    (requiredDocumentsData || []) as RequiredDocumentRow[],
    (documentSubmissionsData || []) as DocumentSubmissionRow[],
  );
  const documentCounts = getDocumentCompletionCounts(requiredDocuments);
  const profileCompletion = buildProfileCompletionSummary({
    ambassador: ambassadorRow,
    trainingCounts,
    trainingPercent,
    documentCounts,
  });
  const payoutReadiness = getPayoutReadiness({
    ambassador: ambassadorRow,
    completion: profileCompletion,
  });
  const cards = buildDetailCards(referrals, rewards, trainingPercent);

  const encodedReferralCode = ambassadorRow.referral_code
    ? encodeURIComponent(ambassadorRow.referral_code)
    : "";

  const referralLink =
    ambassadorRow.referral_link ||
    (encodedReferralCode
      ? `https://www.sitguru.com/signup?role=pet_parent&ambassador_code=${encodedReferralCode}&ref=${encodedReferralCode}&next=/customer/dashboard`
      : "Referral link not generated yet");

  const hasQueryError =
    referralsError ||
    rewardsError ||
    legacyTrainingError ||
    trainingStepsError ||
    trainingProgressError ||
    requiredDocumentsError ||
    documentSubmissionsError;
  const ambassadorName = getAmbassadorName(ambassadorRow);
  const ambassadorRoleLabel = getAmbassadorRoleLabel(ambassadorRow);
  const hasPhoto = Boolean(ambassadorRow.ambassador_photo_url);
  const isArchived = isArchivedAmbassador(ambassadorRow);

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <Link
            href="/admin/ambassadors"
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#2f6f3e] shadow-sm ring-1 ring-[#dbe8d5] transition hover:bg-[#eef7ea]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ambassadors
          </Link>
        </div>

        <AdminNotice searchParams={resolvedSearchParams} />

        <section
          className={`rounded-[2rem] border bg-white p-5 shadow-sm sm:p-6 ${
            isArchived ? "border-red-100" : "border-[#dbe8d5]"
          }`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-[#e8f5e9] text-2xl font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                {hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ambassadorRow.ambassador_photo_url || ""}
                    alt={`${ambassadorName} profile photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(ambassadorName) || "SG"}</span>
                )}

                {!hasPhoto ? (
                  <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2f6f3e] shadow-sm">
                    <Camera className="h-4 w-4" />
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
                  {ambassadorRoleLabel}
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                  {ambassadorName}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                      isArchived ? "archived" : ambassadorRow.status,
                    )}`}
                  >
                    {isArchived ? "Archived" : prettyStatus(ambassadorRow.status)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${photoStatusClass(
                      hasPhoto,
                      ambassadorRow.photo_approved,
                    )}`}
                  >
                    {photoStatusLabel(hasPhoto, ambassadorRow.photo_approved)}
                  </span>
                  <span className="inline-flex rounded-full bg-[#f0f7ed] px-3 py-1 text-xs font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                    {ambassadorRow.program || "Ambassador"}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
                    Source: {ambassadorRow.source || "Not saved"}
                  </span>
                </div>

                {isArchived ? (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                    <p className="font-black">Archived record</p>
                    <p className="mt-1">
                      {ambassadorRow.archived_reason ||
                        "This Ambassador is retained on file and should not continue onboarding unless restored."}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em]">
                      Archived: {formatDate(ambassadorRow.archived_at)}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#2f6f3e]" />
                    <span>{ambassadorRow.email || "No email saved"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#2f6f3e]" />
                    <span>{ambassadorRow.phone || "No phone saved"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#2f6f3e]" />
                    <span>
                      {[ambassadorRow.city, ambassadorRow.state, ambassadorRow.country]
                        .filter(Boolean)
                        .join(", ") || "No location saved"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#2f6f3e]" />
                    <span>{ambassadorRow.internal_role || ambassadorRoleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#dbe8d5] bg-[#f8fbf6] p-4 xl:w-[380px]">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#2f6f3e]" />
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  Referral Link
                </p>
              </div>

              <p className="mt-3 break-all rounded-2xl bg-white p-3 text-sm font-bold text-[#102819] ring-1 ring-[#e2ecd9]">
                {referralLink}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-[#e2ecd9]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Code
                  </p>
                  <p className="mt-1 font-extrabold text-[#102819]">
                    {ambassadorRow.referral_code || "Not saved"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-[#e2ecd9]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Activated
                  </p>
                  <p className="mt-1 font-extrabold text-[#102819]">
                    {formatDate(ambassadorRow.activated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProfileCompletionPanel completion={profileCompletion} />

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-[#cfe4c8] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-xl font-extrabold text-[#102819]">
                Ambassador Photo
              </h2>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Store the Ambassador profile photo path or URL here. Photos should
              be reviewed and approved before being shown publicly.
            </p>

            <div className="mt-5 rounded-3xl border border-[#e2ecd9] bg-[#f8fbf6] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-xl font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ambassadorRow.ambassador_photo_url || ""}
                      alt={`${ambassadorName} profile photo preview`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-8 w-8 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${photoStatusClass(
                      hasPhoto,
                      ambassadorRow.photo_approved,
                    )}`}
                  >
                    {photoStatusLabel(hasPhoto, ambassadorRow.photo_approved)}
                  </span>
                  <p className="mt-2 text-sm font-bold text-[#102819]">
                    Uploaded: {formatDate(ambassadorRow.photo_uploaded_at)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#102819]">
                    Approved: {formatDate(ambassadorRow.photo_approved_at)}
                  </p>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    {ambassadorRow.ambassador_photo_path ||
                      ambassadorRow.ambassador_photo_url ||
                      "No photo path saved yet."}
                  </p>
                </div>
              </div>
            </div>

            <form
              action={updateAmbassadorPhoto.bind(null, ambassadorRow.id)}
              className="mt-5 space-y-4"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Photo URL
                </span>
                <input
                  name="ambassador_photo_url"
                  defaultValue={ambassadorRow.ambassador_photo_url || ""}
                  placeholder="https://... or signed/private admin photo URL"
                  className="w-full rounded-2xl border border-[#cfe4c8] bg-white px-4 py-3 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Storage Path
                </span>
                <input
                  name="ambassador_photo_path"
                  defaultValue={ambassadorRow.ambassador_photo_path || ""}
                  placeholder="student-hire/brittany-montiel-profile.jpg"
                  className="w-full rounded-2xl border border-[#cfe4c8] bg-white px-4 py-3 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Photo
              </button>
            </form>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <form action={approveAmbassadorPhoto.bind(null, ambassadorRow.id)}>
                <button
                  type="submit"
                  disabled={!hasPhoto}
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Approve Photo
                </button>
              </form>

              <form action={clearAmbassadorPhoto.bind(null, ambassadorRow.id)}>
                <button
                  type="submit"
                  disabled={!hasPhoto && !ambassadorRow.ambassador_photo_path}
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-rose-600 px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Photo
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#cfe4c8] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#2f6f3e]" />
                  <h2 className="text-xl font-extrabold text-[#102819]">
                    Super Admin Controls
                  </h2>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Active status is allowed once basic referral setup is complete.
                  Payouts remain blocked until Stripe Connect, tax setup, terms,
                  and payout readiness are complete.
                </p>
              </div>

              {!profileCompletion.completeRequired ? (
                <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
                  <p className="font-black">Activation locked</p>
                  <p className="mt-1">
                    Complete the missing basic referral setup items before
                    marking this Ambassador Active. Photo, terms, training,
                    documents, and Stripe are still tracked for payout readiness.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                  <p className="font-black">Ready to start referring</p>
                  <p className="mt-1">
                    Basic Ambassador referral setup is complete. This person can
                    be Active and begin referring Pet Parents, Gurus, and
                    business/community leads. Payout readiness remains separate.
                  </p>
                </div>
              )}

              <div className="rounded-3xl border border-[#e2ecd9] bg-[#f8fbf6] p-4">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Quick Actions
                </p>
                <AmbassadorQuickActions
                  ambassador={ambassadorRow}
                  ambassadorName={ambassadorName}
                  canActivate={profileCompletion.completeRequired}
                />
              </div>

              <form
                action={updateAmbassadorStatus.bind(null, ambassadorRow.id)}
                className="flex w-full flex-col gap-3 sm:flex-row"
              >
                <select
                  name="status"
                  defaultValue={ambassadorRow.status || "new"}
                  className="min-h-[46px] rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-bold text-[#102819] shadow-sm outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
                >
                  {AMBASSADOR_STATUSES.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      disabled={
                        status.value === "active" &&
                        !profileCompletion.completeRequired
                      }
                    >
                      {status.label}
                      {status.value === "active" &&
                      !profileCompletion.completeRequired
                        ? " - Locked"
                        : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Status
                </button>
              </form>
            </div>
          </section>
        </section>

        <PayoutReadinessPanel
          ambassador={ambassadorRow}
          payoutReadiness={payoutReadiness}
        />

        <section className="rounded-[2rem] border border-[#cfe4c8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#2f6f3e]" />
                <h2 className="text-xl font-extrabold text-[#102819]">
                  SitGuru Messenger
                </h2>
              </div>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Create a tracked admin message thread for this Ambassador,
                follow up about referral credits, or open Messenger to coordinate
                with Gurus connected to this Ambassador's outreach.
              </p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-[#f8fbf6] p-3 ring-1 ring-[#e2ecd9]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Ambassador
                  </p>
                  <p className="mt-1 truncate font-extrabold text-[#102819]">
                    {ambassadorName}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f8fbf6] p-3 ring-1 ring-[#e2ecd9]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email
                  </p>
                  <p className="mt-1 truncate font-extrabold text-[#102819]">
                    {ambassadorRow.email || "No email saved"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f8fbf6] p-3 ring-1 ring-[#e2ecd9]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Referral Code
                  </p>
                  <p className="mt-1 truncate font-extrabold text-[#102819]">
                    {ambassadorRow.referral_code || "Not saved"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-[430px]">
              <Link
                href={buildAmbassadorMessageHref({
                  ambassador: ambassadorRow,
                  ambassadorName,
                  threadType: "ambassador_support",
                })}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
              >
                <Send className="mr-2 h-4 w-4" />
                Message Admin
              </Link>

              <Link
                href={buildAmbassadorMessageHref({
                  ambassador: ambassadorRow,
                  ambassadorName,
                  threadType: "ambassador_guru_followup",
                })}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-5 py-3 text-sm font-extrabold text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
              >
                <Users className="mr-2 h-4 w-4" />
                Message Gurus
              </Link>

              <Link
                href={buildAmbassadorMessageHref({
                  ambassador: ambassadorRow,
                  ambassadorName,
                  threadType: "ambassador_admin_note",
                })}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-5 py-3 text-sm font-extrabold text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
              >
                <Mail className="mr-2 h-4 w-4" />
                Admin Note
              </Link>

              <Link
                href={`/admin/messages?inquiry=partner&q=${encodeURIComponent(
                  ambassadorRow.referral_code || ambassadorName,
                )}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#cfe4c8] bg-[#f8fbf6] px-5 py-3 text-sm font-extrabold text-[#102819] shadow-sm transition hover:bg-[#eef7ea]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Open Messenger
              </Link>
            </div>
          </div>
        </section>

        {hasQueryError ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="text-lg font-extrabold">Detail data warning</h2>
            <p className="mt-2 text-sm">
              SitGuru loaded the Ambassador profile, but one or more detail
              tables returned an error.
            </p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-white p-4 text-xs">
              {[
                referralsError?.message,
                rewardsError?.message,
                legacyTrainingError?.message,
                trainingStepsError?.message,
                trainingProgressError?.message,
                requiredDocumentsError?.message,
                documentSubmissionsError?.message,
              ]
                .filter(Boolean)
                .join("\n")}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-[#dbe8d5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold text-[#102819]">
                      {card.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#e8f5e9] p-3 text-[#2f6f3e]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{card.subtext}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
            <div className="border-b border-[#e2ecd9] p-5">
              <h2 className="text-xl font-extrabold text-[#102819]">
                One-Level Referral Drilldown
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Pet Parent, Guru, and business signups connected to this
                Ambassador.
              </p>
            </div>

            {referrals.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">
                No referral records yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e2ecd9]">
                  <thead className="bg-[#f8fbf6]">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Referral
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Type
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Booking
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf3e8] bg-white">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-[#102819]">
                            {getReferralDisplayName(referral)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getReferralSubtext(referral)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">
                          {referralTypeLabel(referral.referral_type)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                              referral.status,
                            )}`}
                          >
                            {prettyStatus(referral.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                              referral.booking_status,
                            )}`}
                          >
                            {prettyStatus(referral.booking_status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(referral.signup_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
              <div className="border-b border-[#e2ecd9] p-5">
                <h2 className="text-xl font-extrabold text-[#102819]">
                  Rewards / Commissions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Feeds commissions, payouts, and financial reporting.
                </p>
              </div>

              {rewards.length === 0 ? (
                <div className="p-6 text-sm text-slate-600">
                  No reward records yet.
                </div>
              ) : (
                <div className="divide-y divide-[#edf3e8]">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-extrabold text-[#102819]">
                            {prettyStatus(reward.reward_type)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {reward.financial_category ||
                              "Sales & Marketing Expense"}
                          </p>
                        </div>
                        <p className="text-lg font-extrabold text-[#102819]">
                          {currency(reward.amount)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                            reward.status,
                          )}`}
                        >
                          {prettyStatus(reward.status)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                            reward.financial_status,
                          )}`}
                        >
                          {prettyStatus(reward.financial_status)}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Created {formatDate(reward.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
              <div className="border-b border-[#e2ecd9] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#102819]">
                      Training & Onboarding Progress
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Admin view of required training, certifications, signatures,
                      and mobile onboarding progress.
                    </p>
                  </div>

                  <Link
                    href="/admin/ambassador-training"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-extrabold text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                  >
                    Manage Training
                  </Link>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f8fbf6] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Overall Training
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#2f6f3e]">
                      {trainingPercent}%
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#2f6f3e]"
                        style={{ width: `${trainingPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#f8fbf6] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Required Steps
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#102819]">
                      {trainingCounts.completed} / {trainingCounts.required}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      Complete before payout/public promotion, not before basic
                      referral activity.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8fbf6] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Certification
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#102819]">
                      {ambassadorRow.certification_signed_at ||
                      trainingSteps.some((step) => step.progress?.signed_at)
                        ? "Signed"
                        : "Not Signed"}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {ambassadorRow.certification_signed_at
                        ? formatDate(ambassadorRow.certification_signed_at)
                        : "Final certification not saved yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {trainingSteps.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#dbe8d5] bg-[#f8fbf6] p-4 text-sm text-slate-600">
                      No active Ambassador training steps are published yet.
                    </div>
                  ) : (
                    trainingSteps.map((step) => {
                      const complete = isAdminTrainingComplete(step);
                      const materialUrl = getTrainingMaterialUrl(step);

                      return (
                        <div
                          key={step.id}
                          className="rounded-2xl border border-[#e2ecd9] bg-[#f8fbf6] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-[#2f6f3e] px-3 py-1 text-xs font-extrabold text-white">
                                  Step {step.step_number || "—"}
                                </span>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                                    complete
                                      ? "complete"
                                      : step.progress?.status || "pending",
                                  )}`}
                                >
                                  {complete
                                    ? "Complete"
                                    : prettyStatus(step.progress?.status)}
                                </span>
                                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600 ring-1 ring-[#dbe8d5]">
                                  {getTrainingMaterialLabel(step)}
                                </span>
                                {step.is_required !== false ? (
                                  <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 ring-1 ring-amber-100">
                                    Required
                                  </span>
                                ) : null}
                              </div>

                              <p className="text-sm font-extrabold text-[#102819]">
                                {step.title || "Training step"}
                              </p>
                              {step.description ? (
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {step.description}
                                </p>
                              ) : null}

                              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                                <p>
                                  Started: {formatDate(step.progress?.started_at)}
                                </p>
                                <p>
                                  Completed:{" "}
                                  {formatDate(step.progress?.completed_at)}
                                </p>
                                <p>
                                  Acknowledged:{" "}
                                  {formatDate(step.progress?.acknowledged_at)}
                                </p>
                                <p>Signed: {formatDate(step.progress?.signed_at)}</p>
                              </div>

                              {step.progress?.signature_name ? (
                                <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#102819] ring-1 ring-[#dbe8d5]">
                                  Signature: {step.progress.signature_name}
                                </p>
                              ) : null}
                            </div>

                            {materialUrl ? (
                              <a
                                href={materialUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-extrabold text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                              >
                                Open Material
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#102819]">
                  Documents & Onboarding Uploads
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Admin review of required Ambassador documents and existing
                  application files.
                </p>
              </div>

              <Link
                href="/admin/ambassador-documents"
                className="inline-flex items-center justify-center rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-extrabold text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
              >
                Review Documents
              </Link>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Required
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#102819]">
                  {documentCounts.required}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Submitted
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#102819]">
                  {documentCounts.submitted}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Approved
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#102819]">
                  {documentCounts.approved}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="font-extrabold text-[#102819]">
                  {ambassadorRow.resume_label || "Resume"}
                </p>
                <p className="mt-1 break-all text-slate-600">
                  {ambassadorRow.resume_url || "No resume link saved"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="font-extrabold text-[#102819]">
                  {ambassadorRow.cover_letter_label || "Cover Letter"}
                </p>
                <p className="mt-1 break-all text-slate-600">
                  {ambassadorRow.cover_letter_url ||
                    "No cover letter link saved"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="font-extrabold text-[#102819]">
                  {ambassadorRow.other_document_label || "Other Document"}
                </p>
                <p className="mt-1 break-all text-slate-600">
                  {ambassadorRow.other_document_url ||
                    "No other document link saved"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {requiredDocuments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dbe8d5] bg-[#f8fbf6] p-4 text-sm text-slate-600">
                  No required onboarding documents are configured yet.
                </div>
              ) : (
                requiredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-[#e2ecd9] bg-[#f8fbf6] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                            {document.document_type || "document"}
                          </span>
                          {document.is_required !== false ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 ring-1 ring-amber-100">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600 ring-1 ring-slate-100">
                              Optional
                            </span>
                          )}
                        </div>

                        <p className="font-extrabold text-[#102819]">
                          {document.title || "Onboarding Document"}
                        </p>
                        {document.description ? (
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {document.description}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                          document.submissions.some((submission) =>
                            ["approved", "reviewed"].includes(
                              (submission.status || "").toLowerCase(),
                            ),
                          )
                            ? "approved"
                            : document.submissions.length
                              ? "pending"
                              : "not_started",
                        )}`}
                      >
                        {document.submissions.some((submission) =>
                          ["approved", "reviewed"].includes(
                            (submission.status || "").toLowerCase(),
                          ),
                        )
                          ? "Approved"
                          : document.submissions.length
                            ? "Submitted"
                            : "Missing"}
                      </span>
                    </div>

                    {document.submissions.length ? (
                      <div className="mt-3 space-y-2">
                        {document.submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className="rounded-xl bg-white p-3 text-xs font-bold text-slate-600 ring-1 ring-[#dbe8d5]"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="break-all text-[#102819]">
                                  {getSubmissionLabel(submission)}
                                </p>
                                <p className="mt-1">
                                  Submitted: {formatDate(submission.submitted_at)}
                                </p>
                                {submission.storage_path ? (
                                  <p className="mt-1 break-all">
                                    Path: {submission.storage_path}
                                  </p>
                                ) : null}
                              </div>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                                  submission.status,
                                )}`}
                              >
                                {prettyStatus(submission.status)}
                              </span>
                            </div>
                            {submission.admin_notes ? (
                              <p className="mt-2 rounded-lg bg-[#f8fbf6] p-2">
                                {submission.admin_notes}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#102819]">
              Internal Notes
            </h2>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f8fbf6] p-4 text-sm leading-6 text-slate-700">
              {ambassadorRow.notes || "No notes saved yet."}
            </p>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Eligibility Review
                </p>
                <p className="mt-1 font-extrabold text-[#102819]">
                  {ambassadorRow.eligibility_review_required
                    ? ambassadorRow.eligibility_review_complete
                      ? "Complete"
                      : "Required"
                    : "Not required"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Terms Accepted
                </p>
                <p className="mt-1 font-extrabold text-[#102819]">
                  {formatDate(ambassadorRow.terms_accepted_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Archived
                </p>
                <p className="mt-1 font-extrabold text-[#102819]">
                  {formatDate(ambassadorRow.archived_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Last Updated
                </p>
                <p className="mt-1 font-extrabold text-[#102819]">
                  {formatDate(ambassadorRow.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}