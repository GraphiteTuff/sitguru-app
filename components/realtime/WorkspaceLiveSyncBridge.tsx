"use client";

/**
 * Mount in Intern / Manager / Growth / Admin shells.
 * Subscribes only to the authenticated user's sitguru_live_signals rows (RLS).
 * Messaging realtime is unchanged — this enhances workspace portals (req 111).
 */

import { useWorkspaceLiveSync } from "@/hooks/useWorkspaceLiveSync";

export type WorkspaceLiveSyncBridgeProps = {
  userId?: string | null;
  enabled?: boolean;
  scopes?: string[];
  /** Subtle reconnect / updated label (req 105) — off by default. */
  showStatus?: boolean;
  className?: string;
};

export default function WorkspaceLiveSyncBridge({
  userId,
  enabled = true,
  scopes,
  showStatus = false,
  className,
}: WorkspaceLiveSyncBridgeProps) {
  const { statusLabel } = useWorkspaceLiveSync({
    userId,
    enabled: enabled && Boolean(userId),
    scopes,
    showStatus,
  });

  if (!showStatus || !statusLabel) return null;

  return (
    <p
      className={
        className ||
        "pointer-events-none fixed bottom-3 right-3 z-[60] rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
      }
      aria-live="polite"
    >
      {statusLabel}
    </p>
  );
}
