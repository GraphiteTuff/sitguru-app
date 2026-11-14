import Link from "next/link";
import { redirect } from "next/navigation";
import BrandKitManager from "@/components/manager/BrandKitManager";
import InitialBrandApprovalControl from "@/components/manager/InitialBrandApprovalControl";
import { getAdminIdentity } from "@/lib/admin/access";
import { SITGURU_SHAREPOINT_FOLDERS, sitguruSharePointFolderHref } from "@/lib/admin/growth/sharepoint-files";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";
import { listBrandAssets, resolveBrandActor, countInitialBrandAssetsToApprove } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AdminBrandKitPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) redirect("/admin/login?next=/admin/toolkit/brand");
  const actor = await resolveBrandActor();
  const params = searchParams ? await searchParams : {};
  const category = first(params.category);
  const status = first(params.status);
  const query = first(params.q);
  const sort = first(params.sort) || "approved_first";
  const page = Number(first(params.page) || 1);
  const masterFolder = SITGURU_SHAREPOINT_FOLDERS.find((folder) => folder.id === "general-brand-kit");
  const sharePointHref = actor && masterFolder && isSitGuruWorkEmail(actor.email) ? sitguruSharePointFolderHref(masterFolder) : "";
  const listed = actor?.capabilities.viewApproved
    ? await listBrandAssets({ actor, query, category, status, sort, page, pageSize: 12 })
    : { assets: [], error: "Approved assets are not available on this account.", page: 1, pages: 1, total: 0 };
  const baseline = actor?.isSuperUser ? await countInitialBrandAssetsToApprove(actor) : { count: 0, error: "" };
  return (
    <main className="admin-desk-surface mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 sm:px-5 lg:px-6">
      <Link href="/admin/toolkit" className="inline-flex min-h-10 items-center text-sm font-black text-[#2563EB]">Admin Toolkit</Link>
      <div>
        <h1 className="text-3xl font-black text-[#0F2744]">Shared Brand Kit</h1>
        <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          The same approved logos, templates, graphics and guidelines used by managers and interns. Authorized admins can manage assets; only Super Admins approve or delete them.
        </p>
      </div>
      {baseline.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{baseline.error}</p> : null}
      {actor?.isSuperUser ? <InitialBrandApprovalControl pendingCount={baseline.count} /> : null}
      <BrandKitManager
        assets={listed.assets}
        total={listed.total}
        page={listed.page}
        pages={listed.pages}
        loadError={listed.error}
        capabilities={{
          upload: Boolean(actor?.capabilities.upload),
          edit: Boolean(actor?.capabilities.edit),
          archive: Boolean(actor?.capabilities.archive),
          approve: Boolean(actor?.capabilities.approve),
          delete: Boolean(actor?.capabilities.delete),
        }}
        isSuperUser={Boolean(actor?.isSuperUser)}
        query={query}
        category={category}
        status={status}
        sort={sort}
        sharePointHref={sharePointHref}
        baseHref="/admin/toolkit/brand"
      />
    </main>
  );
}
