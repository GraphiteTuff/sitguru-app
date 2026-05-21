import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailRedirectPage({ params }: PageProps) {
  const resolvedParams = await params;

  redirect(`/admin/customers/${resolvedParams.id}`);
}