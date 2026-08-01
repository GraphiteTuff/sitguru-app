"use client";

/**
 * Browser-safe Supabase Realtime for public Guru surfaces.
 * Uses ANON/publishable key only — never service role.
 */

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  dispatchGuruLiveUpdate,
  pickGuruLiveFields,
} from "@/lib/gurus/live-updates";

function isPublicSearchPath(pathname: string) {
  return (
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname === "/find-care" ||
    pathname.startsWith("/find-care/") ||
    pathname === "/pet-gurus" ||
    pathname.startsWith("/pet-gurus/")
  );
}

function isPublicGuruProfilePath(pathname: string) {
  if (!pathname.startsWith("/guru/")) return false;
  if (pathname.startsWith("/guru/dashboard")) return false;
  if (
    pathname === "/guru/login" ||
    pathname === "/guru/signup" ||
    pathname === "/guru/application" ||
    pathname.startsWith("/guru/walk")
  ) {
    return false;
  }
  return true;
}

function profileSlugFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  // /guru/[slug]
  if (parts[0] === "guru" && parts[1]) return parts[1].toLowerCase();
  return "";
}

function rowMatchesProfileSlug(
  row: Record<string, unknown>,
  slug: string,
): boolean {
  if (!slug) return false;
  const candidates = [row.public_slug, row.slug]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
  return candidates.includes(slug);
}

/**
 * Mount in RouteShell — activates only on public search / public Guru profile.
 * Search pages receive CustomEvents; profile pages soft-refresh.
 */
export default function GuruLiveUpdatesBridge() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearch = isPublicSearchPath(pathname);
  const onProfile = isPublicGuruProfilePath(pathname);
  const profileSlug = onProfile ? profileSlugFromPath(pathname) : "";

  useEffect(() => {
    if (!onSearch && !onProfile) return;

    const channelName = onProfile
      ? `sitguru-guru-live-profile-${profileSlug || "unknown"}`
      : "sitguru-guru-live-search";

    const scheduleProfileRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 280);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gurus",
        },
        (payload) => {
          const row = pickGuruLiveFields(
            (payload.new || {}) as Record<string, unknown>,
          );
          if (!Object.keys(row).length) return;

          if (onSearch) {
            dispatchGuruLiveUpdate({ type: "guru", row });
          }

          if (onProfile && rowMatchesProfileSlug(row, profileSlug)) {
            scheduleProfileRefresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guru_service_rates",
        },
        (payload) => {
          const row = (payload.new ||
            payload.old ||
            {}) as Record<string, unknown>;
          if (!row || typeof row !== "object") return;

          const event =
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
              ? payload.eventType
              : "*";

          if (onSearch) {
            dispatchGuruLiveUpdate({ type: "rates", row, event });
          }

          // Profile rate precision is handled by GuruProfileLiveRefresh (id filter).
        },
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [onSearch, onProfile, profileSlug, router]);

  return null;
}
