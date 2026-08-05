"use client";

/**
 * Personalized floating AI Scout companion for Guru/provider routes.
 * Loads the signed-in Guru session (id, name, access token) and mounts Scout
 * with prompt context scoped to that provider account.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import ScoutFloatingAssistant from "@/components/officers/ScoutFloatingAssistant";

const SCOUT_ROUTE_PREFIXES = [
  "/guru/dashboard",
  "/guru/bookings",
  "/guru/referrals",
  "/guru/messages",
  "/guru/profile",
  "/guru/availability",
  "/guru/earnings",
  "/guru/success-center",
] as const;

type GuruSessionMeta = {
  accessToken: string | null;
  providerId: string | null;
  guruName: string | null;
  userId: string | null;
  email: string | null;
};

function isGuruScoutRoute(pathname: string | null) {
  if (!pathname) return false;
  return SCOUT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function asTrimmed(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function AIScoutCompanion() {
  const pathname = usePathname();
  const enabled = isGuruScoutRoute(pathname);
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState<GuruSessionMeta>({
    accessToken: null,
    providerId: null,
    guruName: null,
    userId: null,
    email: null,
  });

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let cancelled = false;

    async function loadGuruSession() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session ?? null;
        const user = session?.user ?? null;

        if (!user?.id) {
          if (!cancelled) {
            setMeta({
              accessToken: null,
              providerId: null,
              guruName: null,
              userId: null,
              email: null,
            });
            setReady(true);
          }
          return;
        }

        const { data: guru } = await supabase
          .from("gurus")
          .select(
            "id,display_name,full_name,name,email,photo_url,profile_photo_url",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        const guruRow = (guru || null) as {
          id?: string | null;
          display_name?: string | null;
          full_name?: string | null;
          name?: string | null;
          email?: string | null;
        } | null;

        const guruName =
          asTrimmed(guruRow?.display_name) ||
          asTrimmed(guruRow?.full_name) ||
          asTrimmed(guruRow?.name) ||
          asTrimmed(user.user_metadata?.full_name) ||
          asTrimmed(user.user_metadata?.name) ||
          asTrimmed(user.email?.split("@")[0]) ||
          null;

        if (!cancelled) {
          setMeta({
            accessToken: asTrimmed(session?.access_token),
            providerId: asTrimmed(guruRow?.id),
            guruName,
            userId: user.id,
            email: asTrimmed(user.email) || asTrimmed(guruRow?.email),
          });
          setReady(true);
        }
      } catch (error) {
        console.error("AI Scout session load failed:", error);
        if (!cancelled) setReady(true);
      }
    }

    void loadGuruSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadGuruSession();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled || !ready || !meta.userId) {
    return null;
  }

  return (
    <SafeAssistantBubble>
      <div className="contents" data-ai-scout-companion data-guru-id={meta.providerId || meta.userId}>
        <ScoutFloatingAssistant
          key={meta.providerId || meta.userId}
          accessToken={meta.accessToken}
          providerId={meta.providerId}
          guruName={meta.guruName}
          guruEmail={meta.email}
          surface="dashboard"
        />
      </div>
    </SafeAssistantBubble>
  );
}
