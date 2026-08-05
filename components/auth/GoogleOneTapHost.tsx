/**
 * Suspense-safe host for Google One-Tap on public marketing routes.
 */

"use client";

import { Suspense } from "react";
import GoogleOneTapOverlay from "@/components/auth/GoogleOneTapOverlay";
import type { OneTapRole } from "@/lib/auth/google-one-tap";

export default function GoogleOneTapHost({
  activeRole,
  disabled,
}: {
  activeRole?: OneTapRole;
  disabled?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <GoogleOneTapOverlay activeRole={activeRole} disabled={disabled} />
    </Suspense>
  );
}
