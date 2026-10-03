"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAmbientAudioSession } from "@/lib/media/ambient-audio-session";

function setPlaybackAudioSession() {
  const session = (
    navigator as Navigator & { audioSession?: { type?: string } }
  ).audioSession;
  if (!session) return;

  try {
    session.type = "playback";
  } catch {
    // Safari-only API. Other browsers ignore this.
  }
}

export default function AmbientAudioSession() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      setPlaybackAudioSession();
      return;
    }

    setAmbientAudioSession();
  }, [pathname]);

  return null;
}
