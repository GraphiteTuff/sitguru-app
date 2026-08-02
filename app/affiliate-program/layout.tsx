import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Affiliate program marketing layout — Taco covers growth / affiliate paths.
 */
export default function AffiliateProgramLayout({
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
