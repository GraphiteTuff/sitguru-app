// components/help/HelpSearchBar.tsx
"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  HELP_ARTICLES,
  searchHelpArticles,
  type HelpArticle,
} from "@/lib/help/articles";
import { HELP_SEARCH_CONFIG } from "@/lib/help/config";

type HelpSearchBarProps = {
  /** Compact header variant for article pages */
  variant?: "hero" | "header";
  placeholder?: string;
  autoFocus?: boolean;
};

export default function HelpSearchBar({
  variant = "hero",
  placeholder,
  autoFocus = false,
}: HelpSearchBarProps) {
  const resolvedPlaceholder =
    placeholder ??
    (variant === "hero"
      ? HELP_SEARCH_CONFIG.placeholderHero
      : HELP_SEARCH_CONFIG.placeholderHeader);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchHelpArticles(deferredQuery),
    [deferredQuery],
  );
  const showResults = query.trim().length > 0;

  const isHero = variant === "hero";

  return (
    <div className={`relative w-full ${isHero ? "max-w-2xl" : "max-w-xl"}`}>
      <label className="sr-only" htmlFor={`help-search-${variant}`}>
        Search help articles
      </label>
      <div
        className={[
          "flex items-center gap-3 border bg-white shadow-sm transition focus-within:border-emerald-500 focus-within:shadow-md",
          isHero
            ? "rounded-full border-slate-200 px-5 py-4"
            : "rounded-2xl border-slate-200 px-3.5 py-2.5",
        ].join(" ")}
      >
        <Search
          className={`shrink-0 text-slate-400 ${isHero ? "h-5 w-5" : "h-4 w-4"}`}
          aria-hidden="true"
        />
        <input
          id={`help-search-${variant}`}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={resolvedPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
          className={[
            "w-full bg-transparent font-semibold text-slate-900 outline-none placeholder:text-slate-400",
            isHero ? "text-base sm:text-lg" : "text-sm",
          ].join(" ")}
        />
      </div>

      {showResults ? (
        <div
          className={[
            "absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg",
            HELP_SEARCH_CONFIG.resultsMaxHeightClass,
            "overflow-y-auto overscroll-contain",
          ].join(" ")}
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm font-semibold text-slate-500">
              No articles match “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map((article) => (
                <ResultRow key={article.slug} article={article} />
              ))}
            </ul>
          )}
          {HELP_SEARCH_CONFIG.showResultCount ? (
            <p className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-4 py-2 text-[11px] font-semibold text-slate-400 backdrop-blur">
              Showing {results.length} of {HELP_ARTICLES.length} articles
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ResultRow({ article }: { article: HelpArticle }) {
  return (
    <li>
      <Link
        href={article.href}
        className="block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-emerald-50/70"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          {article.category}
        </p>
        <p className="mt-1 text-sm font-black text-slate-950">{article.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-500">
          {article.summary}
        </p>
      </Link>
    </li>
  );
}
