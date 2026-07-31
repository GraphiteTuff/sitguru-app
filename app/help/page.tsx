import type { Metadata } from "next";
import Link from "next/link";
import HelpSearchBar from "@/components/help/HelpSearchBar";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Search SitGuru’s Knowledge Base for PawReport Live, billing, bookings, accounts, and trust & safety.",
};

/**
 * Google-style Help Center index — large centered search + category gateways.
 */
export default function HelpIndexPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-6 sm:py-12">
      <div className="w-full max-w-3xl text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
          SitGuru Knowledge Base
        </p>
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.25rem)] font-black tracking-[-0.05em] text-slate-950">
          How can we help?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-slate-600 sm:text-base">
          Search live tracking, billing, onboarding, bookings, and safety —
          instant results as you type.
        </p>

        <div className="mt-8 flex justify-center">
          <HelpSearchBar
            autoFocus
            placeholder="Search articles, tags, and topics…"
          />
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {HELP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={category.hubHref}
              className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
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
              <p className="mt-3 text-sm font-black text-emerald-800">
                Browse →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-left">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
            All articles ({HELP_ARTICLES.length})
          </h2>
          <ul className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto overscroll-contain pr-1">
            {HELP_ARTICLES.map((article) => (
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
        </div>

        <p className="mt-10 text-xs font-semibold text-slate-400">
          Still stuck?{" "}
          <a
            href="mailto:support@sitguru.com"
            className="font-bold text-emerald-800"
          >
            Email support@sitguru.com
          </a>{" "}
          or{" "}
          <Link href="/contact" className="font-bold text-emerald-800">
            contact SitGuru
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
