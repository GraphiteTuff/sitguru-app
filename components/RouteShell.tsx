"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isLaunchPage = pathname === "/launch";

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isGuruPage = pathname === "/guru" || pathname.startsWith("/guru/");

  const hidePublicHeaderFooter = isLaunchPage || isAdminPage || isGuruPage;

  if (hidePublicHeaderFooter) {
    return <main className="site-main min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="site-main min-h-[80vh]">{children}</main>
      <Footer />
    </>
  );
}