import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";

/**
 * Pet Events — mounts Delilah (Pet Event Coordinator) for event FAQs and hosting help.
 */
export default function EventsLayout({ children }: { children: ReactNode }) {
  return <Layout mode="public-parent">{children}</Layout>;
}
