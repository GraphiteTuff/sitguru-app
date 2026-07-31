// app/api/admin/insights/convert/route.ts
/**
 * Promote a global chat insight into a published Help Center article row.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import type { HelpAudience, HelpCategory } from "@/lib/help/articles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function asAudience(value: unknown): HelpAudience {
  const v = String(value || "").toLowerCase();
  if (v === "parent" || v === "guru" || v === "ambassador" || v === "all") {
    return v;
  }
  return "all";
}

function asCategory(value: unknown): HelpCategory {
  const allowed: HelpCategory[] = [
    "Pet Parent Support",
    "Guru Success & Training Hub",
    "Billing & Refunds",
    "Account & Profiles",
    "Booking & Cancellations",
    "Trust & Safety",
  ];
  const v = String(value || "");
  return allowed.includes(v as HelpCategory)
    ? (v as HelpCategory)
    : "Pet Parent Support";
}

export async function POST(request: NextRequest) {
  try {
    const { supabaseAdmin, adminUser } = await requireAdminUser(request);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const insightId = String(body.insightId || "").trim();
    const title = String(body.title || "").trim().slice(0, 160);
    const summary = String(body.summary || body.solution || "")
      .trim()
      .slice(0, 2000);
    const solution = String(body.solution || body.summary || "")
      .trim()
      .slice(0, 8000);
    const category = asCategory(body.category);
    const audience = asAudience(body.audience);
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : ["chat-insight", "omnichannel"];

    if (!insightId || !title || !summary) {
      return NextResponse.json(
        { ok: false, error: "insightId, title, and solution summary are required." },
        { status: 400 },
      );
    }

    // Prefer global ledger; fall back to legacy homepage_chat_insights
    let insight: Record<string, unknown> | null = null;
    let ledger: "global" | "homepage" = "global";

    {
      const { data } = await supabaseAdmin
        .from("global_chat_insights")
        .select("*")
        .eq("insight_id", insightId)
        .maybeSingle();
      if (data) insight = data as Record<string, unknown>;
    }

    if (!insight) {
      const { data } = await supabaseAdmin
        .from("homepage_chat_insights")
        .select("*")
        .eq("insight_id", insightId)
        .maybeSingle();
      if (data) {
        insight = data as Record<string, unknown>;
        ledger = "homepage";
      }
    }

    if (!insight) {
      return NextResponse.json(
        { ok: false, error: "Insight not found." },
        { status: 404 },
      );
    }

    const baseSlug = slugify(title) || `insight-${insightId.slice(0, 8)}`;
    let slug = baseSlug;
    let href = `/help/insights/${slug}`;

    for (let i = 0; i < 5; i += 1) {
      const { data: clash } = await supabaseAdmin
        .from("help_center_articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${i + 2}`;
      href = `/help/insights/${slug}`;
    }

    const now = new Date().toISOString();
    const topicTag = String(
      insight.ai_assigned_category ||
        insight.clean_ai_topic_category ||
        "general",
    );

    const { data: article, error: articleError } = await supabaseAdmin
      .from("help_center_articles")
      .insert({
        slug,
        href,
        title,
        summary,
        body: solution || summary,
        audience,
        category,
        tags,
        keywords: [
          ...tags,
          topicTag,
          String(insight.channel_source_enum || "homepage chat"),
        ].filter(Boolean),
        source_insight_id: ledger === "homepage" ? insightId : null,
        published_by: adminUser.id,
        is_published: true,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .maybeSingle();

    if (articleError || !article) {
      return NextResponse.json(
        {
          ok: false,
          error: articleError?.message || "Unable to publish help article.",
        },
        { status: 500 },
      );
    }

    if (ledger === "global") {
      await supabaseAdmin
        .from("global_chat_insights")
        .update({
          is_converted_to_article: true,
          converted_article_slug: slug,
          converted_at: now,
          updated_at: now,
        })
        .eq("insight_id", insightId);
    } else {
      await supabaseAdmin
        .from("homepage_chat_insights")
        .update({
          is_converted_to_help_article: true,
          converted_article_slug: slug,
          converted_at: now,
        })
        .eq("insight_id", insightId);
    }

    return NextResponse.json({
      ok: true,
      article,
      insightId,
      href,
      slug,
      ledger,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin access required.";
    const status =
      /admin|authorization|verify|token/i.test(message) ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
