import Link from "next/link";
import {
  AlertTriangle,
  MessageCircleQuestion,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ChatInsightsPanel, {
  type GlobalInsightRow,
} from "@/components/admin/ChatInsightsPanel";
import ChatInsightsHourlyRefresh from "@/components/admin/ChatInsightsHourlyRefresh";

export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

/** Full CRM transcripts stretch the KPI row — prefer short question rows. */
function isTranscriptDump(text: string) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (value.length > 220) return true;
  if (value.split(/\n/).length > 3) return true;
  return /^(visitor|assistant|user)\s*:/im.test(value) || /\bassistant:\s*/i.test(value);
}

function displaySummary(text: string, max = 120) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "No unresolved gaps detected.";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function isNoiseCategory(category: string) {
  const value = String(category || "").trim();
  return /^lead:/i.test(value) || /transcript/i.test(value);
}

export default async function AdminChatInsightsPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-rose-700">Access restricted</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Sign in with an authorized SitGuru admin account to open Chat
            Insights.
          </p>
        </div>
      </div>
    );
  }

  let insights: GlobalInsightRow[] = [];
  let error: { message: string } | null = null;

  const withProvenance = await supabaseAdmin
    .from("global_chat_insights")
    .select(
      "insight_id,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_converted_to_article,is_friction_flag,updated_at,converted_article_slug,companion_hits,page_hits,last_companion_key,last_source_page_path",
    )
    .order("updated_at", { ascending: false })
    .order("frequency_tally_count", { ascending: false })
    .limit(800);

  if (withProvenance.error) {
    const legacy = await supabaseAdmin
      .from("global_chat_insights")
      .select(
        "insight_id,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_converted_to_article,is_friction_flag,updated_at,converted_article_slug",
      )
      .order("updated_at", { ascending: false })
      .order("frequency_tally_count", { ascending: false })
      .limit(800);
    insights = (legacy.error ? [] : legacy.data || []) as GlobalInsightRow[];
    error = legacy.error
      ? { message: legacy.error.message }
      : withProvenance.error.message.includes("companion_hits")
        ? null
        : { message: withProvenance.error.message };
  } else {
    insights = (withProvenance.data || []) as GlobalInsightRow[];
  }

  const totalCommunications = insights.reduce(
    (sum, row) => sum + Number(row.frequency_tally_count || 0),
    0,
  );
  const frictionFlags = insights.reduce(
    (sum, row) =>
      sum + (row.is_friction_flag ? Number(row.frequency_tally_count || 0) : 0),
    0,
  );
  const uniqueTopics = insights.length;
  const unpublished = insights.filter((row) => !row.is_converted_to_article)
    .length;

  const questionRows = insights.filter(
    (row) => !isTranscriptDump(row.core_question_summary || ""),
  );

  const categoryCounts = new Map<string, number>();
  for (const row of questionRows.length ? questionRows : insights) {
    const cat = row.ai_assigned_category || "General Inquiry";
    if (isNoiseCategory(cat)) continue;
    categoryCounts.set(
      cat,
      (categoryCounts.get(cat) || 0) + Number(row.frequency_tally_count || 0),
    );
  }
  let topCategory = "—";
  let topCategoryCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = count;
    }
  }

  const leakPool = questionRows.length ? questionRows : insights;
  const leakVector =
    leakPool.find(
      (row) => !row.is_converted_to_article && row.frequency_tally_count >= 2,
    ) ||
    leakPool.find((row) => !row.is_converted_to_article) ||
    null;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-0 py-2 sm:space-y-6 sm:px-0 sm:py-4 lg:space-y-7">
      <header className="flex flex-col gap-4 border-b border-emerald-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-2xl space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:normal-case sm:tracking-normal">
            Insights · Chat
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            Chat Insights
          </h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-6">
            See what Rogue, Scout, Taco, and Delilah are asked — and which page
            it came from — so you can fix the funnel fast.
          </p>
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            Signed in as {actor.email} · {actor.role}
          </p>
          <ChatInsightsHourlyRefresh />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/admin/insights"
            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Insights Hub
          </Link>
          <Link
            href="/admin/analytics"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Analytics
          </Link>
          <Link
            href="/help"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Help Center
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Chat ledger unavailable ({error.message}). Apply migration{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            20260731150001_global_chat_intelligence.sql
          </code>{" "}
          then refresh.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        <article className="flex min-h-[7.5rem] flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <MessageCircleQuestion className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Messages analyzed</p>
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#0D5C3A]">
            {formatCount(totalCommunications)}
          </p>
          <p className="mt-auto pt-1 text-sm leading-5 text-slate-500">
            Across {formatCount(uniqueTopics)} unique topics
          </p>
        </article>

        <article className="flex min-h-[7.5rem] flex-col rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Friction signals</p>
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#0D5C3A]">
            {formatCount(frictionFlags)}
          </p>
          <p className="mt-auto pt-1 text-sm leading-5 text-slate-500">
            {formatCount(unpublished)} topics still need a Help article
          </p>
        </article>

        <article className="flex min-h-[7.5rem] flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Top category</p>
          </div>
          <p className="mt-2 line-clamp-2 text-lg font-black leading-snug text-[#0D5C3A] sm:text-xl">
            {topCategory}
          </p>
          <p className="mt-auto pt-1 text-sm leading-5 text-slate-500">
            {formatCount(topCategoryCount)} mentions across channels
          </p>
        </article>

        <article className="flex min-h-[7.5rem] flex-col rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-amber-800">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Highest-priority gap</p>
          </div>
          <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-800">
            {displaySummary(
              leakVector?.core_question_summary ||
                "No unresolved gaps detected.",
            )}
          </p>
          {leakVector ? (
            <p className="mt-auto pt-2 text-sm font-semibold text-[#0D5C3A]">
              Asked {leakVector.frequency_tally_count}× ·{" "}
              <span className="font-medium text-slate-600">
                {leakVector.ai_assigned_category}
              </span>
            </p>
          ) : null}
        </article>
      </section>

      <ChatInsightsPanel initialInsights={insights} />
    </main>
  );
}
