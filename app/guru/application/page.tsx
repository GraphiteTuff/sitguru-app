import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    saved?: string;
    submitted?: string;
    message?: string;
    error?: string;
    from?: string;
    reason?: string;
  }>;
};

function buildRedirectPath(params?: {
  saved?: string;
  submitted?: string;
  message?: string;
  error?: string;
  from?: string;
  reason?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.saved) searchParams.set("saved", params.saved);
  if (params?.submitted) searchParams.set("submitted", params.submitted);
  if (params?.message) searchParams.set("message", params.message);
  if (params?.error) searchParams.set("error", params.error);
  if (params?.from) searchParams.set("from", params.from);
  if (params?.reason) searchParams.set("reason", params.reason);

  const queryString = searchParams.toString();

  return queryString
    ? `/guru/dashboard/profile?${queryString}`
    : "/guru/dashboard/profile";
}

export default async function GuruApplicationRedirectPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  redirect(buildRedirectPath(resolvedSearchParams));
}