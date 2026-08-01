import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hardDeleteConversation } from "@/lib/messaging/admin-thread-purge";
import { revalidatePath } from "next/cache";

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

    const result = await hardDeleteConversation(conversationId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Delete failed." },
        { status: 500 },
      );
    }

    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${conversationId}`);

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      conversationId,
    });
  } catch (error) {
    console.error("Admin message delete API failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Delete request failed.",
      },
      { status: 500 },
    );
  }
}
