import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";
import BrandKitManager from "@/components/manager/BrandKitManager";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternSharedBrandKitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const actor = await resolveBrandActor();
  const params = searchParams ? await searchParams : {};
  const query = first(params.q);
  const category = first(params.category);
  const sort = first(params.sort) || "approved_first";
  const page = Number(first(params.page) || 1);
  const listed = actor?.capabilities.viewApproved
    ? await listBrandAssets({ actor, query, category, status: "approved", sort, page, pageSize: 12 })
    : { assets: [], total: 0, pages: 1, page: 1, error: "Complete your internship onboarding to access the shared brand library." };
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-4 px-3 pb-24 sm:px-5 lg:px-6">
      <Link href="/intern/toolkit" className="inline-flex min-h-10 items-center text-sm font-black text-[#2563EB] hover:underline">Back to Intern Toolkit</Link>
      <section className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F5F3FF] p-4 sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#1D4ED8]">Shared SitGuru library</p>
        <h1 className="mt-2 text-2xl font-black text-[#0F2744] sm:text-3xl">Brand Kit & Creative Submissions</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          Use the same approved assets as Ava and Admin. Submit your own logos, graphics, flyers or videos directly here;
          verified uploads are sent to Ava for approval before becoming visible to the team.
        </p>
      </section>
      <BrandKitManager
        assets={listed.assets}
        total={listed.total}
        page={listed.page}
        pages={listed.pages}
        loadError={listed.error}
        capabilities={{
          upload: Boolean(actor?.capabilities.upload),
          edit: false,
          archive: false,
          approve: false,
          delete: false,
        }}
        isSuperUser={false}
        query={query}
        category={category}
        status="approved"
        sort={sort}
        sharePointHref=""
        baseHref="/intern/toolkit/brand"
      />
    </main>
  );
}
