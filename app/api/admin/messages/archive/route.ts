import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { ok: false, error: "Not signed in as admin." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      conversationId?: string;
    } | null;

    const conversationId = String(body?.conversationId || "").trim();
    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "Missing conversation id." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("conversations")
      .update({
        status: "archived",
        updated_at: now,
      })
      .eq("id", conversationId);

    await supabaseAdmin
      .from("messages")
      .update({
        status: "archived",
      })
      .eq("conversation_id", conversationId);

    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${conversationId}`);

    return NextResponse.json({ ok: true, conversationId });
  } catch (error) {
    console.error("Admin message archive API failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Archive request failed.",
      },
      { status: 500 },
    );
  }
}
