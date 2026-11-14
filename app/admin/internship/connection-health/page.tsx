import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { getAvaLolaConnections } from "@/lib/internship/ava-lola-connections";
import AvaLolaConnectionHealth from "@/components/internship/AvaLolaConnectionHealth";

export const dynamic="force-dynamic";
export default async function TeamConnectionsPage() {
  const actor=await getAdminIdentity();
  if(!actor?.isSuperUser||!actor.canManageRoles)redirect("/admin/internship");
  const accounts=await getAvaLolaConnections();
  return (
    <main className="admin-desk-surface mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 sm:px-5 lg:px-6">
      <Link href="/admin/internship" className="inline-flex min-h-10 items-center text-sm font-black text-[#2563EB]">← Internship HQ</Link>
      <AvaLolaConnectionHealth initial={accounts} />
    </main>
  );
}
