import Link from "next/link";
import { HelpArticleBriefForm } from "@/components/admin/HelpArticleBriefForm";
import {
  buildHelpCenterArticleBriefs,
  extractChatFrictionFlags,
  type HelpCenterArticleBrief,
} from "@/lib/actions/admin-reporting";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

function asBriefCategory(
  value: string | undefined,
): HelpCenterArticleBrief["category"] {
  const allowed: HelpCenterArticleBrief["category"][] = [
    "Pet Parent Support",
    "Guru Success & Training Hub",
    "Billing & Refunds",
    "Account & Profiles",
    "Booking & Cancellations",
    "Trust & Safety",
  ];
  if (value && allowed.includes(value as HelpCenterArticleBrief["category"])) {
    return value as HelpCenterArticleBrief["category"];
  }
  return "Pet Parent Support";
}

export default async function NewHelpArticlePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const extracted = await extractChatFrictionFlags({
    limit: 250,
    briefLimit: 6,
  });
  const requestedId = firstParam(params.insightId);
  const requestedTitle = firstParam(params.title);
  const requestedCategory = firstParam(params.category);
  const matched = extracted.helpCenterBriefs.find(
    (brief) => brief.insightId === requestedId,
  );
  const fallbackBrief: HelpCenterArticleBrief | null = requestedId
    ? {
        insightId: requestedId,
        title: (requestedTitle || "New friction article").slice(0, 120),
        summary: requestedTitle || "Friction brief from chat insights.",
        solution: `Draft the clear SitGuru answer that unblocks this friction point.`,
        category: asBriefCategory(requestedCategory),
        audience: "all",
        tags: ["friction", "conversion-leak", "help-center"],
        frictionSnippet: requestedTitle || "",
        sessionId: null,
        userId: null,
        createdAt: null,
        createPath: `/admin/help/articles/new?insightId=${encodeURIComponent(requestedId)}`,
      }
    : null;

  const initialBrief =
    matched ||
    fallbackBrief ||
    extracted.helpCenterBriefs[0] ||
    buildHelpCenterArticleBriefs(
      [
        {
          insightId: "draft",
          sessionId: null,
          userId: null,
          frictionSnippet: "Describe the customer friction point",
          category: "General Inquiry",
          channel: "ADMIN_SUPPORT",
          frequency: 1,
          createdAt: null,
          updatedAt: null,
          isConverted: false,
        },
      ],
      1,
    )[0];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Help Center
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            New article from friction brief
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Prefills from chat friction flags (`insight_rows_logged` ledger) so
            conversion blockers become published Help answers quickly.
          </p>
        </div>
        <Link
          href="/admin/insights/chat"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
        >
          Back to Chat Insights
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-950">
        <p>
          <span className="font-bold">{extracted.insightRowsLogged}</span> insight
          rows logged ·{" "}
          <span className="font-bold">{extracted.communicationsSampled}</span>{" "}
          communications ·{" "}
          <span className="font-bold">{extracted.frictionFlags.length}</span>{" "}
          friction flags ·{" "}
          <span className="font-bold">{extracted.helpCenterBriefs.length}</span>{" "}
          briefs ready
        </p>
      </section>

      <HelpArticleBriefForm
        initialBrief={initialBrief}
        briefs={extracted.helpCenterBriefs}
      />
    </main>
  );
}
