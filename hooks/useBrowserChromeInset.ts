"use client";

import { useEffect } from "react";

const CSS_VAR = "--sg-chrome-bottom";

/**
 * Tracks how much of the layout viewport sits under mobile browser chrome
 * (iOS Safari bottom toolbar, etc.) and exposes it as --sg-chrome-bottom.
 * Fixed docks can then sit above the browser UI instead of under it.
 */
export function useBrowserChromeInset() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        if (!vv) {
          root.style.setProperty(CSS_VAR, "0px");
          return;
        }

        // Gap between layout bottom and the visible viewport bottom.
        const chromeBottom = Math.max(
          0,
          Math.round(window.innerHeight - (vv.height + vv.offsetTop)),
        );
        root.style.setProperty(CSS_VAR, `${chromeBottom}px`);
      });
    };

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty(CSS_VAR);
    };
  }, []);
}
