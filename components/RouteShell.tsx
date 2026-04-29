"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isLaunchPage = pathname === "/launch";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/guru/login" ||
    pathname === "/guru/signup" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/auth/");

  const isGuruDashboardPage =
    pathname === "/guru/dashboard" || pathname.startsWith("/guru/dashboard/");

  const isGuruBookingsPage =
    pathname === "/guru/bookings" || pathname.startsWith("/guru/bookings/");

  const isGuruAvailabilityPage =
    pathname === "/guru/availability" ||
    pathname.startsWith("/guru/availability/");

  const isGuruResourcesPage =
    pathname === "/guru/resources" || pathname.startsWith("/guru/resources/");

  const isGuruPetFamiliesPage =
    pathname === "/guru/pet-families" ||
    pathname.startsWith("/guru/pet-families/");

  const isGuruPrivatePage =
    isGuruDashboardPage ||
    isGuruBookingsPage ||
    isGuruAvailabilityPage ||
    isGuruResourcesPage ||
    isGuruPetFamiliesPage;

  if (isAdminPage) {
    return <main className="admin-theme site-main min-h-screen">{children}</main>;
  }

  if (isLaunchPage || isAuthPage) {
    return <main className="site-main min-h-screen">{children}</main>;
  }

  /*
   * Private Guru pages already render their own Guru dashboard header.
   * Use a neutral wrapper here so there is no duplicate header and no dark/blue
   * theme strip between the page content and the footer.
   */
  if (isGuruPrivatePage) {
    return (
      <>
        <div className="site-main bg-white">{children}</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="site-main min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
