import Link from "next/link";
import BrandKitManager from "@/components/manager/BrandKitManager";
import { SITGURU_SHAREPOINT_FOLDERS, sitguruSharePointFolderHref } from "@/lib/admin/growth/sharepoint-files";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerBrandKitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const actor = await resolveBrandActor();
  const params = searchParams ? await searchParams : {};
  const category = first(params.category);
  const status = first(params.status);
  const query = first(params.q);
  const sort = first(params.sort) || "approved_first";
  const page = Number(first(params.page) || "1");
  const brandFolder = SITGURU_SHAREPOINT_FOLDERS.find((folder) => folder.id === "general-brand-kit");
  const sharePointHref =
    brandFolder && isSitGuruWorkEmail(access.actor.email) ? sitguruSharePointFolderHref(brandFolder) : "";
  const listed = actor
    ? await listBrandAssets({ actor, query, category, status, sort, page, pageSize: 12 })
    : { assets: [], error: "Sign in required.", page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <div>
        <Link href="/manager/toolkit" className="text-sm font-bold text-[#2563EB]">
          Manager Toolkit
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#0F2744] sm:text-3xl">Brand Kit</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
          Your SitGuru library of approved logos, graphics, and creative resources. SharePoint keeps the master files. This page is the team download library, and uploads are not copied there automatically.
        </p>
      </div>
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
      />
    </div>
  );
}
