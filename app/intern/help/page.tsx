import type { Metadata } from "next";
import Link from "next/link";
import InternHelpSearchBar from "@/components/internship/InternHelpSearchBar";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  INTERN_HELP_ARTICLES,
  INTERN_HELP_CATEGORIES,
  internHelpByCategory,
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
          Search intern articles the same way as SitGuru Help — check-in, hours,
          tracking links, Growth workplace, and intern-safe rules.
        </p>

        <div className="mt-8 flex justify-center">
          <InternHelpSearchBar autoFocus />
        </div>

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
                      className="flex flex-col rounded-2xl border border-transparent px-3 py-3 transition hover:border-emerald-100 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-black text-slate-900">
                        {article.title}
                      </span>
                      <span className="mt-1 shrink-0 text-xs font-bold text-slate-500 sm:mt-0 sm:ml-4">
                        {article.category}
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
