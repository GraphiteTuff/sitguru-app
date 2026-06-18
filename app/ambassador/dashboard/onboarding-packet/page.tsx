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
  DollarSign,
  FileText,
  Handshake,
  LockKeyhole,
  Megaphone,
  PenLine,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const AGREEMENT_VERSION = "sitguru-ambassador-onboarding-packet-v1-2026";
const DOCUMENT_BUCKET = "ambassador-onboarding-documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

type SearchParams = Record<string, string | string[] | undefined>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type AmbassadorOnboardingPacketRow = {
  id: string;
  ambassador_id: string | null;
  user_id: string | null;
  legal_name: string | null;
  signature_name: string | null;
  agreement_version: string | null;
  referral_commission_acknowledged: boolean | null;
  no_guaranteed_earnings_acknowledged: boolean | null;
  brand_guidelines_acknowledged: boolean | null;
  conduct_acknowledged: boolean | null;
  payout_acknowledged: boolean | null;
  hourly_exception_acknowledged: boolean | null;
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

type AmbassadorOnboardingDocumentRow = {
  id: string;
  ambassador_id: string | null;
  user_id: string | null;
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

function asString(value: unknown) {
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function statusClasses(status: string | null | undefined) {
  const normalized = asString(status).toLowerCase();
  if (["approved", "complete", "completed"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 !text-emerald-950";
  }
  if (["submitted", "pending_review", "in_review"].includes(normalized)) {
    return "border-blue-200 bg-blue-50 !text-blue-950";
  }
  if (["needs_fix", "needs_action"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 !text-amber-950";
  }
  return "border-slate-300 bg-white !text-slate-950 shadow-sm";
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const cleanEmail = asString(email).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${userId},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail},email.eq.${cleanEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) return null;
  return data as AmbassadorRecord;
}

async function uploadAmbassadorDocument({
  supabase,
  ambassadorId,
  userId,
  packetId,
  file,
  documentType,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  ambassadorId: string;
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

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase
    .from("ambassador_onboarding_documents")
    .insert({
      ambassador_id: ambassadorId,
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

  if (insertError) throw new Error(insertError.message);
}

async function submitAmbassadorOnboardingPacket(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/ambassador/login");

  const ambassador = await getAmbassadorForUser(user.id, user.email);
  if (!ambassador) redirect("/ambassador/login?error=restricted");

  const legalName = asString(formData.get("legal_name"));
  const nextAction = asString(formData.get("next_action"));
  const referralCommissionAcknowledged = checkboxValue(
    formData,
    "referral_commission_acknowledged",
  );
  const noGuaranteedEarningsAcknowledged = checkboxValue(
    formData,
    "no_guaranteed_earnings_acknowledged",
  );
  const brandGuidelinesAcknowledged = checkboxValue(
    formData,
    "brand_guidelines_acknowledged",
  );
  const conductAcknowledged = checkboxValue(formData, "conduct_acknowledged");
  const payoutAcknowledged = checkboxValue(formData, "payout_acknowledged");
  const hourlyExceptionAcknowledged = checkboxValue(
    formData,
    "hourly_exception_acknowledged",
  );
  const finalCertificationAcknowledged = checkboxValue(
    formData,
    "final_certification_acknowledged",
  );

  const allRequiredAcknowledged =
    referralCommissionAcknowledged &&
    noGuaranteedEarningsAcknowledged &&
    brandGuidelinesAcknowledged &&
    conductAcknowledged &&
    payoutAcknowledged &&
    hourlyExceptionAcknowledged &&
    finalCertificationAcknowledged;

  if (!legalName || !allRequiredAcknowledged) {
    redirect("/ambassador/dashboard/onboarding-packet?error=missing");
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const userAgent = requestHeaders.get("user-agent") || null;
  const now = new Date().toISOString();

  const payload = {
    ambassador_id: ambassador.id,
    user_id: user.id,
    legal_name: legalName,
    signature_name: legalName,
    agreement_version: AGREEMENT_VERSION,
    referral_commission_acknowledged: referralCommissionAcknowledged,
    no_guaranteed_earnings_acknowledged: noGuaranteedEarningsAcknowledged,
    brand_guidelines_acknowledged: brandGuidelinesAcknowledged,
    conduct_acknowledged: conductAcknowledged,
    payout_acknowledged: payoutAcknowledged,
    hourly_exception_acknowledged: hourlyExceptionAcknowledged,
    final_certification_acknowledged: finalCertificationAcknowledged,
    status: "submitted",
    submitted_at: now,
    ip_address: ipAddress,
    user_agent: userAgent,
    updated_at: now,
  };

  const { data: existingPacket } = await supabase
    .from("ambassador_onboarding_packets")
    .select("id")
    .eq("ambassador_id", ambassador.id)
    .maybeSingle();

  let packetId = existingPacket?.id || "";

  if (packetId) {
    const { error: updateError } = await supabase
      .from("ambassador_onboarding_packets")
      .update(payload)
      .eq("id", packetId);

    if (updateError) throw new Error(updateError.message);
  } else {
    const { data: insertedPacket, error: insertError } = await supabase
      .from("ambassador_onboarding_packets")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);
    packetId = insertedPacket.id;
  }

  await uploadAmbassadorDocument({
    supabase,
    ambassadorId: ambassador.id,
    userId: user.id,
    packetId,
    file: formData.get("program_document") as File | null,
    documentType: "program_or_affiliation_document",
  });

  await uploadAmbassadorDocument({
    supabase,
    ambassadorId: ambassador.id,
    userId: user.id,
    packetId,
    file: formData.get("special_agreement") as File | null,
    documentType: "special_or_hourly_agreement",
  });

  revalidatePath("/ambassador/dashboard");
  revalidatePath("/ambassador/dashboard/onboarding-packet");

  if (nextAction === "dashboard") {
    redirect("/ambassador/dashboard?onboarding=submitted");
  }

  redirect("/ambassador/dashboard/onboarding-packet?submitted=success");
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
          <div className="flex items-center gap-2 text-emerald-700">{icon}</div>
          <p className="mt-1 text-base font-black leading-6 !text-slate-950">
            {title}
          </p>
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
  documents: AmbassadorOnboardingDocumentRow[];
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
          <p className="truncate text-sm font-black !text-slate-950">
            {document.file_name || "Uploaded document"}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] !text-slate-500">
            {prettyStatus(document.document_type)} • {formatDate(document.submitted_at)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function AmbassadorOnboardingPacketPage({
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

  if (error || !user) redirect("/ambassador/login");

  const ambassador = await getAmbassadorForUser(user.id, user.email);
  if (!ambassador) redirect("/ambassador/login?error=restricted");

  const { data: packetData, error: packetError } = await supabase
    .from("ambassador_onboarding_packets")
    .select("*")
    .eq("ambassador_id", ambassador.id)
    .maybeSingle();

  const packet = packetData as AmbassadorOnboardingPacketRow | null;

  const { data: documentsData } = await supabase
    .from("ambassador_onboarding_documents")
    .select("*")
    .eq("ambassador_id", ambassador.id)
    .order("submitted_at", { ascending: false });

  const documents = (documentsData || []) as AmbassadorOnboardingDocumentRow[];
  const hasPacketTable = !packetError;
  const alreadySubmitted = Boolean(packet?.submitted_at);

  return (
    <main className="ambassador-onboarding-packet-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-4 py-5 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <style>{`
        .ambassador-onboarding-packet-page input,
        .ambassador-onboarding-packet-page textarea,
        .ambassador-onboarding-packet-page select { color: #0f172a !important; }
        .ambassador-onboarding-packet-page input::placeholder,
        .ambassador-onboarding-packet-page textarea::placeholder { color: #64748b !important; opacity: 1 !important; }
        .ambassador-onboarding-packet-page input[type="file"] { color: #0f172a !important; background: #ffffff !important; }
        .ambassador-onboarding-packet-page input[type="file"]::file-selector-button { color: #ffffff !important; background: #059669 !important; border: 0 !important; border-radius: 9999px !important; padding: 0.5rem 1rem !important; font-weight: 900 !important; }
        .ambassador-onboarding-packet-page ::selection { background: #bbf7d0 !important; color: #020617 !important; }
      `}</style>

      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="bg-[radial-gradient(circle_at_90%_18%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(110deg,#05c997_0%,#80e7d2_52%,#b9e6ff_100%)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] !text-[#07132f]">
                SitGuru Ambassador Onboarding
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] !text-[#07132f] sm:text-5xl">
                Referral & Commission Packet
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 !text-slate-800 sm:text-base sm:leading-7">
                A quick setup review for referral rules, commission expectations,
                brand conduct, and payout readiness.
              </p>
            </div>

            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClasses(packet?.status)}`}>
              {prettyStatus(packet?.status)}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {submitted === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-base font-black !text-emerald-900">
                    Ambassador packet submitted
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 !text-emerald-800">
                    SitGuru received your Ambassador onboarding packet and will review it.
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
                    Please check each required acknowledgment and type your legal name before submitting.
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
                    Ambassador onboarding storage needs setup
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 !text-amber-900">
                    The page is ready, but the Supabase Ambassador onboarding tables need to be created.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <StepCard
              number={1}
              title="Confirm"
              body="Review referral and commission expectations."
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
              title="Share"
              body="Finish setup and start sharing SitGuru."
              icon={<Megaphone className="h-4 w-4" />}
            />
          </div>

          <form action={submitAmbassadorOnboardingPacket} className="space-y-4">
            <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Handshake className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
                    Required acknowledgments
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                    SitGuru Ambassadors are generally referral-based and commission-based. Hourly opportunities are rare and require separate SitGuru approval in writing.
                  </p>
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black !text-slate-950">
                  What you are confirming
                  <ChevronDown className="h-4 w-4 text-emerald-700" />
                </summary>
                <div className="mt-3 space-y-2 text-sm font-bold leading-6 !text-slate-700">
                  <p>• Ambassador activity is primarily referral and commission based.</p>
                  <p>• Payouts are not guaranteed and depend on SitGuru rules and tracking.</p>
                  <p>• Hourly opportunities are rare and separately approved in writing.</p>
                  <p>• Ambassadors must represent SitGuru accurately and professionally.</p>
                  <p>• Stripe payout setup may be required before eligible rewards are paid.</p>
                </div>
              </details>

              <div className="mt-4 grid gap-3">
                <AcknowledgmentCheckbox
                  name="referral_commission_acknowledged"
                  title="Referral and commission terms"
                  body="I understand Ambassador activity is generally referral-based and commission-based."
                  defaultChecked={packet?.referral_commission_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="no_guaranteed_earnings_acknowledged"
                  title="No guaranteed earnings"
                  body="I understand referrals, commissions, rewards, and payouts are not guaranteed."
                  defaultChecked={packet?.no_guaranteed_earnings_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="brand_guidelines_acknowledged"
                  title="Brand and social media expectations"
                  body="I agree to share SitGuru accurately and avoid false promises or unapproved claims."
                  defaultChecked={packet?.brand_guidelines_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="conduct_acknowledged"
                  title="Professional conduct"
                  body="I agree to represent SitGuru professionally in community, social, and referral conversations."
                  defaultChecked={packet?.conduct_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="payout_acknowledged"
                  title="Stripe payout acknowledgment"
                  body="I understand Stripe payout setup may be required before eligible referral or commission earnings are paid."
                  defaultChecked={packet?.payout_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="hourly_exception_acknowledged"
                  title="Hourly work is rare and separate"
                  body="I understand hourly work is rare and must be separately approved by SitGuru in writing."
                  defaultChecked={packet?.hourly_exception_acknowledged === true}
                />
                <AcknowledgmentCheckbox
                  name="final_certification_acknowledged"
                  title="Final certification"
                  body="I certify this information is accurate and understand SitGuru may review my Ambassador onboarding packet."
                  defaultChecked={packet?.final_certification_acknowledged === true}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
                    Type your legal name
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                    This acts as your typed signature for the Ambassador onboarding packet.
                  </p>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black !text-slate-800">
                      Legal name
                    </span>
                    <input
                      name="legal_name"
                      defaultValue={packet?.legal_name || asString(ambassador.full_name)}
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
                    Documents are only needed if SitGuru requested them. You can save and return to your Ambassador dashboard.
                  </p>
                </div>
                <button
                  type="submit"
                  name="next_action"
                  value="dashboard"
                  className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[1rem] bg-[#07132f] px-5 py-3 text-sm font-black !text-white transition hover:-translate-y-0.5 hover:bg-[#0b1436] sm:w-auto"
                >
                  {alreadySubmitted ? "Update & Return to Dashboard" : "Save & Return to Dashboard"}
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
                    Upload documents only if SitGuru requested them. Do not upload W-9 forms, full SSNs, banking details, or sensitive payment information here.
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
                    name="program_document"
                    title="Program, school, community, or affiliation document"
                    description="Optional. Upload only if SitGuru requested a specific program or affiliation document."
                  />
                  <UploadField
                    name="special_agreement"
                    title="Special or hourly agreement"
                    description="Optional. Upload only if SitGuru separately approved a special or hourly arrangement."
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
                  Save this packet, then return to your Ambassador dashboard. Payout setup will stay inside the Ambassador workflow.
                </p>
              </div>
              <button
                type="submit"
                name="next_action"
                value="payouts"
                className="flex min-h-[56px] w-full items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-4 text-base font-black !text-white transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
              >
                {alreadySubmitted ? "Update & Return to Ambassador Dashboard" : "Save & Return to Ambassador Dashboard"}
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
                  Submitted: {formatDate(packet?.submitted_at)} • Reviewed: {formatDate(packet?.reviewed_at)} • Documents: {documents.length.toLocaleString()}
                </p>
              </div>
            </div>
            {packet?.admin_notes ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 !text-amber-900">
                {packet.admin_notes}
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/ambassador/dashboard"
                className="flex min-h-[48px] items-center justify-center rounded-[1rem] bg-[#07132f] px-4 py-3 text-sm font-black !text-white hover:bg-[#0b1436]"
              >
                Dashboard
              </Link>
              <Link
                href="/ambassador/messages"
                className="flex min-h-[48px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-4 py-3 text-sm font-black !text-emerald-800 hover:bg-emerald-50"
              >
                Message SitGuru
              </Link>
            </div>
          </aside>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-800">
              Security note
            </p>
            <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
              Do not upload tax forms, full SSNs, banking details, or sensitive payment information here. Stripe and tax setup should only be completed through SitGuru-approved secure tools.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
