"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalMessageNotifier from "@/components/GlobalMessageNotifier";
import FloatingActionStack from "@/components/FloatingActionStack";
import HomepageChatBubble from "@/components/messaging/HomepageChatBubble";
import GuruLiveUpdatesBridge from "@/components/gurus/GuruLiveUpdatesBridge";
import AIScoutCompanion from "@/components/officers/AIScoutCompanion";
import { getBotConfig } from "@/lib/companions/bot-config";
import {
  isGuruWorkspacePath,
  isPublicGuruOnboardingPath,
  isPublicGuruProfilePath,
} from "@/lib/companions/scout-routes";

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isHomePage = pathname === "/";

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

  const isPublicGuruProfilePage = isPublicGuruProfilePath(pathname);

  const isPublicShortGuruProfilePage =
    pathname.startsWith("/g/") ||
    pathname.startsWith("/sitter/") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/r/");

  const isPublicPage =
    isPublicSearchPage ||
    isPublicGuruProfilePage ||
    isPublicShortGuruProfilePage;

  const isGuruPrivatePage =
    !isPublicPage &&
    !isAuthPage &&
    (isGuruWorkspacePath(pathname) ||
      (pathname.startsWith("/guru/") &&
        !isPublicGuruOnboardingPath(pathname) &&
        pathname !== "/guru/login" &&
        pathname !== "/guru/signup"));

  // Public marketing Ambassadors pages use the global SitGuru Header.
  // Private /ambassador/* workspace keeps its own dashboard chrome (no public Header).
  const isPublicAmbassadorMarketingPage =
    pathname === "/ambassadors" ||
    pathname.startsWith("/ambassadors/") ||
    pathname === "/programs/ambassadors" ||
    pathname.startsWith("/programs/ambassadors/");

  const isAmbassadorPrivatePage =
    pathname === "/ambassador" ||
    (pathname.startsWith("/ambassador/") &&
      pathname !== "/ambassador/login" &&
      !pathname.startsWith("/ambassador/login/"));

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

  const isPetParentCompanionPage =
    isCustomerPrivatePage ||
    pathname === "/parent" ||
    pathname.startsWith("/parent/");

  const shouldShowGlobalMessageNotifier = !isAuthPage;

  const bot = getBotConfig({ mode: "auto", currentPath: pathname });

  // Rogue = Pet Parent companion (home, public browse, customer account).
  // Scout / Taco mount via AIScoutCompanion on Guru + Ambassador surfaces.
  const shouldShowRogueChat =
    !isAuthPage &&
    !isAdminPage &&
    !isGuruPrivatePage &&
    !isAmbassadorPrivatePage &&
    !isPublicAmbassadorMarketingPage &&
    !isPublicGuruOnboardingPath(pathname) &&
    pathname !== "/become-a-guru" &&
    !pathname.startsWith("/become-a-guru/") &&
    (isHomePage || isPublicPage || isPetParentCompanionPage);

  const shouldShowScoutOrTaco =
    !isAuthPage &&
    !isAdminPage &&
    !shouldShowRogueChat &&
    bot.shouldRender &&
    (bot.variant === "scout" || bot.variant === "taco");

  const floatingControls = shouldShowRogueChat ? (
    <FloatingActionStack>
      <HomepageChatBubble />
    </FloatingActionStack>
  ) : shouldShowScoutOrTaco ? (
    <AIScoutCompanion mode="auto" currentPath={pathname} />
  ) : null;

  if (isAdminPage) {
    return (
      <>
        <main className="admin-theme site-main min-h-screen">{children}</main>
        {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
        {floatingControls}
      </>
    );
  }

  if (isAuthPage) {
    return (
      <>
        <main className="site-main min-h-screen">{children}</main>
        {floatingControls}
      </>
    );
  }

  if (isGuruPrivatePage || isCustomerPrivatePage || isAmbassadorPrivatePage) {
    return (
      <>
        <div className="site-main min-h-screen bg-white">{children}</div>
        <Footer />
        {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
        {floatingControls}
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="site-main min-h-[70vh]">{children}</main>
      <Footer />
      {shouldShowGlobalMessageNotifier ? <GlobalMessageNotifier /> : null}
      {/* Browser-safe Realtime: Guru status / pricing / photo → search + profiles */}
      <GuruLiveUpdatesBridge />
      {floatingControls}
    </>
  );
}
