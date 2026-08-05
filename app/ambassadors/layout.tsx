import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";

/**
 * Public Ambassadors route — mounts Taco via path/mode (no Guru auth).
 */
export default function AmbassadorsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <Layout mode="public-ambassador">{children}</Layout>;
}
