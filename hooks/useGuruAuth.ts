"use client";

/**
 * Web Guru session helper — mirrors mobile useAuth for provider dashboards.
 * Reads Supabase browser session + gurus profile row for Scout personalization.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type GuruAuthUser = {
  id: string;
  email: string | null;
  accessToken: string | null;
  /** gurus.id provider key */
  guruId: string | null;
  /** Full display name from guru profile / auth metadata */
  name: string;
  /** First token of name for greetings */
  firstName: string;
};

type GuruAuthState = {
  user: GuruAuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

function asTrimmed(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolveFirstName(fullName: string) {
  const token = fullName.trim().split(/\s+/)[0];
  return token || "Guru";
}

export function useGuruAuth(): GuruAuthState {
  const [user, setUser] = useState<GuruAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session ?? null;
      const authUser = session?.user ?? null;

      if (!authUser?.id) {
        setUser(null);
        return;
      }

      const { data: guru } = await supabase
        .from("gurus")
        .select("id,display_name,full_name,name,email")
        .eq("user_id", authUser.id)
        .maybeSingle();

      const guruRow = (guru || null) as {
        id?: string | null;
        display_name?: string | null;
        full_name?: string | null;
        name?: string | null;
        email?: string | null;
      } | null;

      const name =
        asTrimmed(guruRow?.display_name) ||
        asTrimmed(guruRow?.full_name) ||
        asTrimmed(guruRow?.name) ||
        asTrimmed(authUser.user_metadata?.full_name) ||
        asTrimmed(authUser.user_metadata?.name) ||
        asTrimmed(authUser.email?.split("@")[0]) ||
        "Guru";

      setUser({
        id: authUser.id,
        email: asTrimmed(authUser.email) || asTrimmed(guruRow?.email),
        accessToken: asTrimmed(session?.access_token),
        guruId: asTrimmed(guruRow?.id),
        name,
        firstName: resolveFirstName(name),
      });
    } catch (error) {
      console.error("useGuruAuth refresh failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { user, loading, refresh };
}
