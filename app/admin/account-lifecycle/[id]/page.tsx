import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params?: Promise<{
    id?: string;
  }>;
};

/**
 * Path-based review URL used by SitGuru Alerts.
 * Avoids `?query=` getting mangled to `@query=` by email/SMS clients.
 */
export default async function AccountLifecycleByIdPage({ params }: PageProps) {
  const resolved = params ? await params : {};
  const id = String(resolved.id || "").trim();

  if (!id) {
    redirect("/admin/account-lifecycle");
  }

  redirect(`/admin/account-lifecycle?query=${encodeURIComponent(id)}`);
}
