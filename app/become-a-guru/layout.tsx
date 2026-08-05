import "@/app/platform-dark.css";
import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";

/**
 * Become a Guru route chrome.
 * Mounts public Scout (no Guru auth) via Layout mode="public-guru".
 */
export default function BecomeAGuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Layout
      mode="public-guru"
      className="platform-dark-surface min-h-screen bg-slate-950 text-white"
    >
      {children}
    </Layout>
  );
}
