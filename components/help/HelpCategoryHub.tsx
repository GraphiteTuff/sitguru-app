// components/help/HelpCategoryHub.tsx
import Link from "next/link";
import {
  articlesByCategory,
  type HelpCategory,
} from "@/lib/help/articles";

type HelpCategoryHubProps = {
  category: HelpCategory;
  title: string;
  description: string;
};

export default function HelpCategoryHub({
  category,
  title,
  description,
}: HelpCategoryHubProps) {
  const articles = articlesByCategory(category);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/help"
        className="text-sm font-bold text-emerald-800 hover:underline"
      >
        ← Back to Help Center
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
        {title}
      </h1>
      <p className="mt-2 text-sm font-semibold text-slate-600">{description}</p>
      <ul className="mt-6 space-y-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={article.href}
              className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-emerald-300"
            >
              <p className="text-base font-black text-slate-950">
                {article.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {article.summary}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {article.tags.slice(0, 4).join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
