// components/messaging/ChatBottomSheet.tsx
"use client";

/**
 * Interactive bottom sheet wrapper — slides ChatWindow over walk maps
 * on /parent/walk and /guru/walk without blocking the map when collapsed.
 */

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatWindow from "@/components/messaging/ChatWindow";

type ChatBottomSheetProps = {
  conversationId: string;
  currentUserId: string;
  title?: string;
  aiAssistEnabled?: boolean;
  defaultOpen?: boolean;
};

export default function ChatBottomSheet({
  conversationId,
  currentUserId,
  title = "Care chat",
  aiAssistEnabled = false,
  defaultOpen = false,
}: ChatBottomSheetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
      {!open ? (
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
      ) : (
        <div
          className={[
            "pointer-events-auto mx-auto w-full max-w-lg transition-[height]",
            expanded ? "h-[min(88vh,720px)]" : "h-[min(52vh,420px)]",
          ].join(" ")}
        >
          <div className="flex items-center justify-center gap-2 pb-1">
            <button
              type="button"
              aria-label={expanded ? "Collapse chat" : "Expand chat"}
              onClick={() => setExpanded((v) => !v)}
              className="h-1.5 w-12 rounded-full bg-slate-300"
            />
          </div>
          <div className="relative h-[calc(100%-0.5rem)] px-2">
            <ChatWindow
              conversationId={conversationId}
              currentUserId={currentUserId}
              title={title}
              mode="sheet"
              aiAssistEnabled={aiAssistEnabled}
              onClose={() => setOpen(false)}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
