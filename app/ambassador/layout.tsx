import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Ambassador root layout — mounts Taco across Ambassador dashboard,
 * join, training, and related role surfaces.
 */
export default function AmbassadorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingOfficerBubble role="AMBASSADOR" surface="dashboard" />
    </>
  );
}
