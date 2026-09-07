import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InternGuideDownloads from "@/components/internship/InternGuideDownloads";
import InternHelpBrandLogos from "@/components/internship/InternHelpBrandLogos";
import InternHelpFileDownloads from "@/components/internship/InternHelpFileDownloads";
import InternHelpWatchVideos from "@/components/internship/InternHelpWatchVideos";
import InternHelpChrome, {
  InternHelpExplain,
  InternHelpShots,
} from "@/components/internship/InternHelpChrome";
import { HelpNumberedSteps } from "@/components/help/HelpFaqList";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  internHelpArticle,
  INTERN_HELP_ARTICLES,
} from "@/lib/internship/intern-help";
import { getInternWorkspace } from "@/lib/internship/queries";
import type { InternshipWorkAttachment } from "@/lib/internship/types";

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
  const access = await requireInternHelpAccess();
  const article = internHelpArticle((await params).slug);
  if (!article) notFound();

  let brandInternId = "";
  let brandAttachments: InternshipWorkAttachment[] = [];
  const intern = "intern" in access ? access.intern : null;
  if (article.slug === "toolkit-brand" && intern?.id) {
    const workspace = await getInternWorkspace(intern.id);
    brandInternId = intern.id;
    brandAttachments = workspace?.attachments || [];
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5">
    <InternHelpChrome article={article}>
      {article.slug === "student-guide" ? (
        <>
          <InternGuideDownloads />
          <InternHelpFileDownloads ids={["onboarding-inprocessing"]} />
        </>
      ) : null}
      {article.slug === "onboarding" ? (
        <InternHelpFileDownloads ids={["onboarding-inprocessing"]} />
      ) : null}
      {article.slug === "watch-sitguru" ? <InternHelpWatchVideos /> : null}
      {article.slug === "toolkit-brand" ? (
        <InternHelpBrandLogos internId={brandInternId} attachments={brandAttachments} />
      ) : null}
      {article.slug === "vendor-events" ? (
        <InternHelpFileDownloads ids={["best-pa-nj-vendor-events"]} />
      ) : null}
      {article.slug === "payments-on-sitguru" ? (
        <InternHelpFileDownloads ids={["stripe-setup"]} />
      ) : null}
      <InternHelpExplain article={article} />
      <InternHelpShots article={article} />
      {article.steps.length ? (
        <section>
          <h2 className="text-lg font-black text-slate-950">Steps</h2>
          <HelpNumberedSteps steps={article.steps} />
        </section>
      ) : null}
      {article.tips.length ? (
        <section className="rounded-2xl border border-emerald-100 bg-white px-5 py-4">
          <h2 className="text-lg font-black text-slate-950">Tips</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
            {article.tips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
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
