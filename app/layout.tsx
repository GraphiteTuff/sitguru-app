import type { Metadata } from "next";
import "./globals.css";
import RouteShell from "@/components/RouteShell";

export const metadata: Metadata = {
  title: "SitGuru | Trusted Pet Care. Simplified.",
  description:
    "SitGuru connects pet owners with trusted, vetted pet care professionals. Trusted Pet Care. Simplified.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="site-shell min-h-screen text-slate-900 antialiased">
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}