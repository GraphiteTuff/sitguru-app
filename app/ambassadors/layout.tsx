import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Public Ambassadors marketing layout — mounts Taco (Ambassador Advocate)
 * for guest FAQ help across /ambassadors growth pages.
 */
export default function AmbassadorsLayout({
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
