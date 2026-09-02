"use client";

import { useEffect } from "react";
import { setAmbientAudioSession } from "@/lib/media/ambient-audio-session";

export default function AmbientAudioSession() {
  useEffect(() => {
    setAmbientAudioSession();
  }, []);

  return null;
}
