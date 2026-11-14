import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markConversationReadForUser } from "@/lib/messaging/mark-conversation-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ReadBody = {
  conversationId?: string;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json().catch(() => null)) as ReadBody | null;
    const conversationId = safeString(payload?.conversationId);

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation is required." },
        { status: 400 },
      );
    }

    // Verify ownership before mutating shared read flags on a thread.
    const [{ data: membership }, { data: ownership }] = await Promise.all([
      supabaseAdmin.from("conversation_participants")
        .select("user_id").eq("conversation_id", conversationId).eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("conversations")
        .select("id").eq("id", conversationId)
        .or("started_by_user_id.eq." + user.id + ",assigned_user_id.eq." + user.id).maybeSingle(),
    ]);
    if (!membership?.user_id && !ownership?.id) {
      return NextResponse.json({ error: "This conversation is not assigned to you." }, { status: 403 });
    }
    const result = await markConversationReadForUser(conversationId, user.id);

    return NextResponse.json({
      ok: true,
      conversationId,
      lastReadAt: result.lastReadAt,
      marked: result.marked,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}