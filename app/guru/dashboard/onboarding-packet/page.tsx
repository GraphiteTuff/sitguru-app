import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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

type SearchParams = Record<string, string | string[] | undefined>;

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

function asString(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getFirstSearchParam(
  searchParams: SearchParams | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) return value[0] || "";
  return value || "";
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
      return "border-emerald-200 bg-emerald-50 !text-emerald-950";
    case "submitted":
    case "pending_review":
    case "in_review":
      return "border-blue-200 bg-blue-50 !text-blue-950";
    case "needs_fix":
    case "needs_action":
      return "border-amber-200 bg-amber-50 !text-amber-950";
    case "rejected":
      return "border-rose-200 bg-rose-50 !text-rose-950";
    default:
      return "border-slate-300 bg-white !text-slate-950 shadow-sm";
  }
}

function isPacketSubmitted(packet: GuruOnboardingPacketRow | null) {
  const status = String(packet?.status || "")
    .trim()
    .toLowerCase();

  return Boolean(
    packet?.submitted_at ||
      ["submitted", "pending_review", "in_review", "approved", "complete", "completed"].includes(status),
  );
}

function getPacketStatusLabel(packet: GuruOnboardingPacketRow | null) {
  if (!packet) return "Not Started";

  const status = String(packet.status || "")
    .trim()
    .toLowerCase();

  if (["approved", "complete", "completed"].includes(status)) {
    return "Complete";
  }

  if (["submitted", "pending_review", "in_review"].includes(status)) {
    return "Submitted";
  }

  if (["needs_fix", "needs_action"].includes(status)) {
    return "Needs Fix";
  }

  return prettyStatus(packet.status);
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
  if (!file || file.size <= 0) return;

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
  const nextAction = asString(formData.get("next_action"));
  const providerAcknowledged = checkboxValue(
    formData,
    "provider_acknowledged",
  );
  const safetyAcknowledged = checkboxValue(formData, "safety_acknowledged");
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
    safetyAcknowledged &&
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
    tax_acknowledged: paymentAcknowledged,
    safety_acknowledged: safetyAcknowledged,
    care_standards_acknowledged: safetyAcknowledged,
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

  revalidatePath("/guru/dashboard");
  revalidatePath("/guru/dashboard/onboarding-packet");

  if (nextAction === "step6") {
    redirect("/api/stripe/connect/onboard?role=guru");
  }

  redirect("/guru/dashboard/onboarding-packet?submitted=success");
}

function StatusPill({ packet }: { packet: GuruOnboardingPacketRow | null }) {
  const label = getPacketStatusLabel(packet);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusStyles(
        packet?.status,
      )}`}
    >
      {label}
    </span>
  );
}

function StepCard({
  number,
  title,
  body,
  icon,
}: {
  number: number;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black !text-white">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700">{icon}</span>
            <p className="text-base font-black leading-6 !text-slate-950">
              {title}
            </p>
          </div>
          <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
            {body}
          </p>
        </div>
      </div>
    </div>
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
    <label className="block rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-5 w-5 shrink-0 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div>
          <p className="text-sm font-black leading-5 !text-slate-950">
            {title}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
            {body}
          </p>
        </div>
      </div>
    </label>
  );
}

function UploadField({
  name,
  title,
  description,
}: {
  name: string;
  title: string;
  description: string;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <UploadCloud className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black !text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
            {description}
          </p>
          <input
            name={name}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold !text-slate-950 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-black file:!text-white hover:file:bg-emerald-700"
          />
        </div>
      </div>
    </label>
  );
}

function ExistingDocumentList({
  documents,
}: {
  documents: GuruOnboardingDocumentRow[];
}) {
  if (!documents.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 !text-slate-600">
        No documents uploaded yet. Upload only if SitGuru requested a document.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {documents.map((document) => (
        <div
          key={document.id}
          className="rounded-2xl border border-emerald-100 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black !text-slate-950">
                {document.file_name || "Uploaded document"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] !text-slate-500">
                {prettyStatus(document.document_type)} • {formatDate(document.submitted_at)}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-800">
              {prettyStatus(document.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
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
  const alreadySubmitted = isPacketSubmitted(packet);

  return (
    <main
      className="guru-onboarding-packet-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-4 py-5 text-slate-950 sm:px-6 sm:py-8 lg:px-8"
      style={SITE_FONT_STYLE}
    >
      <style>{`
        .guru-onboarding-packet-page input,
        .guru-onboarding-packet-page textarea,
        .guru-onboarding-packet-page select {
          color: #0f172a !important;
        }
        .guru-onboarding-packet-page input::placeholder,
        .guru-onboarding-packet-page textarea::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }
        .guru-onboarding-packet-page input[type="file"] {
          color: #0f172a !important;
          background: #ffffff !important;
        }
        .guru-onboarding-packet-page input[type="file"]::file-selector-button {
          color: #ffffff !important;
          background: #059669 !important;
          border: 0 !important;
          border-radius: 9999px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 900 !important;
        }
        .guru-onboarding-packet-page ::selection {
          background: #bbf7d0 !important;
          color: #020617 !important;
        }
      `}</style>

      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="bg-[radial-gradient(circle_at_90%_18%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(110deg,#05c997_0%,#80e7d2_52%,#b9e6ff_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] !text-[#07132f]">
                SitGuru Guru Onboarding
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] !text-[#07132f] sm:text-5xl">
                Step 5: Onboarding Packet
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 !text-slate-800 sm:text-base sm:leading-7">
                A quick 2–3 minute review. Confirm the essentials, type your
                legal name, and upload only documents SitGuru requested.
              </p>
            </div>

            <div className="shrink-0">
              <StatusPill packet={packet} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {submitted === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-base font-black !text-emerald-900">
                    Packet submitted
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 !text-emerald-800">
                    SitGuru received your Step 5 packet. We’ll review it and let
                    you know if anything else is needed.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {errorStatus === "missing" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-700" />
                <div>
                  <p className="text-base font-black !text-rose-900">
                    One more step needed
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 !text-rose-800">
                    Please check each required acknowledgment and type your legal
                    name before submitting.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!hasPacketTable ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-base font-black !text-amber-900">
                    Onboarding storage needs setup
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 !text-amber-900">
                    The page is ready, but the Supabase packet tables need to be
                    available before submissions can be saved.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <StepCard
              number={1}
              title="Review"
              body="Confirm the required Guru expectations."
              icon={<ClipboardCheck className="h-4 w-4" />}
            />
            <StepCard
              number={2}
              title="Sign"
              body="Type your legal name as your signature."
              icon={<PenLine className="h-4 w-4" />}
            />
            <StepCard
              number={3}
              title="Submit"
              body="Upload requested docs and send for review."
              icon={<FileCheck2 className="h-4 w-4" />}
            />
          </div>

          <form action={submitGuruOnboardingPacket} className="space-y-4">
            <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
                    Required acknowledgments
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                    Check each item below. This keeps Step 5 simple while still
                    documenting the required clicks.
                  </p>
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black !text-slate-950">
                  What you are confirming
                  <ChevronDown className="h-4 w-4 text-emerald-700" />
                </summary>
                <div className="mt-3 space-y-2 text-sm font-bold leading-6 !text-slate-700">
                  <p>• You understand Gurus are independent local providers.</p>
                  <p>• You agree to safe, respectful, reliable pet care.</p>
                  <p>• You agree to communicate clearly about bookings.</p>
                  <p>• You understand Stripe is required for eligible payouts.</p>
                  <p>• You understand SitGuru may review your packet.</p>
                </div>
              </details>

              <div className="mt-4 grid gap-3">
                <AcknowledgmentCheckbox
                  name="provider_acknowledged"
                  title="Independent provider setup"
                  body="I understand Gurus provide services as independent local providers through SitGuru."
                  defaultChecked={packet?.provider_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="safety_acknowledged"
                  title="Safety and care standards"
                  body="I agree to provide thoughtful, reliable pet care and follow confirmed care instructions."
                  defaultChecked={
                    packet?.safety_acknowledged === true ||
                    packet?.care_standards_acknowledged === true
                  }
                />

                <AcknowledgmentCheckbox
                  name="communication_acknowledged"
                  title="Communication expectations"
                  body="I agree to communicate professionally and keep booking-related updates clear."
                  defaultChecked={packet?.communication_acknowledged === true}
                />

                <AcknowledgmentCheckbox
                  name="payment_acknowledged"
                  title="Payments, tax, and payouts"
                  body="I understand Stripe setup is required before eligible booking payouts, commission, or referral earnings can be paid."
                  defaultChecked={
                    packet?.payment_acknowledged === true ||
                    packet?.tax_acknowledged === true
                  }
                />

                <AcknowledgmentCheckbox
                  name="final_certification_acknowledged"
                  title="Final certification"
                  body="I certify this information is accurate and understand SitGuru may review my onboarding packet."
                  defaultChecked={
                    packet?.final_certification_acknowledged === true
                  }
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <UserCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
                    Type your legal name
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                    This acts as your typed signature for the onboarding packet.
                  </p>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black !text-slate-800">
                      Legal name
                    </span>
                    <input
                      name="legal_name"
                      defaultValue={packet?.legal_name || ""}
                      placeholder="Type your full legal name"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold !text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <p className="mt-2 text-xs font-bold leading-5 !text-slate-500">
                    Agreement version: {AGREEMENT_VERSION}
                  </p>
                </div>
              </div>
            </section>

            <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black !text-emerald-950">
                    Ready after signature?
                  </p>
                  <p className="mt-1 text-xs font-bold leading-5 !text-emerald-800">
                    Documents are only needed if SitGuru requested them. You can submit now.
                  </p>
                </div>

                <button
                  type="submit"
                  name="next_action"
                  value="step6"
                  className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[1rem] bg-[#07132f] px-5 py-3 text-sm font-black !text-white transition hover:-translate-y-0.5 hover:bg-[#0b1436] sm:w-auto"
                >
                  {alreadySubmitted ? "Update & Continue to Step 6" : "Save & Continue to Step 6"}
                  <ArrowRight className="ml-2 h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
                    Documents
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                    Keep this simple. Upload documents only if SitGuru asked for
                    them. Do not upload W-9 forms, full SSNs, or banking details.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ExistingDocumentList documents={documents} />
              </div>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black !text-slate-950">
                  Upload requested documents
                  <ChevronDown className="h-4 w-4 text-emerald-700" />
                </summary>

                <div className="mt-4 grid gap-3">
                  <UploadField
                    name="government_id"
                    title="Government ID or verification document"
                    description="Upload only if SitGuru requested this for onboarding review."
                  />

                  <UploadField
                    name="certification_document"
                    title="Certification, insurance, or pet care document"
                    description="Optional support document if it helps your Guru review."
                  />
                </div>
              </details>
            </section>

            <div className="sticky bottom-3 z-20 rounded-[1.25rem] border border-slate-200 bg-white/95 p-3 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur sm:static sm:shadow-none">
              <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
                <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-700">
                  Next Step
                </p>
                <p className="mt-1 text-sm font-bold leading-5 !text-emerald-900">
                  Save this packet, then continue to Step 6 to connect payouts.
                </p>
              </div>

              <button
                type="submit"
                name="next_action"
                value="step6"
                className="flex min-h-[56px] w-full items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-4 text-base font-black !text-white transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
              >
                {alreadySubmitted ? "Update & Move to Step 6" : "Save & Move to Step 6"}
                <ArrowRight className="ml-2 h-5 w-5 text-white" />
              </button>

              <button
                type="submit"
                name="next_action"
                value="stay"
                className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-6 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50"
              >
                Save Packet Only
              </button>
            </div>
          </form>

          <aside className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-base font-black !text-slate-950">
                  Packet status
                </p>
                <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                  Submitted: {formatDate(packet?.submitted_at)} • Reviewed:{" "}
                  {formatDate(packet?.reviewed_at)} • Documents:{" "}
                  {documents.length.toLocaleString()}
                </p>
              </div>
            </div>

            {packet?.admin_notes ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 !text-amber-900">
                {packet.admin_notes}
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {packetUrl ? (
                <a
                  href={packetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[48px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black !text-emerald-800 hover:bg-emerald-100"
                >
                  External Packet
                </a>
              ) : null}

              <Link
                href="/guru/dashboard/university"
                className="flex min-h-[48px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-4 py-3 text-sm font-black !text-emerald-800 hover:bg-emerald-50"
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Academy
              </Link>

              <Link
                href="/guru/dashboard/earnings"
                className="flex min-h-[48px] items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black !text-slate-800 hover:bg-slate-50"
              >
                <WalletCards className="mr-2 h-4 w-4" />
                Earnings
              </Link>

              <Link
                href="/guru/dashboard"
                className="flex min-h-[48px] items-center justify-center rounded-[1rem] bg-[#07132f] px-4 py-3 text-sm font-black !text-white hover:bg-[#0b1436]"
              >
                Back to Dashboard
              </Link>
            </div>
          </aside>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-800">
              Security note
            </p>
            <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
              Do not upload tax forms, full SSNs, banking details, or sensitive
              payment information here. Stripe and tax setup should only be
              completed through SitGuru-approved secure tools.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
