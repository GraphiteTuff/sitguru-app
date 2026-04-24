"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SiteChromeProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
};

export default function SiteChrome({
  children,
  header,
  footer,
}: SiteChromeProps) {
  const pathname = usePathname();

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isGuruArea = pathname === "/guru" || pathname.startsWith("/guru/");

  const hidePublicChrome = isAdminArea || isGuruArea;

  return (
    <>
      {!hidePublicChrome ? header : null}
      {children}
      {!hidePublicChrome ? footer : null}
    </>
  );
}