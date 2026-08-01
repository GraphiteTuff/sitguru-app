"use client";

/**
 * Page-scoped Realtime listener for /guru/[slug] when we know the Guru id.
 * Complements the layout bridge with a precise id/user filter + refresh.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  guruId?: string | null;
  userId?: string | null;
};

export default function GuruProfileLiveRefresh({ guruId, userId }: Props) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = String(guruId || "").trim();
    const uid = String(userId || "").trim();
    if (!id && !uid) return;

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };

    let channel = supabase.channel(
      `sitguru-guru-profile-refresh-${id || uid}`,
    );

    if (id) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gurus",
          filter: `id=eq.${id}`,
        },
        scheduleRefresh,
      );
    }

    if (uid) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gurus",
          filter: `user_id=eq.${uid}`,
        },
        scheduleRefresh,
      );
    }

    if (id) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guru_service_rates",
          filter: `guru_id=eq.${id}`,
        },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [guruId, userId, router]);

  return null;
}
