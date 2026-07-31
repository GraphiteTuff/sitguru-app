// components/messaging/WalkChatBridge.tsx
"use client";

/**
 * Resolves (or creates) a booking-linked conversation, then mounts ChatBottomSheet
 * over parent/guru walk maps.
 */

import { useEffect, useState } from "react";
import ChatBottomSheet from "@/components/messaging/ChatBottomSheet";
import { supabase } from "@/lib/supabase";

type WalkChatBridgeProps = {
  bookingId: string;
  currentUserId: string;
  title?: string;
};

export default function WalkChatBridge({
  bookingId,
  currentUserId,
  title = "Care chat",
}: WalkChatBridgeProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id,ai_assist_enabled")
        .eq("booking_id", bookingId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (existing?.id) {
        setConversationId(String(existing.id));
        setAiAssistEnabled(Boolean(
          (existing as { ai_assist_enabled?: boolean }).ai_assist_enabled,
        ));
        return;
      }

      // Soft create via booking conversation ensure API
      try {
        const res = await fetch("/api/messaging/ensure-booking-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          conversationId?: string;
          aiAssistEnabled?: boolean;
        } | null;
        if (json?.ok && json.conversationId && !cancelled) {
          setConversationId(String(json.conversationId));
          setAiAssistEnabled(Boolean(json.aiAssistEnabled));
        }
      } catch {
        // Chat FAB stays hidden until a conversation exists
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!conversationId) return null;

  return (
    <ChatBottomSheet
      conversationId={conversationId}
      currentUserId={currentUserId}
      title={title}
      aiAssistEnabled={aiAssistEnabled}
    />
  );
}
