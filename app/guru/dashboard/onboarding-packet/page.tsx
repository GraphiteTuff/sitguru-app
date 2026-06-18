import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GraduationCap,
  LockKeyhole,
  PenLine,
  ShieldCheck,
  UploadCloud,
  UserCircle2,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_FONT_STYLE = {
  fontFamily:
    '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 300,
};

const AGREEMENT_VERSION = "sitguru-guru-onboarding-packet-v1-2026";
const DOCUMENT_BUCKET = "guru-onboarding-documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

type GuruOnboardingPacketRow = {
  id: string;
  user_id: string;
  legal_name: string | null;
  signature_name: string | null;
  agreement_version: string | null;
  provider_acknowledged: boolean | null;
  tax_acknowledged: boolean | null;
  safety_acknowledged: boolean | null;
  care_standards_acknowledged: boolean | null;
  communication_acknowledged: boolean | null;
  payment_acknowledged: boolean | null;
  final_certification_acknowledged: boolean | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type GuruOnboardingDocumentRow = {
  id: string;
  user_id: string;
  packet_id: string | null;
  document_type: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

function asString(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function prettyStatus(status: string | null | undefined) {
  if (!status) return "Not Started";

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

function statusStyles(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "approved":
    case "complete":
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "submitted":
    case "pending_review":
    case "in_review":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "needs_fix":
    case "needs_action":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function getFirstSearchParam(
  searchParams: SearchParams | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

async function uploadGuruDocument({
  supabase,
  userId,
  packetId,
  file,
  documentType,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  packetId: string;
  file: File | null;
  documentType: string;
}) {
  if (!file || file.size <= 0) {
    return;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.name} is too large. Please upload a file smaller than 8 MB.`,
    );
  }

  const safeFileName =
    file.name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `${documentType}.upload`;

  const storagePath = `${userId}/${packetId}/${documentType}-${Date.now()}-${safeFileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, fileBuffer, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: insertError } = await supabase
    .from("guru_onboarding_documents")
    .insert({
      user_id: userId,
      packet_id: packetId,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function submitGuruOnboardingPacket(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/guru/login");
  }

  const legalName = asString(formData.get("legal_name"));
  const providerAcknowledged = checkboxValue(
    formData,
    "provider_acknowledged",
  );
  const taxAcknowledged = checkboxValue(formData, "tax_acknowledged");
  const safetyAcknowledged = checkboxValue(formData, "safety_acknowledged");
  const careStandardsAcknowledged = checkboxValue(
    formData,
    "care_standards_acknowledged",
  );
  const communicationAcknowledged = checkboxValue(
    formData,
    "communication_acknowledged",
  );
  const paymentAcknowledged = checkboxValue(formData, "payment_acknowledged");
  const finalCertificationAcknowledged = checkboxValue(
    formData,
    "final_certification_acknowledged",
  );

  const allRequiredAcknowledged =
    providerAcknowledged &&
    taxAcknowledged &&
    safetyAcknowledged &&
    careStandardsAcknowledged &&
    communicationAcknowledged &&
    paymentAcknowledged &&
    finalCertificationAcknowledged;

  if (!legalName || !allRequiredAcknowledged) {
    redirect("/guru/dashboard/onboarding-packet?error=missing");
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const userAgent = requestHeaders.get("user-agent") || null;
  const now = new Date().toISOString();

  const packetPayload = {
    user_id: user.id,
    legal_name: legalName,
    signature_name: legalName,
    agreement_version: AGREEMENT_VERSION,
    provider_acknowledged: providerAcknowledged,
    tax_acknowledged: taxAcknowledged,
    safety_acknowledged: safetyAcknowledged,
    care_standards_acknowledged: careStandardsAcknowledged,
    communication_acknowledged: communicationAcknowledged,
    payment_acknowledged: paymentAcknowledged,
    final_certification_acknowledged: finalCertificationAcknowledged,
    status: "submitted",
    submitted_at: now,
    ip_address: ipAddress,
    user_agent: userAgent,
    updated_at: now,
  };

  const { data: existingPacket } = await supabase
    .from("guru_onboarding_packets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let packetId = existingPacket?.id || "";

  if (packetId) {
    const { error: updateError } = await supabase
      .from("guru_onboarding_packets")
      .update(packetPayload)
      .eq("id", packetId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { data: insertedPacket, error: insertError } = await supabase
      .from("guru_onboarding_packets")
      .insert({
        ...packetPayload,
        created_at: now,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    packetId = insertedPacket.id;
  }

  const governmentIdFile = formData.get("government_id") as File | null;
  const certificationFile = formData.get("certification_document") as File | null;
  const experienceFile = formData.get("experience_document") as File | null;

  await uploadGuruDocument({
    supabase,
    userId: user.id,
    packetId,
    file: governmentIdFile,
    documentType: "government_id",
  });

  await uploadGuruDocument({
    supabase,
    userId: user.id,
    packetId,
    file: certificationFile,
    documentType: "certification_or_insurance",
  });

  await uploadGuruDocument({
    supabase,
    userId: user.id,
    packetId,
    file: experienceFile,
    documentType: "experience_or_resume",
  });

  revalidatePath("/guru/dashboard");
  revalidatePath("/guru/dashboard/onboarding-packet");

  redirect("/guru/dashboard/onboarding-packet?submitted=success");
}

function RequirementCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </span>

        <div>
          <p className="text-lg font-black !text-slate-950">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function ExistingDocumentList({
  documents,
}: {
  documents: GuruOnboardingDocumentRow[];
}) {
  if (!documents.length) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-5">
        <p className="text-sm font-bold leading-6 !text-slate-600">
          No documents uploaded yet. If SitGuru asked you to upload documents,
          use the upload fields below before submitting.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {documents.map((document) => (
        <div
          key={document.id}
          className="rounded-[1.25rem] border border-emerald-100 bg-white p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black !text-slate-950">
                {document.file_name || "Uploaded document"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] !text-slate-500">
                {prettyStatus(document.document_type)} • Submitted{" "}
                {formatDate(document.submitted_at)}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles(
                document.status,
              )}`}
            >
              {prettyStatus(document.status)}
            </span>
          </div>

          {document.admin_notes ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 !text-amber-900">
              {document.admin_notes}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function UploadField({
  name,
  title,
  description,
  requiredLabel,
}: {
  name: string;
  title: string;
  description: string;
  requiredLabel: string;
}) {
  return (
    <label className="block rounded-[1.25rem] border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <UploadCloud className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black !text-slate-950">{title}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
              {requiredLabel}
            </span>
          </div>

          <p className="mt-1 text-sm font-bold leading-6 !text-slate-600">
            {description}
          </p>

          <input
            name={name}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="mt-4 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold !text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-emerald-700"
          />

          <p className="mt-2 text-xs font-bold leading-5 !text-slate-500">
            Accepted file types: PDF, JPG, PNG, WEBP. Max size: 8 MB.
          </p>
        </div>
      </div>
    </label>
  );
}

function AcknowledgmentCheckbox({
  name,
  title,
  body,
  defaultChecked,
}: {
  name: string;
  title: string;
  body: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="block rounded-[1.25rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-5 w-5 shrink-0 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />

        <div>
          <p className="text-base font-black !text-slate-950">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 !text-slate-600">
            {body}
          </p>
        </div>
      </div>
    </label>
  );
}

export default async function GuruOnboardingPacketPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const submitted = getFirstSearchParam(resolvedSearchParams, "submitted");
  const errorStatus = getFirstSearchParam(resolvedSearchParams, "error");

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/guru/login");
  }

  const packetUrl = process.env.NEXT_PUBLIC_GURU_ONBOARDING_PACKET_URL || "";

  const { data: packetData, error: packetError } = await supabase
    .from("guru_onboarding_packets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const packet = packetData as GuruOnboardingPacketRow | null;

  const { data: documentsData } = await supabase
    .from("guru_onboarding_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  const documents = (documentsData || []) as GuruOnboardingDocumentRow[];
  const hasPacketTable = !packetError;
  const packetStatus = packet?.status || "not_started";
  const isSubmitted =
    packetStatus === "submitted" ||
    packetStatus === "pending_review" ||
    packetStatus === "approved" ||
    Boolean(packet?.submitted_at);

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-5 py-10 text-slate-900 sm:px-6 lg:px-8"
      style={SITE_FONT_STYLE}
    >
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="bg-[radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.92),transparent_22%),linear-gradient(110deg,#05c997_0%,#80e7d2_48%,#b9e6ff_100%)] p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[0.3em] !text-[#07132f]">
            SitGuru Guru Onboarding
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em] !text-[#07132f] sm:text-6xl">
            Complete Your Guru Onboarding Packet
          </h1>

          <p className="mt-4 max-w-4xl text-lg font-bold leading-8 !text-slate-700">
            Review SitGuru’s Guru expectations, confirm the required
            acknowledgments, upload any requested documents, and submit your
            typed signature so Step 5 can be reviewed.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            {submitted === "success" ? (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-base font-black !text-emerald-900">
                      Onboarding packet submitted
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 !text-emerald-800">
                      SitGuru received your acknowledgments and signature. We’ll
                      review your packet and update your onboarding status if
                      anything else is needed.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {errorStatus === "missing" ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-base font-black !text-rose-900">
                      Missing required acknowledgments
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 !text-rose-800">
                      Please enter your legal name and check each required
                      acknowledgment before submitting your packet.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!hasPacketTable ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-base font-black !text-amber-900">
                      Onboarding storage needs setup
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 !text-amber-900">
                      The page is ready, but the Supabase onboarding packet
                      tables need to be created before submissions can be saved.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
                What this packet captures
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RequirementCard
                  icon={<UserCircle2 className="h-5 w-5" />}
                  title="Guru identity and setup"
                  body="Your typed legal name, signature name, and onboarding packet version are saved with your submission."
                />

                <RequirementCard
                  icon={<ClipboardCheck className="h-5 w-5" />}
                  title="Required acknowledgments"
                  body="SitGuru documents that you reviewed provider expectations, safety standards, communications, and payout notes."
                />

                <RequirementCard
                  icon={<UploadCloud className="h-5 w-5" />}
                  title="Requested document uploads"
                  body="If SitGuru requested supporting documents, you can upload them here for private admin review."
                />

                <RequirementCard
                  icon={<LockKeyhole className="h-5 w-5" />}
                  title="Secure recordkeeping"
                  body="Your submission date, agreement version, and basic security metadata are saved for onboarding review."
                />
              </div>
            </section>

            <form
              action={submitGuruOnboardingPacket}
              className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/50 p-6"
            >
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                  Required Review
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
                  Review and acknowledge
                </h2>

                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 !text-slate-700">
                  Check each required item below. This helps SitGuru document
                  your onboarding packet without making the process confusing.
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                <AcknowledgmentCheckbox
                  name="provider_acknowledged"
                  title="Independent provider acknowledgment"
                  body="I understand that Gurus provide pet care services as independent local providers through the SitGuru marketplace."
                  defaultChecked={packet?.provider_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="tax_acknowledged"
                  title="Tax information acknowledgment"
                  body="I understand that payout, tax, W-9, and related payment information may be completed through Stripe or another secure SitGuru-approved method. I will not email sensitive tax forms directly."
                  defaultChecked={packet?.tax_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="safety_acknowledged"
                  title="Trust and safety acknowledgment"
                  body="I understand that SitGuru may require trust and safety steps before public visibility, booking approval, or payout readiness."
                  defaultChecked={packet?.safety_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="care_standards_acknowledged"
                  title="Care standards acknowledgment"
                  body="I agree to provide thoughtful, reliable, and respectful pet care and to follow the details confirmed with each Pet Parent."
                  defaultChecked={packet?.care_standards_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="communication_acknowledged"
                  title="Communication expectations"
                  body="I agree to communicate clearly, respond professionally, and keep booking-related updates organized through SitGuru when available."
                  defaultChecked={packet?.communication_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="payment_acknowledged"
                  title="Payment and payout acknowledgment"
                  body="I understand that Stripe payout setup is required before SitGuru can send eligible booking payouts, commission, or referral earnings."
                  defaultChecked={packet?.payment_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="final_certification_acknowledged"
                  title="Final certification"
                  body="I certify that the information I submit is accurate to the best of my knowledge and that I understand SitGuru may review my onboarding packet before approval."
                  defaultChecked={
                    packet?.final_certification_acknowledged === true
                  }
                />
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <PenLine className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-2xl font-black !text-[#07132f]">
                    Typed signature
                  </h3>
                </div>

                <p className="mt-2 text-sm font-bold leading-6 !text-slate-600">
                  Type your legal name below to sign and submit your Guru
                  onboarding packet.
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-black !text-slate-800">
                    Legal name
                  </span>
                  <input
                    name="legal_name"
                    defaultValue={packet?.legal_name || ""}
                    placeholder="Type your full legal name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold !text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <p className="mt-3 text-xs font-bold leading-5 !text-slate-500">
                  Agreement version: {AGREEMENT_VERSION}
                </p>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-2xl font-black !text-[#07132f]">
                    Requested documents
                  </h3>
                </div>

                <p className="mt-2 text-sm font-bold leading-6 !text-slate-600">
                  Only upload documents SitGuru has requested. Do not upload W-9
                  forms, full SSNs, banking details, or sensitive tax forms here.
                </p>

                <div className="mt-5">
                  <ExistingDocumentList documents={documents} />
                </div>

                <div className="mt-5 grid gap-4">
                  <UploadField
                    name="government_id"
                    title="Government ID or verification document"
                    description="Upload only if SitGuru asked you to provide identity verification documentation."
                    requiredLabel="If requested"
                  />

                  <UploadField
                    name="certification_document"
                    title="Certification, insurance, or pet care document"
                    description="Upload optional pet care certifications, insurance documents, or related support documents."
                    requiredLabel="Optional"
                  />

                  <UploadField
                    name="experience_document"
                    title="Pet care resume or experience document"
                    description="Upload an optional resume or experience summary if it helps SitGuru review your Guru setup."
                    requiredLabel="Optional"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-8 flex min-h-[58px] w-full items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-4 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
              >
                Submit Onboarding Packet
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </form>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] !text-amber-800">
                Secure document note
              </p>
              <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
                Please do not email tax forms, SSNs, banking details, or
                sensitive information directly. Stripe payout setup and tax
                information should be completed only through SitGuru-approved
                secure tools.
              </p>
            </div>
          </section>

          <aside className="h-fit rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-2xl font-black !text-[#07132f]">
              Packet Status
            </h2>

            <div className={`mt-4 rounded-[1.25rem] border p-5 ${statusStyles(packetStatus)}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                Current Status
              </p>

              <p className="mt-2 text-2xl font-black">
                {prettyStatus(packetStatus)}
              </p>

              <p className="mt-2 text-sm font-bold leading-6">
                {isSubmitted
                  ? "Your packet has been submitted. SitGuru will review your onboarding information and update your status if anything else is needed."
                  : "Complete the acknowledgments, add your typed signature, upload any requested documents, and submit your packet for SitGuru review."}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-black !text-slate-950">
                    Submitted
                  </p>
                </div>
                <p className="mt-1 text-sm font-bold !text-slate-600">
                  {formatDate(packet?.submitted_at)}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-black !text-slate-950">
                    Reviewed
                  </p>
                </div>
                <p className="mt-1 text-sm font-bold !text-slate-600">
                  {formatDate(packet?.reviewed_at)}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-black !text-slate-950">
                    Uploaded Documents
                  </p>
                </div>
                <p className="mt-1 text-sm font-bold !text-slate-600">
                  {documents.length.toLocaleString()} saved
                </p>
              </div>
            </div>

            {packet?.admin_notes ? (
              <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-700">
                  SitGuru Note
                </p>
                <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
                  {packet.admin_notes}
                </p>
              </div>
            ) : null}

            {packetUrl ? (
              <a
                href={packetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-emerald-50 px-6 py-3 text-base font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Open External Secure Packet →
              </a>
            ) : null}

            <Link
              href="/guru/dashboard/university"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-6 py-3 text-base font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Continue Guru Academy
            </Link>

            <Link
              href="/guru/dashboard/profile"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-6 py-3 text-base font-black !text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <UserCircle2 className="mr-2 h-5 w-5" />
              Update My Profile
            </Link>

            <Link
              href="/guru/dashboard/earnings"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-6 py-3 text-base font-black !text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <WalletCards className="mr-2 h-5 w-5" />
              View Earnings
            </Link>

            <Link
              href="/guru/dashboard"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
            >
              Back to Dashboard
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}