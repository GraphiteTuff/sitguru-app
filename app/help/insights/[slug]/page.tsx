import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublishedInsightArticle } from "@/lib/help/load-articles";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function HelpInsightArticlePage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const slug = String(resolved.slug || "").trim();
  const article = await loadPublishedInsightArticle(slug);
  if (!article) notFound();

  const title = String(article.title || "Help article");
  const summary = String(article.summary || "");
  const body = String(article.body || summary);
  const category = String(article.category || "Pet Parent Support");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/help"
        className="text-sm font-bold text-emerald-700 hover:underline"
      >
        ← Back to Help Center
      </Link>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
        {category}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{summary}</p>
      <article className="mt-8 whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-white p-6 text-base leading-7 text-slate-800 shadow-sm">
        {body}
      </article>
    </main>
  );
}
