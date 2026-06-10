"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import GlobalMessageNotifier from "@/components/GlobalMessageNotifier";

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  const isPasswordResetPage =
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth/recover" ||
    pathname.startsWith("/auth/recover/");

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/sign-up" ||
    pathname === "/customer/login" ||
    pathname === "/guru/login" ||
    pathname === "/guru/signup" ||
    pathname === "/admin/login" ||
    pathname === "/ambassador/login" ||
    pathname === "/provider/login" ||
    pathname === "/phone-login" ||
    pathname.startsWith("/auth/") ||
    isPasswordResetPage;

  const isPublicSearchPage =
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname === "/find-care" ||
    pathname.startsWith("/find-care/") ||
    pathname === "/pet-gurus" ||
    pathname.startsWith("/pet-gurus/");

  const isPublicGuruProfilePage =
    pathname.startsWith("/guru/") &&
    !pathname.startsWith("/guru/dashboard/") &&
    pathname !== "/guru/dashboard" &&
    pathname !== "/guru/login" &&
    pathname !== "/guru/signup" &&
    pathname !== "/guru/application" &&
    pathname !== "/guru/bookings" &&
    pathname !== "/guru/messages" &&
    pathname !== "/guru/profile" &&
    pathname !== "/guru/success-center";

  const isPublicShortGuruProfilePage =
    pathname.startsWith("/g/") ||
    pathname.startsWith("/sitter/") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/r/");

  const isPublicPage =
    isPublicSearchPage ||
    isPublicGuruProfilePage ||
    isPublicShortGuruProfilePage;

  const isGuruDashboardPage =
    pathname === "/guru/dashboard" || pathname.startsWith("/guru/dashboard/");

  const isGuruBookingsPage =
    pathname === "/guru/bookings" || pathname.startsWith("/guru/bookings/");

  const isGuruAvailabilityPage =
    pathname === "/guru/availability" ||
    pathname.startsWith("/guru/availability/");

  const isGuruResourcesPage =
    pathname === "/guru/resources" || pathname.startsWith("/guru/resources/");

  const isGuruSuccessCenterPage =
    pathname === "/guru/success-center" ||
    pathname.startsWith("/guru/success-center/");

  const isGuruPetFamiliesPage =
    pathname === "/guru/pet-families" ||
    pathname.startsWith("/guru/pet-families/");

  const isGuruMessagesPage =
    pathname === "/guru/messages" || pathname.startsWith("/guru/messages/");

  const isGuruPrivatePage =
    !isPublicPage &&
    (isGuruDashboardPage ||
      isGuruBookingsPage ||
      isGuruAvailabilityPage ||
      isGuruResourcesPage ||
      isGuruSuccessCenterPage ||
      isGuruPetFamiliesPage ||
      isGuruMessagesPage);

  const isCustomerDashboardPage =
    pathname === "/customer/dashboard" ||
    pathname.startsWith("/customer/dashboard/");

  const isCustomerPawPerksPage =
    pathname === "/customer/pawperks" ||
    pathname.startsWith("/customer/pawperks/") ||
    pathname === "/customer/dashboard/pawperks" ||
    pathname.startsWith("/customer/dashboard/pawperks/");

  const isCustomerAccountPage =
    pathname === "/customer" ||
    (pathname.startsWith("/customer/") && pathname !== "/customer/login");

  const isCustomerMessagesPage =
    pathname === "/messages" || pathname.startsWith("/messages/");

  const isCustomerPetsPage =
    pathname === "/pets" || pathname.startsWith("/pets/");

  const isCustomerBookingsPage =
    pathname === "/bookings" || pathname.startsWith("/bookings/");

  const isCustomerPrivatePage =
    !isPublicPage &&
    (isCustomerAccountPage ||
      isCustomerDashboardPage ||
      isCustomerPawPerksPage ||
      isCustomerMessagesPage ||
      isCustomerPetsPage ||
      isCustomerBookingsPage);

  const shouldShowGlobalMessageNotifier = !isAuthPage;

  if (isAdminPage) {
    return (
      <>
        <main className="admin-theme site-main min-h-screen">{children}</main>
        {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
        <ScrollToTopButton />
      </>
    );
  }

  if (isAuthPage) {
    return (
      <>
        <main className="site-main min-h-screen">{children}</main>
        <ScrollToTopButton />
      </>
    );
  }

  if (isGuruPrivatePage || isCustomerPrivatePage) {
    return (
      <>
        <div className="site-main min-h-screen bg-white">{children}</div>
        <Footer />
        {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
        <ScrollToTopButton />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="site-main min-h-[70vh]">{children}</main>
      <Footer />
      {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
      <ScrollToTopButton />
    </>
  );
}