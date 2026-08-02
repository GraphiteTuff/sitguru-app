import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Ambassador program pages — Taco public assistant for apply / program FAQs.
 */
export default function ProgramsAmbassadorsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingOfficerBubble role="AMBASSADOR" surface="public" />
    </>
  );
}
