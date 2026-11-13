import type { Metadata } from "next";
import type { ReactNode } from "react";
import Layout from "@/components/layouts/Layout";
import ReadsChrome from "@/components/reads/ReadsChrome";
import { READS_HEADLINE, READS_SUPPORTING } from "@/lib/reads/constants";

export const metadata: Metadata = {
  title: "SitGuru Reads & Listens",
  description: READS_SUPPORTING,
  openGraph: {
    title: "SitGuru Reads & Listens",
    description: READS_HEADLINE,
    type: "website",
    url: "https://www.sitguru.com/reads",
  },
  twitter: {
    card: "summary_large_image",
    title: "SitGuru Reads & Listens",
    description: READS_HEADLINE,
  },
  alternates: {
    canonical: "https://www.sitguru.com/reads",
  },
};

export default function ReadsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout mode="public-parent">
      <ReadsChrome>{children}</ReadsChrome>
    </Layout>
  );
}
