"use client";

import { useEffect, useState } from "react";

export type MessagingViewportBox = {
  top: number;
  height: number;
  keyboardOpen: boolean;
};

const INITIAL_BOX: MessagingViewportBox = {
  top: 0,
  height: 0,
  keyboardOpen: false,
};

/**
 * Pins a full-screen chat sheet to the visual viewport so mobile keyboards
 * don't hide the thread / composer, and locks body scroll while open.
 */
export function useMessagingViewport(open: boolean): MessagingViewportBox {
  const [viewportBox, setViewportBox] =
    useState<MessagingViewportBox>(INITIAL_BOX);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      setViewportBox(INITIAL_BOX);
      return;
    }

    const syncViewport = () => {
      const vv = window.visualViewport;
      const height = Math.round(vv?.height ?? window.innerHeight);
      const top = Math.round(vv?.offsetTop ?? 0);
      const layoutHeight = window.innerHeight || height;
      const keyboardOpen = layoutHeight - height > 80;
      setViewportBox({ top, height, keyboardOpen });
    };

    syncViewport();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    return () => {
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return viewportBox;
}

export function messagingPanelStyle(
  viewportBox: MessagingViewportBox,
): { top: number; height: number; bottom: "auto" } | undefined {
  if (viewportBox.height <= 0) return undefined;
  // Floating card layout owns sizing from sm and up — only pin on phones.
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 640px)").matches
  ) {
    return undefined;
  }
  return {
    top: viewportBox.top,
    height: viewportBox.height,
    bottom: "auto",
  };
}
