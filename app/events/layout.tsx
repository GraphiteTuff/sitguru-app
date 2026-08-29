import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";

/**
 * Pet Events — mounts Rogue for event FAQs and signup conversion.
 */
export default function EventsLayout({ children }: { children: ReactNode }) {
  return <Layout mode="public-parent">{children}</Layout>;
}
