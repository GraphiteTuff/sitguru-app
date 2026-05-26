"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const hiddenPathPrefixes = [
  "/admin",
  "/customer/dashboard",
  "/guru/dashboard",
  "/messages",
  "/message",
];

export default function TawkToWidget() {
  const pathname = usePathname();

  const shouldHideWidget = hiddenPathPrefixes.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  if (shouldHideWidget) {
    return null;
  }

  return (
    <Script id="tawk-to-widget" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();

        (function() {
          var s1 = document.createElement("script");
          var s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = "https://embed.tawk.to/6a152defca67221c346beec1/default";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}