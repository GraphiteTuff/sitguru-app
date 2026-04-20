"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type MessageGuruButtonProps = {
  guruSlug: string;
  guruId: string;
  guruName: string;
  className?: string;
};

type StartConversationResponse = {
  ok?: boolean;
  error?: string;
  conversationId?: string;
  redirectTo?: string;
};

export default function MessageGuruButton({
  guruSlug,
  guruId,
  guruName,
  className = "",
}: MessageGuruButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartConversation() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/messages/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guruSlug,
          guruId,
          subject: `Message for ${guruName}`,
        }),
      });

      const payload =
        (await response.json().catch(() => ({}))) as StartConversationResponse;

      if (response.status === 401) {
        const redirectTarget = pathname || `/guru/${guruSlug}`;
        router.push(
          `/customer/login?redirect=${encodeURIComponent(redirectTarget)}`
        );
        return;
      }

      if (!response.ok || !payload.ok || !payload.redirectTo) {
        setError(payload.error || "We could not open the conversation yet.");
        return;
      }

      router.push(payload.redirectTo);
      router.refresh();
    } catch (err) {
      console.error("MessageGuruButton error:", err);
      setError("We could not open the conversation yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleStartConversation}
        disabled={loading}
        className={`${className} ${loading ? "cursor-wait opacity-80" : ""}`.trim()}
        aria-label={`Message ${guruName}`}
      >
        {loading ? "Opening messages..." : "Message Guru"}
      </button>

      {error ? <p className="text-sm font-medium text-rose-100">{error}</p> : null}
    </div>
  );
}