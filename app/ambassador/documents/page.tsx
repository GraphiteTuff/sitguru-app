import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderUp,
  LogOut,
  MessageCircle,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  dashboard_slug?: string | null;
  status?: string | null;
  documents_completed_at?: string | null;
};

type RequiredDocument = {
  id: string;
  title: string;
  description?: string | null;
  document_type: string;
  is_required?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type DocumentSubmission = {
  id: string;
  ambassador_id?: string | null;
  required_document_id?: string | null;
  document_type?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  status?: string | null;
  admin_notes?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

type DocumentWithSubmission = RequiredDocument & {
  submission?: DocumentSubmission | null;
};

const documentsBucketName = "ambassador-documents";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value?: string | null) {
  if (!value) return "Not submitted";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not submitted";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(value?: number | null) {
  if (!value || !Number.isFinite(value)) return "—";

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || "Ambassador";
}

function getDocumentStatus(document: DocumentWithSubmission) {
  const status = asString(document.submission?.status).toLowerCase();

  if (status === "approved") return "Approved";
  if (status === "rejected") return "Needs Review";
  if (status === "needs_review") return "Needs Review";
  if (status === "submitted") return "Submitted";
  if (document.submission) return "Submitted";

  return "Missing";
}

function isDocumentApproved(document: DocumentWithSubmission) {
  return asString(document.submission?.status).toLowerCase() === "approved";
}

function isDocumentSubmitted(document: DocumentWithSubmission) {
  return Boolean(document.submission);
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/ambassador/login");
}

async function getLoggedInAmbassador() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/ambassador/login");
  }

  const userEmail = asString(user.email).toLowerCase();

  const { data: ambassador, error: ambassadorError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${user.id},login_email.eq.${userEmail},contact_email.eq.${userEmail},email.eq.${userEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (ambassadorError || !ambassador) {
    await supabase.auth.signOut();
    redirect("/ambassador/login?error=restricted");
  }

  return ambassador as AmbassadorRecord;
}

async function uploadDocumentAction(formData: FormData) {
  "use server";

  const ambassador = await getLoggedInAmbassador();

  const requiredDocumentId = asString(formData.get("required_document_id"));
  const documentType = asString(formData.get("document_type"));
  const uploadedFile = formData.get("document_file");

  if (!requiredDocumentId || !documentType || !(uploadedFile instanceof File)) {
    redirect("/ambassador/documents?error=missing");
  }

  if (!uploadedFile.name || uploadedFile.size <= 0) {
    redirect("/ambassador/documents?error=empty_file");
  }

  const maxFileSize = 25 * 1024 * 1024;

  if (uploadedFile.size > maxFileSize) {
    redirect("/ambassador/documents?error=file_too_large");
  }

  const safeFileName = uploadedFile.name
    .replace(/[^\w.\-()\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 140);

  const referralCode = asString(ambassador.referral_code) || ambassador.id;
  const timestamp = Date.now();
  const storagePath = `${referralCode}/${requiredDocumentId}/${timestamp}-${safeFileName}`;

  const arrayBuffer = await uploadedFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(documentsBucketName)
    .upload(storagePath, fileBuffer, {
      contentType: uploadedFile.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.warn("Unable to upload Ambassador document:", uploadError);
    redirect("/ambassador/documents?error=upload_failed");
  }

  const now = new Date().toISOString();

  const { error: insertError } = await supabaseAdmin
    .from("ambassador_document_submissions")
    .insert({
      ambassador_id: ambassador.id,
      required_document_id: requiredDocumentId,
      document_type: documentType,
      storage_bucket: documentsBucketName,
      storage_path: storagePath,
      file_name: uploadedFile.name,
      file_size: uploadedFile.size,
      mime_type: uploadedFile.type || null,
      status: "submitted",
      submitted_at: now,
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    console.warn("Unable to save Ambassador document submission:", insertError);
    redirect("/ambassador/documents?error=save_failed");
  }

  await refreshAmbassadorDocumentSummary(ambassador.id);

  revalidatePath("/ambassador/documents");
  revalidatePath("/ambassador/dashboard");
  revalidatePath("/ambassador/training");

  redirect("/ambassador/documents?success=uploaded");
}

async function refreshAmbassadorDocumentSummary(ambassadorId: string) {
  const [{ data: requiredDocuments }, { data: submissions }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_required_documents")
      .select("*")
      .eq("is_active", true)
      .eq("is_required", true),
    supabaseAdmin
      .from("ambassador_document_submissions")
      .select("*")
      .eq("ambassador_id", ambassadorId),
  ]);

  const required = (requiredDocuments || []) as RequiredDocument[];
  const submitted = (submissions || []) as DocumentSubmission[];

  const approvedRequiredCount = required.filter((document) =>
    submitted.some(
      (submission) =>
        submission.required_document_id === document.id &&
        asString(submission.status).toLowerCase() === "approved",
    ),
  ).length;

  const allApproved =
    required.length > 0 && approvedRequiredCount >= required.length;

  await supabaseAdmin
    .from("ambassadors")
    .update({
      documents_completed_at: allApproved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);
}

function getNotice(searchParams: Record<string, string | string[] | undefined>) {
  const error = asString(searchParams.error);
  const success = asString(searchParams.success);

  if (success === "uploaded") {
    return {
      tone: "success" as const,
      title: "Document uploaded",
      message:
        "Your document was submitted to SitGuru for review. Admin will approve it after review.",
    };
  }

  if (error === "missing") {
    return {
      tone: "error" as const,
      title: "Missing information",
      message: "Please choose a required document and attach a file.",
    };
  }

  if (error === "empty_file") {
    return {
      tone: "error" as const,
      title: "Empty file",
      message: "The selected file appears to be empty. Please upload another file.",
    };
  }

  if (error === "file_too_large") {
    return {
      tone: "error" as const,
      title: "File too large",
      message: "Please upload a file smaller than 25 MB.",
    };
  }

  if (error === "upload_failed") {
    return {
      tone: "error" as const,
      title: "Upload failed",
      message:
        "SitGuru could not upload that document. Please try again or message support.",
    };
  }

  if (error === "save_failed") {
    return {
      tone: "error" as const,
      title: "Upload saved incorrectly",
      message:
        "The file uploaded but SitGuru could not save the submission record. Please message support.",
    };
  }

  return null;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AmbassadorDocumentsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const notice = getNotice(resolvedSearchParams);
  const ambassador = await getLoggedInAmbassador();

  const fullName = asString(ambassador.full_name) || "SitGuru Ambassador";
  const firstName = getFirstName(fullName);
  const referralCode = asString(ambassador.referral_code);

  const [{ data: requiredDocumentsResult }, { data: submissionsResult }] =
    await Promise.all([
      supabaseAdmin
        .from("ambassador_required_documents")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("ambassador_document_submissions")
        .select("*")
        .eq("ambassador_id", ambassador.id)
        .order("submitted_at", { ascending: false }),
    ]);

  const requiredDocuments =
    (requiredDocumentsResult || []) as RequiredDocument[];
  const submissions = (submissionsResult || []) as DocumentSubmission[];

  const latestSubmissionByDocument = new Map<string, DocumentSubmission>();

  submissions.forEach((submission) => {
    const key = asString(submission.required_document_id);

    if (!key) return;

    if (!latestSubmissionByDocument.has(key)) {
      latestSubmissionByDocument.set(key, submission);
    }
  });

  const documentsWithSubmissions: DocumentWithSubmission[] =
    requiredDocuments.map((document) => ({
      ...document,
      submission: latestSubmissionByDocument.get(document.id) || null,
    }));

  const requiredOnly = documentsWithSubmissions.filter(
    (document) => document.is_required !== false,
  );
  const submittedRequired = requiredOnly.filter(isDocumentSubmitted);
  const approvedRequired = requiredOnly.filter(isDocumentApproved);
  const requiredComplete =
    requiredOnly.length > 0 && approvedRequired.length >= requiredOnly.length;

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-xl font-black text-green-800 ring-1 ring-green-100 sm:h-20 sm:w-20">
                {getInitials(fullName)}
              </div>

              <div className="min-w-0">
                <Link
                  href="/ambassador/dashboard"
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
                >
                  <ArrowLeft size={15} />
                  Back to Dashboard
                </Link>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  SitGuru Student Ambassador Documents
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                  {firstName}, upload onboarding documents
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Submit the documents SitGuru needs for Ambassador onboarding.
                  Admin will review each upload and mark it approved when it is
                  complete.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>{referralCode || "Ambassador"}</Pill>
                  <Pill>
                    {submittedRequired.length} of {requiredOnly.length} submitted
                  </Pill>
                  <Pill>
                    {approvedRequired.length} of {requiredOnly.length} approved
                  </Pill>
                </div>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50 lg:w-auto"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </form>
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileText size={20} />}
            label="Required"
            value={String(requiredOnly.length)}
            detail="Documents needed"
          />
          <MetricCard
            icon={<UploadCloud size={20} />}
            label="Submitted"
            value={String(submittedRequired.length)}
            detail="Waiting for review"
          />
          <MetricCard
            icon={<BadgeCheck size={20} />}
            label="Approved"
            value={String(approvedRequired.length)}
            detail="Reviewed by SitGuru"
          />
          <MetricCard
            icon={<ShieldCheck size={20} />}
            label="Status"
            value={requiredComplete ? "Complete" : "Open"}
            detail={requiredComplete ? "Documents approved" : "Action needed"}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            {documentsWithSubmissions.length ? (
              documentsWithSubmissions.map((document) => (
                <DocumentUploadCard key={document.id} document={document} />
              ))
            ) : (
              <DashboardCard>
                <SectionHeader
                  icon={<ClipboardCheck size={22} />}
                  title="No document requirements yet"
                  detail="SitGuru has not published required Ambassador documents yet."
                />
              </DashboardCard>
            )}
          </div>

          <div className="grid gap-4 content-start">
            <DashboardCard>
              <SectionHeader
                icon={<FolderUp size={22} />}
                title="Upload Tips"
                detail="Use clear files and make sure your name is visible when required."
              />

              <div className="mt-4 grid gap-3">
                <ReminderItem>Accepted files may include PDF, JPG, PNG, DOC, or DOCX.</ReminderItem>
                <ReminderItem>Keep each upload under 25 MB.</ReminderItem>
                <ReminderItem>Admin review is required before a document is approved.</ReminderItem>
                <ReminderItem>Message SitGuru if you uploaded the wrong file.</ReminderItem>
              </div>
            </DashboardCard>

            <DashboardCard>
              <SectionHeader
                icon={<MessageCircle size={22} />}
                title="Need help?"
                detail="Message SitGuru if a document is missing, rejected, or unclear."
              />

              <Link
                href={`/ambassador/messages?ref=${encodeURIComponent(referralCode)}`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Message SitGuru
                <ArrowRight size={17} />
              </Link>
            </DashboardCard>
          </div>
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
          <SectionHeader
            icon={<FileText size={22} />}
            title="Recent Uploads"
            detail="Your latest document submissions for SitGuru review."
          />

          <div className="mt-4 grid gap-3">
            {submissions.length ? (
              submissions.slice(0, 8).map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-black text-green-950">
                        {submission.file_name || "Uploaded document"}
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                        {formatFileSize(submission.file_size)} ·{" "}
                        {submission.mime_type || "file"} · Submitted{" "}
                        {formatDate(submission.submitted_at)}
                      </p>
                    </div>
                    <StatusPill status={asString(submission.status) || "submitted"} />
                  </div>

                  {submission.admin_notes ? (
                    <div className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                      Admin note: {submission.admin_notes}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-5 text-sm font-bold leading-6 text-green-900">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DocumentUploadCard({ document }: { document: DocumentWithSubmission }) {
  const status = getDocumentStatus(document);
  const approved = status === "Approved";

  return (
    <DashboardCard>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            {document.is_required !== false ? (
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                Optional
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-green-950">
            {document.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {document.description || "Upload this document for SitGuru review."}
          </p>

          {document.submission ? (
            <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
              <p className="break-all text-sm font-black text-green-950">
                Latest upload: {document.submission.file_name || "Document"}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                Submitted {formatDate(document.submission.submitted_at)} ·{" "}
                {formatFileSize(document.submission.file_size)}
              </p>

              {document.submission.admin_notes ? (
                <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                  Admin note: {document.submission.admin_notes}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-green-100 bg-[#fbfcf9] p-4">
          {approved ? (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-900">
              <div className="mb-2 flex items-center gap-2 font-black">
                <CheckCircle2 size={18} />
                Approved
              </div>
              SitGuru has reviewed and approved this document.
            </div>
          ) : (
            <form action={uploadDocumentAction} className="grid gap-3">
              <input
                type="hidden"
                name="required_document_id"
                value={document.id}
              />
              <input
                type="hidden"
                name="document_type"
                value={document.document_type}
              />

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Upload File
                </span>
                <input
                  name="document_file"
                  type="file"
                  className="min-h-12 w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-green-900"
                />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <UploadCloud size={17} />
                Upload Document
              </button>

              <p className="text-xs font-bold leading-5 text-slate-500">
                Uploading a new file will submit it for SitGuru review.
              </p>
            </form>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-black text-green-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "approved"
      ? "border-green-100 bg-green-50 text-green-900"
      : normalized === "submitted"
        ? "border-blue-100 bg-blue-50 text-blue-900"
        : normalized === "needs review" ||
            normalized === "needs_review" ||
            normalized === "rejected"
          ? "border-amber-100 bg-amber-50 text-amber-900"
          : "border-red-100 bg-red-50 text-red-800";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles}`}>
      {status}
    </span>
  );
}

function ReminderItem({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-3 text-sm font-bold leading-6 text-green-950">
      {children}
    </div>
  );
}