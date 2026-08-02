import type { ReactNode } from "react";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import TacoFloatingAssistant from "@/components/officers/TacoFloatingAssistant";

/**
 * Ambassador root layout — mounts Taco (Ambassador Advocate) across
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
        <TacoFloatingAssistant />
      </SafeAssistantBubble>
    </>
  );
}
