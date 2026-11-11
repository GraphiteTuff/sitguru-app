import Link from "next/link";
import ContentCard from "@/components/reads/ContentCard";
import TrackPageView from "@/components/reads/TrackPageView";
import type { ReadsContentDetail, ReadsContentType } from "@/lib/reads/types";

export default function CatalogPage({
  title,
  description,
  format,
  items,
  searchParams,
}: {
  title: string;
  description: string;
  format: ReadsContentType;
  items: ReadsContentDetail[];
  searchParams?: Record<string, string | undefined>;
}) {
  const q = searchParams?.q || "";
  const audience = searchParams?.audience || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView
        eventName="page_view"
        contentType={format}
        metadata={{ surface: "catalog" }}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
            SitGuru Reads &amp; Listen
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[#163127]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <form action="" className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor={`${format}-search`}>
            Search {title}
          </label>
          <input
            id={`${format}-search`}
            name="q"
            defaultValue={q}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="min-w-[220px] rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold"
          />
          <select
            name="audience"
            defaultValue={audience}
            className="rounded-full border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold"
            aria-label="Audience filter"
          >
            <option value="">All audiences</option>
            <option value="pet_parent">Pet Parents</option>
            <option value="guru">Gurus</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-black text-white"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {!items.length ? (
        <p className="mt-10 rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          No published {title.toLowerCase()} yet. Check back soon, or{" "}
          <Link href="/reads/partner" className="text-[#0D5C3A] underline">
            partner with SitGuru
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
