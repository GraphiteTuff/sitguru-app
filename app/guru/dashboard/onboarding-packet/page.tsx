import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  if (!status) return "Not started";

  const normalized = String(status).trim().toLowerCase();
  if (normalized === "government_id") return "ID document";
  if (normalized === "certification_or_insurance") {
    return "Certification / insurance";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
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
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "needs_fix":
    case "needs_action":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-white text-slate-800";
  }
}

function isPacketSubmitted(packet: GuruOnboardingPacketRow | null) {
  const status = String(packet?.status || "")
    .trim()
    .toLowerCase();

  return Boolean(
    packet?.submitted_at ||
      [
        "submitted",
        "pending_review",
        "in_review",
        "approved",
        "complete",
        "completed",
      ].includes(status),
  );
}

function getPacketStatusLabel(packet: GuruOnboardingPacketRow | null) {
  if (!packet) return "Not started yet";

  const status = String(packet.status || "")
    .trim()
    .toLowerCase();

  if (["approved", "complete", "completed"].includes(status)) {
    return "Approved";
  }
  if (["submitted", "pending_review", "in_review"].includes(status)) {
    return "Sent — under review";
  }
  if (["needs_fix", "needs_action"].includes(status)) {
    return "Needs a quick fix";
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
  const certificationFile = formData.get(
    "certification_document",
  ) as File | null;

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
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
        packet?.status,
      )}`}
    >
      {getPacketStatusLabel(packet)}
    </span>
  );
}

function Notice({
  tone,
  title,
  body,
  icon,
}: {
  tone: "success" | "error" | "warn";
  title: string;
  body: string;
  icon: ReactNode;
}) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{body}</p>
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
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-950">
          {title}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-slate-600">
          {body}
        </span>
      </span>
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
    <label className="block rounded-xl border border-slate-200 bg-white p-3.5">
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#0D5C3A]">
          <UploadCloud className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-950">
            {title}
          </span>
          <span className="mt-0.5 block text-sm leading-5 text-slate-600">
            {description}
          </span>
          <input
            name={name}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="mt-3 block w-full text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-[#0D5C3A] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0a4a2e]"
          />
        </span>
      </span>
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
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-600">
        Nothing uploaded yet — that’s normal for most Gurus.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li
          key={document.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {document.file_name || "Uploaded document"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {prettyStatus(document.document_type)}
              {formatDate(document.submitted_at)
                ? ` · ${formatDate(document.submitted_at)}`
                : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {prettyStatus(document.status)}
          </span>
        </li>
      ))}
    </ul>
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
  const submittedLabel = formatDate(packet?.submitted_at);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/guru/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-[#0D5C3A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <StatusPill packet={packet} />
      </div>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D5C3A]">
          Step 5 of becoming bookable
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Quick agreement packet
        </h1>
        <p className="mt-2 max-w-xl text-base leading-7 text-slate-600">
          This is a short yes-check so SitGuru knows you understand the basics.
          Most Gurus finish in a couple of minutes.
        </p>
      </header>

      <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
        <p className="text-sm font-semibold text-[#0D5C3A]">
          What to do on this page
        </p>
        <ol className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
          <li>
            <span className="font-semibold text-slate-950">1.</span> Check the
            five boxes (you agree to the care & payout basics).
          </li>
          <li>
            <span className="font-semibold text-slate-950">2.</span> Type your
            full legal name (that’s your signature).
          </li>
          <li>
            <span className="font-semibold text-slate-950">3.</span> Hit submit —
            then set up how you get paid (next step).
          </li>
        </ol>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Documents are usually not needed. Only upload something if SitGuru
          asked you for it.
        </p>
      </div>

      <div className="space-y-4">
        {submitted === "success" ? (
          <Notice
            tone="success"
            title="Nice — we got your packet"
            body="SitGuru will review it. Next, connect how you get paid so booking payouts can reach you."
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
          />
        ) : null}

        {errorStatus === "missing" ? (
          <Notice
            tone="error"
            title="One more thing"
            body="Please check all five boxes and type your full legal name, then try again."
            icon={<AlertTriangle className="h-5 w-5 text-rose-700" />}
          />
        ) : null}

        {!hasPacketTable ? (
          <Notice
            tone="warn"
            title="We’re finishing setup on our side"
            body="You can still review this page, but saving may not work until SitGuru finishes packet storage."
            icon={<AlertTriangle className="h-5 w-5 text-amber-700" />}
          />
        ) : null}

        {packet?.admin_notes ? (
          <Notice
            tone="warn"
            title="Message from SitGuru"
            body={packet.admin_notes}
            icon={<AlertTriangle className="h-5 w-5 text-amber-700" />}
          />
        ) : null}

        {submittedLabel ? (
          <p className="text-sm text-slate-500">
            You last sent this on {submittedLabel}
            {packet?.reviewed_at
              ? ` · SitGuru reviewed it on ${formatDate(packet.reviewed_at)}`
              : ""}
            .
          </p>
        ) : null}

        <form action={submitGuruOnboardingPacket} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              1. Check these boxes
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Read each one. If it sounds right, check the box.
            </p>

            <div className="mt-4 grid gap-2.5">
              <AcknowledgmentCheckbox
                name="provider_acknowledged"
                title="I’m an independent Guru"
                body="I understand I’m a local pet-care provider working through SitGuru — not a SitGuru employee."
                defaultChecked={packet?.provider_acknowledged === true}
              />
              <AcknowledgmentCheckbox
                name="safety_acknowledged"
                title="I’ll care for pets safely"
                body="I’ll show up reliably, treat pets with care, and follow the Pet Parent’s instructions for each booking."
                defaultChecked={
                  packet?.safety_acknowledged === true ||
                  packet?.care_standards_acknowledged === true
                }
              />
              <AcknowledgmentCheckbox
                name="communication_acknowledged"
                title="I’ll communicate clearly"
                body="I’ll keep booking messages clear and professional so Pet Parents know what’s going on."
                defaultChecked={packet?.communication_acknowledged === true}
              />
              <AcknowledgmentCheckbox
                name="payment_acknowledged"
                title="I need payout setup to get paid"
                body="I understand I connect payouts (Stripe) before SitGuru can send me money from eligible bookings."
                defaultChecked={
                  packet?.payment_acknowledged === true ||
                  packet?.tax_acknowledged === true
                }
              />
              <AcknowledgmentCheckbox
                name="final_certification_acknowledged"
                title="This info is true"
                body="Everything I submit here is accurate, and SitGuru may review my packet."
                defaultChecked={
                  packet?.final_certification_acknowledged === true
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              2. Sign with your name
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Type your full legal name below. That acts as your signature for
              this packet.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                Your full legal name
              </span>
              <input
                name="legal_name"
                defaultValue={packet?.legal_name || ""}
                placeholder="Example: Jordan Lee Smith"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0D5C3A] focus:ring-4 focus:ring-[#0D5C3A]/15"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              3. Documents
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Usually skip this
              </span>
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Most Gurus don’t upload anything here. Only add a file if SitGuru
              asked you for an ID or certificate. Please don’t upload tax forms,
              Social Security numbers, or bank details on this page.
            </p>

            <div className="mt-4">
              <ExistingDocumentList documents={documents} />
            </div>

            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950">
                SitGuru asked me for a document — upload here
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </summary>
              <div className="mt-3 grid gap-2.5">
                <UploadField
                  name="government_id"
                  title="Photo ID"
                  description="Only if SitGuru asked you to verify your identity."
                />
                <UploadField
                  name="certification_document"
                  title="Certificate or insurance paper"
                  description="Optional — only if it helps your review."
                />
              </div>
            </details>
          </section>

          <div className="sticky bottom-3 z-10 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur sm:static sm:shadow-none">
            <p className="px-1 text-center text-xs leading-5 text-slate-500 sm:text-left">
              After you submit, you’ll set up how you get paid (Step 6).
            </p>
            <button
              type="submit"
              name="next_action"
              value="step6"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 py-3 text-sm font-semibold !text-white transition hover:bg-[#0a4a2e]"
            >
              {alreadySubmitted
                ? "Save again & set up how I get paid"
                : "Submit & set up how I get paid"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="submit"
              name="next_action"
              value="stay"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {alreadySubmitted
                ? "Save changes and stay here"
                : "Submit and stay here"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
