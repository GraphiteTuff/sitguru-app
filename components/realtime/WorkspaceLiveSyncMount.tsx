"use client";

/**
 * Client mount that resolves the session user and attaches workspace live sync.
 * Safe in server layouts — does not import service-role modules.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import WorkspaceLiveSyncBridge from "@/components/realtime/WorkspaceLiveSyncBridge";

export default function WorkspaceLiveSyncMount({
  scopes,
  showStatus = false,
}: {
  scopes?: string[];
  showStatus?: boolean;
}) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.session?.user?.id || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <WorkspaceLiveSyncBridge
      userId={userId}
      enabled={Boolean(userId)}
      scopes={scopes}
      showStatus={showStatus}
    />
  );
}
