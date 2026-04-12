import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        <Header />
        <main className="site-main min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}