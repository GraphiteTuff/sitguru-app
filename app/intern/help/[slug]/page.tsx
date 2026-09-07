import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InternHelpChrome, {
  InternHelpShots,
} from "@/components/internship/InternHelpChrome";
import { HelpNumberedSteps } from "@/components/help/HelpFaqList";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  internHelpArticle,
  INTERN_HELP_ARTICLES,
} from "@/lib/internship/intern-help";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return INTERN_HELP_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const article = internHelpArticle((await params).slug);
  if (!article) return { title: "Intern Help" };
  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function InternHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireInternHelpAccess();
  const article = internHelpArticle((await params).slug);
  if (!article) notFound();

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5">
    <InternHelpChrome article={article}>
      <InternHelpShots article={article} />
      {article.steps.length ? (
        <section>
          <h2 className="text-lg font-black text-slate-950">Steps</h2>
          <HelpNumberedSteps steps={article.steps} />
        </section>
      ) : null}
      {article.note ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {article.note}
        </p>
      ) : null}
    </InternHelpChrome>
    </div>
  );
}
