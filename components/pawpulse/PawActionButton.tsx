"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { usePawPulse } from "@/components/pawpulse/PawPulseProvider";

export function PawActionButton({
  children,
  pendingLabel,
  actionId,
  onAction,
  successMessage,
  errorMessage = "Unable to save changes. Please try again.",
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel: string;
  actionId: string;
  onAction: () => Promise<{ ok: boolean; message: string }>;
  successMessage?: string;
  errorMessage?: string;
  children: ReactNode;
}) {
  const pulse = usePawPulse();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  return (
    <button
      {...props}
      type="button"
      className={className}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        setLabel(pendingLabel);
        const id = pulse.begin(pendingLabel, actionId);
        try {
          const result = await onAction();
          if (result.ok) pulse.succeed(id, successMessage || result.message);
          else pulse.fail(id, result.message || errorMessage);
        } catch {
          pulse.fail(id, errorMessage);
        } finally {
          setBusy(false);
          setLabel(null);
        }
      }}
    >
      {busy ? label : children}
    </button>
  );
}
