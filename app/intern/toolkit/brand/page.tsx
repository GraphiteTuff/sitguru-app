import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listBrandAssets, listOwnBrandSubmissions, resolveBrandActor } from "@/lib/manager/brand-kit-store";
import BrandKitManager from "@/components/manager/BrandKitManager";
import BrandStyleReference from "@/components/portal/BrandStyleReference";

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
  const submissions = actor?.intern ? await listOwnBrandSubmissions(actor) : [];
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-4 px-3 pb-24 sm:px-5 lg:px-6">
      <Link href="/intern/toolkit" className="inline-flex min-h-10 items-center text-sm font-black text-[#2563EB] hover:underline">Back to Intern Toolkit</Link>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0D5C3A]">Shared SitGuru Brand Kit</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0F2744] sm:text-3xl">Brand Kit</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">
          The same library, layout, files and search tools available to your manager.
          Existing verified assets are shared with interns today. New intern submissions go to Ava for review.
        </p>
      </div>
      {submissions.length ? (
        <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <summary className="cursor-pointer text-sm font-black text-[#0F2744]">
            My submitted assets ({submissions.length})
          </summary>
          <ul className="mt-3 divide-y divide-slate-100">
            {submissions.map((asset) => (
              <li key={asset.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0 break-words font-bold text-[#0F2744]">{asset.title}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${asset.status === "approved" ? "bg-[#DCFCE7] text-[#166534]" : asset.status === "pending_review" ? "bg-[#FFF4ED] text-[#C2410C]" : "bg-[#F4F7FB] text-slate-700"}`}>
                  {asset.status === "approved" ? "Approved · shared" : asset.status === "pending_review" ? "Waiting for Ava review" : asset.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <BrandStyleReference />
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
