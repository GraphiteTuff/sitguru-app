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

export default async function AdminChatInsightsPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an authorized SitGuru admin account to open Chat
            Insights.
          </p>
        </div>
      </div>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("global_chat_insights")
    .select(
      "insight_id,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_converted_to_article,is_friction_flag,updated_at,converted_article_slug",
    )
    .order("frequency_tally_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(800);

  const insights = (error ? [] : data || []) as GlobalInsightRow[];

  const totalCommunications = insights.reduce(
    (sum, row) => sum + Number(row.frequency_tally_count || 0),
    0,
  );
  const frictionFlags = insights.reduce(
    (sum, row) =>
      sum + (row.is_friction_flag ? Number(row.frequency_tally_count || 0) : 0),
    0,
  );

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
    ) || insights.find((row) => !row.is_converted_to_article) || null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Insights · Chat ledger
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Communications Intelligence Ledger
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Unified rollup across homepage leads, active walk chats, and admin
            support. Convert high-frequency friction into Help Center articles
            before it leaks conversions.
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            Signed in as {actor.email} · Role {actor.role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/insights"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
          >
            Insights Hub
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
          >
            Analytics
          </Link>
          <Link
            href="/help"
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
          >
            Open Help Center
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Global ledger unavailable ({error.message}). Apply migration{" "}
          <code className="font-mono text-xs">
            20260731150001_global_chat_intelligence.sql
          </code>{" "}
          then refresh.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <MessageCircleQuestion className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-wide">
              Total Communications Analyzed
            </p>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0D5C3A]">
            {totalCommunications}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-wide">
              Friction Flags Tally
            </p>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0D5C3A]">
            {frictionFlags}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-wide">
              Top Inquired Category
            </p>
          </div>
          <p className="mt-3 text-lg font-black leading-snug text-[#0D5C3A]">
            {topCategory}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {topCategoryCount}× across channels
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-wide">
              Platform Conversion Leak Vector
            </p>
          </div>
          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-800">
            {leakVector?.core_question_summary ||
              "No unresolved leak vectors detected."}
          </p>
          {leakVector ? (
            <p className="mt-2 text-xs font-bold text-[#0D5C3A]">
              {leakVector.frequency_tally_count}× · {leakVector.channel_source_enum}{" "}
              · {leakVector.ai_assigned_category}
            </p>
          ) : null}
        </article>
      </section>

      <ChatInsightsPanel initialInsights={insights} />
    </main>
  );
}
