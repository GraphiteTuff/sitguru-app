import type { Metadata } from "next";
import Link from "next/link";
import InternHelpSearchBar from "@/components/internship/InternHelpSearchBar";
import InternGuideDownloads from "@/components/internship/InternGuideDownloads";
import InternHelpWatchVideos from "@/components/internship/InternHelpWatchVideos";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  INTERN_HELP_ARTICLES,
  INTERN_HELP_CATEGORIES,
  internHelpByCategory,
  internHelpFeatured,
} from "@/lib/internship/intern-help";

export const metadata: Metadata = {
  title: "Intern Help",
  description:
    "Search the SitGuru intern portal student guide — Home, check-in, Work, Report, toolkit, and Growth workplace.",
};

export const dynamic = "force-dynamic";

export default async function InternHelpHomePage() {
  await requireInternHelpAccess();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center px-3 py-6 sm:px-5 sm:py-10">
      <div className="w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
          SitGuru Internship · Student Help
        </p>
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.25rem)] font-black tracking-[-0.05em] text-slate-950">
          How can we help?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-slate-600 sm:text-base">
          Search intern articles the same way as SitGuru Help. Start with the
          Baseline &amp; Growth Brief, Brand kit, Student User Guide, Business
          Growth Report, and Definitions. Each article explains what the screen
          is for, why it matters for the report, and how to fill the fields.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <InternHelpSearchBar autoFocus />
          <InternGuideDownloads />
        </div>
      </div>

      <section className="mt-10 w-full text-left">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
          What’s new
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Start here if you just opened the portal this term. These cards match
          the Work, Home, and Report screens that just shipped.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {internHelpFeatured().map((item) =>
            item.highlight ? (
              <Link
                key={item.slug}
                href={item.href}
                className="public-dark-section rounded-3xl p-5 shadow-sm transition hover:shadow-md sm:col-span-2"
                data-brand-green
                style={{ backgroundColor: "#166534" }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-white">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-[-0.03em] !text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                  {item.blurb}
                </p>
                <p className="mt-3 text-sm font-black !text-white">Open article →</p>
              </Link>
            ) : (
              <Link
                key={item.slug}
                href={item.href}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.blurb}
                </p>
                <p className="mt-3 text-sm font-black text-emerald-800">Open article →</p>
              </Link>
            ),
          )}
        </div>
      </section>

      <div className="mt-12 w-full">
        <InternHelpWatchVideos />
      </div>

      <div className="w-full text-center">

        <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
          {INTERN_HELP_CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Category
              </p>
              <h2 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">
                {category.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {category.description}
              </p>
              <p className="mt-3 text-sm font-black text-emerald-800">Browse →</p>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-12 w-full text-left">
        {INTERN_HELP_CATEGORIES.map((category) => {
          const articles = internHelpByCategory(category.category);
          return (
            <section key={category.id} id={category.id} className="mb-10 scroll-mt-28">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {category.title}
              </h2>
              <ul className="mt-3 space-y-1">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={article.href}
                      className="flex flex-col rounded-2xl border border-transparent px-3 py-3 transition hover:border-emerald-100 hover:bg-white"
                    >
                      <span className="text-sm font-black text-slate-900">
                        {article.title}
                      </span>
                      <span className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {article.summary}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="px-3 text-xs font-semibold text-slate-400">
          {INTERN_HELP_ARTICLES.length} intern articles
        </p>
      </div>
    </div>
  );
}
