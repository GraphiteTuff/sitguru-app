"use client";

import { useEffect } from "react";

export default function MarkConversationRead({
  conversationId,
}: {
  conversationId: string;
}) {
  useEffect(() => {
    const id = conversationId.trim();
    if (!id) return;

    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id }),
    })
      .then(() => {
        window.dispatchEvent(new Event("sitguru:messages-refresh"));
        window.dispatchEvent(
          new CustomEvent("sitguru:message-read", { detail: { conversationId: id } }),
        );
      })
      .catch(() => {
        // Opening the thread should still work if the read receipt fails.
      });
  }, [conversationId]);

  return null;
}
