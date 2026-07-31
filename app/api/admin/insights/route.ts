// app/api/admin/insights/route.ts
/**
 * Admin Omnichannel Chat Insights — list global_chat_insights ledger.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { supabaseAdmin } = await requireAdminUser(request);

    const { data, error } = await supabaseAdmin
      .from("global_chat_insights")
      .select(
        "insight_id,text_string_hash,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_converted_to_article,is_friction_flag,updated_at,created_at,converted_article_slug,converted_at",
      )
      .order("frequency_tally_count", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(800);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const rows = data || [];
    const totalCommunications = rows.reduce(
      (sum, row) =>
        sum +
        Number(
          (row as { frequency_tally_count?: number }).frequency_tally_count || 0,
        ),
      0,
    );
    const frictionFlags = rows.reduce((sum, row) => {
      const r = row as {
        is_friction_flag?: boolean;
        frequency_tally_count?: number;
      };
      return sum + (r.is_friction_flag ? Number(r.frequency_tally_count || 0) : 0);
    }, 0);

    const categoryCounts = new Map<string, number>();
    for (const row of rows) {
      const cat = String(
        (row as { ai_assigned_category?: string }).ai_assigned_category ||
          "General Inquiry",
      );
      const tally = Number(
        (row as { frequency_tally_count?: number }).frequency_tally_count || 0,
      );
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + tally);
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
      rows.find(
        (row) =>
          !(row as { is_converted_to_article?: boolean }).is_converted_to_article &&
          Number(
            (row as { frequency_tally_count?: number }).frequency_tally_count || 0,
          ) >= 2,
      ) ||
      rows.find(
        (row) =>
          !(row as { is_converted_to_article?: boolean }).is_converted_to_article,
      ) ||
      null;

    return NextResponse.json({
      ok: true,
      insights: rows,
      summary: {
        totalCommunications,
        frictionFlags,
        topCategory,
        topCategoryCount,
        leakVectorQuestion: leakVector
          ? String(
              (leakVector as { core_question_summary?: string })
                .core_question_summary || "",
            )
          : null,
        leakVectorChannel: leakVector
          ? String(
              (leakVector as { channel_source_enum?: string })
                .channel_source_enum || "",
            )
          : null,
        leakVectorTally: leakVector
          ? Number(
              (leakVector as { frequency_tally_count?: number })
                .frequency_tally_count || 0,
            )
          : 0,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin access required.";
    const status =
      /admin|authorization|verify|token/i.test(message) ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
