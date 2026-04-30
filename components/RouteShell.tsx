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

  const isCustomerDashboardPage =
    pathname === "/customer/dashboard" ||
    pathname.startsWith("/customer/dashboard/");

  const isCustomerPawPerksPage =
    pathname === "/customer/pawperks" ||
    pathname.startsWith("/customer/pawperks/");

  const isCustomerPage =
    pathname === "/customer" || pathname.startsWith("/customer/");

  const isCustomerMessagesPage =
    pathname === "/messages" || pathname.startsWith("/messages/");

  const isCustomerPetsPage =
    pathname === "/pets" || pathname.startsWith("/pets/");

  const isCustomerBookingsPage =
    pathname === "/bookings" || pathname.startsWith("/bookings/");

  const isCustomerPrivatePage =
    isCustomerPage ||
    isCustomerDashboardPage ||
    isCustomerPawPerksPage ||
    isCustomerMessagesPage ||
    isCustomerPetsPage ||
    isCustomerBookingsPage;

  if (isAdminPage) {
    return <main className="admin-theme site-main min-h-screen">{children}</main>;
  }

  if (isLaunchPage || isAuthPage) {
    return <main className="site-main min-h-screen">{children}</main>;
  }

  /*
   * Private Guru pages already render their own Guru dashboard header.
   * Private Customer pages will render their own Customer dashboard header.
   * Do not render the public marketing header here, or the dashboards show
   * double/triple headers.
   */
  if (isGuruPrivatePage || isCustomerPrivatePage) {
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