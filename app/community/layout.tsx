import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";

/**
 * Community pillar — mounts Rogue for event FAQs and signup conversion.
 */
export default function CommunityLayout({ children }: { children: ReactNode }) {
  return <Layout mode="public-parent">{children}</Layout>;
}
