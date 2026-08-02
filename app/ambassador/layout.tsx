import type { ReactNode } from "react";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import DelilahFloatingAssistant from "@/components/officers/DelilahFloatingAssistant";

/**
 * Ambassador root layout — mounts Delilah (Ambassador Advocate) across
 * Ambassador dashboard and related views without touching Rogue admin AI.
 */
export default function AmbassadorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <SafeAssistantBubble>
        <DelilahFloatingAssistant />
      </SafeAssistantBubble>
    </>
  );
}
