import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import GuruCredentialReview from "@/components/admin/GuruCredentialReview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guru Credentials | SitGuru Admin",
};

export default async function AdminGuruCredentialsPage() {
  const identity = await getAdminIdentity();
  if (!identity?.canAccessAdmin) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <GuruCredentialReview />
    </div>
  );
}
