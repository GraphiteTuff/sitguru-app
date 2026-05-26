import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ResumeViewerPageProps = {
  params:
    | Promise<{
        id: string;
      }>
    | {
        id: string;
      };
};

const resumeBucketName = "ambassador-resumes";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStoragePath(value: string) {
  if (!value) return "";

  const trimmed = value.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return trimmed
    .replace(/^\/+/, "")
    .replace(/^storage\/v1\/object\/(?:sign|public)\/ambassador-resumes\//, "")
    .replace(/^ambassador-resumes\//, "");
}

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export default async function AmbassadorLeadResumeViewerPage({
  params,
}: ResumeViewerPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const leadId = resolvedParams.id;

  if (!leadId) {
    redirect("/admin/ambassador-leads?resume=missing");
  }

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("ambassador_leads")
    .select(
      "id, full_name, resume_file_path, resume_file_url, resume_url, resume_link",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    console.warn("Unable to load ambassador lead resume record:", leadError);
    redirect("/admin/ambassador-leads?resume=missing");
  }

  const resumeSource =
    asString(lead.resume_file_path) ||
    asString(lead.resume_file_url) ||
    asString(lead.resume_url) ||
    asString(lead.resume_link);

  const normalizedSource = normalizeStoragePath(resumeSource);

  if (!normalizedSource) {
    redirect("/admin/ambassador-leads?resume=missing");
  }

  if (isExternalUrl(normalizedSource)) {
    redirect(normalizedSource);
  }

  const { data: signedResume, error: signedUrlError } =
    await supabaseAdmin.storage
      .from(resumeBucketName)
      .createSignedUrl(normalizedSource, 60 * 10, {
        download: false,
      });

  if (signedUrlError || !signedResume?.signedUrl) {
    console.warn("Unable to create signed resume URL:", signedUrlError);
    redirect("/admin/ambassador-leads?resume=error");
  }

  redirect(signedResume.signedUrl);
}
