// components/messaging/WalkChatBridge.tsx
"use client";

/**
 * Resolves a booking-linked conversation, then mounts the secure SitGuru
 * chat workspace (client ↔ guru) over parent/guru walk maps.
 */

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import SitGuruChatWorkspace from "@/components/messaging/SitGuruChatWorkspace";
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
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch("/api/messaging/ensure-booking-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          conversationId?: string;
        } | null;

        if (!json?.ok || !json.conversationId || cancelled) return;

        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", json.conversationId);

        const other = (participants || [])
          .map((row) => String((row as { user_id?: string }).user_id || ""))
          .find((id) => id && id !== currentUserId);

        if (!cancelled) {
          setRecipientId(other || null);
          setReady(Boolean(other));
        }

        // Fallback: booking row roles
        if (!other) {
          const { data: booking } = await supabase
            .from("bookings")
            .select(
              "user_id,customer_id,pet_owner_id,guru_user_id,assigned_guru_user_id,provider_user_id",
            )
            .eq("id", bookingId)
            .maybeSingle();

          if (cancelled || !booking) return;
          const row = booking as Record<string, unknown>;
          const candidates = [
            row.guru_user_id,
            row.assigned_guru_user_id,
            row.provider_user_id,
            row.pet_owner_id,
            row.customer_id,
            row.user_id,
          ]
            .map((value) => String(value || "").trim())
            .filter(Boolean);

          const peer = candidates.find((id) => id !== currentUserId) || null;
          setRecipientId(peer);
          setReady(Boolean(peer));
        }
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [bookingId, currentUserId]);

  if (!ready || !recipientId) return null;

  return (
    <>
      {!open ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <div className="pointer-events-auto flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-14 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/25"
            >
              <MessageCircle className="h-5 w-5" />
              Chat
            </button>
          </div>
        </div>
      ) : (
        <SitGuruChatWorkspace
          bookingId={bookingId}
          senderId={currentUserId}
          recipientId={recipientId}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
