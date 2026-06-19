"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MessageRealtimeRefreshProps = {
  conversationId: string;
  currentUserId?: string | null;
};

export default function MessageRealtimeRefresh({
  conversationId,
  currentUserId,
}: MessageRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!conversationId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel(`sitguru-message-thread-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as { sender_id?: string | null };

          if (currentUserId && incoming.sender_id === currentUserId) return;

          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => {
            router.refresh();
          }, 250);
        },
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, router]);

  return null;
}
