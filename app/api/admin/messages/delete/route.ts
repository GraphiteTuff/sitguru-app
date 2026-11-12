import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  hardDeleteConversation,
  hardDeleteConversations,
  hardDeleteMessage,
} from "@/lib/messaging/admin-thread-purge";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await getAdminIdentity();
    if (!identity?.isSuperUser) {
      return NextResponse.json(
        { ok: false, error: "Super Admin only." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      conversationId?: string;
      conversationIds?: string[];
      messageId?: string;
    } | null;

    const messageId = String(body?.messageId || "").trim();
    if (messageId) {
      const result = await hardDeleteMessage(messageId);
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Message delete failed." },
          { status: 500 },
        );
      }
      revalidatePath("/admin/messages");
      return NextResponse.json({
        ok: true,
        mode: result.mode,
        messageId,
      });
    }

    const bulkIds = Array.isArray(body?.conversationIds)
      ? body!.conversationIds.map((id) => String(id || "").trim()).filter(Boolean)
      : [];
    if (bulkIds.length) {
      const result = await hardDeleteConversations(bulkIds);
      revalidatePath("/admin/messages");
      return NextResponse.json({
        ok: result.ok || result.deleted > 0,
        deleted: result.deleted,
        requested: result.requested,
        error: result.error,
      });
    }

    const conversationId = String(body?.conversationId || "").trim();
    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "Missing conversation id or message id." },
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
