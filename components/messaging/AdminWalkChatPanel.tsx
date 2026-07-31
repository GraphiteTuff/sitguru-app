// components/messaging/AdminWalkChatPanel.tsx
"use client";

/**
 * Desktop admin split-pane chat next to live walk maps.
 * Resolves booking → conversation, then mounts ChatWindow in panel mode.
 */

import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ChatWindow from "@/components/messaging/ChatWindow";

type AdminWalkChatPanelProps = {
  bookingId: string | null;
  petName?: string;
  className?: string;
};

export default function AdminWalkChatPanel({
  bookingId,
  petName,
  className = "",
}: AdminWalkChatPanelProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!bookingId) {
        setConversationId(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id,ai_assist_enabled")
          .eq("booking_id", bookingId)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (existing?.id) {
          setConversationId(String(existing.id));
          setAiAssistEnabled(
            Boolean(
              (existing as { ai_assist_enabled?: boolean }).ai_assist_enabled,
            ),
          );
          setLoading(false);
          return;
        }

        const res = await fetch("/api/messaging/ensure-booking-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          conversationId?: string;
          aiAssistEnabled?: boolean;
          error?: string;
        } | null;

        if (!res.ok || !json?.ok || !json.conversationId) {
          throw new Error(json?.error || "No care chat for this booking yet.");
        }

        if (!cancelled) {
          setConversationId(json.conversationId);
          setAiAssistEnabled(Boolean(json.aiAssistEnabled));
        }
      } catch (err) {
        if (!cancelled) {
          setConversationId(null);
          setError(err instanceof Error ? err.message : "Chat unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!bookingId) {
    return (
      <div
        className={`flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center ${className}`}
      >
        <MessageCircle className="h-6 w-6 text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Select a live walk to open the care chat panel.
        </p>
      </div>
    );
  }

  if (loading || !userId) {
    return (
      <div
        className={`flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white ${className}`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div
        className={`flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-center ${className}`}
      >
        <p className="text-sm font-semibold text-slate-500">
          {error || "Care chat is not available for this booking."}
        </p>
      </div>
    );
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={userId}
      title={petName ? `${petName} · Ops chat` : "Ops care chat"}
      subtitle="Split-screen with live map · SitGuru AI when enabled"
      mode="panel"
      aiAssistEnabled={aiAssistEnabled}
      onAiAssistChange={setAiAssistEnabled}
      className={`h-full min-h-[420px] ${className}`}
    />
  );
}
