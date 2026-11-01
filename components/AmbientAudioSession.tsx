"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAmbientAudioSession } from "@/lib/media/ambient-audio-session";

export default function AmbientAudioSession() {
  const pathname = usePathname();

  useEffect(() => {
    setAmbientAudioSession();
  }, [pathname]);

  return null;
}
