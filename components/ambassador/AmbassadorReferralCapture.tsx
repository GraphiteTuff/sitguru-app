// components/ambassador/AmbassadorReferralCapture.tsx
"use client";

import { Suspense } from "react";
import { useAmbassadorReferralCapture } from "@/hooks/useAmbassadorReferralCapture";

function CaptureInner() {
  useAmbassadorReferralCapture();
  return null;
}

/** Mount once in the root/public layout to attribute ?ref= traffic. */
export default function AmbassadorReferralCapture() {
  return (
    <Suspense fallback={null}>
      <CaptureInner />
    </Suspense>
  );
}
