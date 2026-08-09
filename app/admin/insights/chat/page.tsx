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

export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

export default async function AdminChatInsightsPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">Access restricted</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Admin access required
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
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
    .order("frequency_tally_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(800);

  if (withProvenance.error) {
    const legacy = await supabaseAdmin
      .from("global_chat_insights")
      .select(
        "insight_id,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_converted_to_article,is_friction_flag,updated_at,converted_article_slug",
      )
      .order("frequency_tally_count", { ascending: false })
      .order("updated_at", { ascending: false })
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

  const categoryCounts = new Map<string, number>();
  for (const row of insights) {
    const cat = row.ai_assigned_category || "General Inquiry";
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

  const leakVector =
    insights.find(
      (row) => !row.is_converted_to_article && row.frequency_tally_count >= 2,
    ) ||
    insights.find((row) => !row.is_converted_to_article) ||
    null;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-100 pb-6">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-semibold text-emerald-800">
            Insights · Chat
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Chat Insights
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Scan repeated questions from homepage leads, live walks, and admin
            support. Each row shows which companion avatar answered and which
            page the visitor was on so you can fix the right funnel.
          </p>
          <p className="text-sm text-slate-500">
            Signed in as {actor.email} · {actor.role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/insights"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Insights Hub
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Analytics
          </Link>
          <Link
            href="/help"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Help Center
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
          Chat ledger unavailable ({error.message}). Apply migration{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            20260731150001_global_chat_intelligence.sql
          </code>{" "}
          then refresh.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <MessageCircleQuestion className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Messages analyzed</p>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-[#0D5C3A]">
            {formatCount(totalCommunications)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Across {formatCount(uniqueTopics)} unique topics
          </p>
        </article>

        <article className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Friction signals</p>
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-[#0D5C3A]">
            {formatCount(frictionFlags)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {formatCount(unpublished)} topics still need a Help article
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Top category</p>
          </div>
          <p className="mt-3 text-xl font-black leading-snug text-[#0D5C3A]">
            {topCategory}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {formatCount(topCategoryCount)} mentions across channels
          </p>
        </article>

        <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">Highest-priority gap</p>
          </div>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-800">
            {leakVector?.core_question_summary ||
              "No unresolved gaps detected."}
          </p>
          {leakVector ? (
            <p className="mt-2 text-sm font-semibold text-[#0D5C3A]">
              Asked {leakVector.frequency_tally_count}× ·{" "}
              {leakVector.ai_assigned_category}
            </p>
          ) : null}
        </article>
      </section>

      <ChatInsightsPanel initialInsights={insights} />
    </main>
  );
}
