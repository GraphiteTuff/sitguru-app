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

export default function CrispWidget() {
  const pathname = usePathname();

  const shouldHideWidget = hiddenPathPrefixes.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  if (shouldHideWidget) {
    return null;
  }

  return (
    <Script id="crisp-widget" strategy="afterInteractive">
      {`
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = "536e4f84-db5d-4527-a81e-1c5942b38c2a";

        (function () {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://client.crisp.chat/l.js";
          s.async = 1;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `}
    </Script>
  );
}