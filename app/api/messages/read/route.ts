import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markConversationReadForUser } from "@/lib/messaging/mark-conversation-read";

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

    const result = await markConversationReadForUser(conversationId, user.id);

    return NextResponse.json({
      ok: true,
      conversationId,
      lastReadAt: result.lastReadAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}