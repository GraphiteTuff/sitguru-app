"use client";

/**
 * Hydrate companion CTA / prompt viewer context from the browser session.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  primaryCompanionRole,
  uniqueCompanionRoles,
  type CompanionViewerContext,
} from "@/lib/chat/companion-auth";
import { sanitizePreferredName } from "@/lib/chat/homepage-name";
import {
  clearCompanionSessionOnLogout,
  COMPANION_SESSION_CLEARED_EVENT,
} from "@/lib/chat/clear-companion-session";

const GUEST_VIEWER: CompanionViewerContext = {
  isAuthenticated: false,
  firstName: null,
  roles: ["Guest Pet Parent"],
};

export function useCompanionViewer(
  seed?: Partial<CompanionViewerContext> | null,
): CompanionViewerContext {
  const [viewer, setViewer] = useState<CompanionViewerContext>(() => ({
    ...GUEST_VIEWER,
    ...seed,
    roles: seed?.roles?.length ? seed.roles : GUEST_VIEWER.roles,
  }));

  useEffect(() => {
    let cancelled = false;

    function applyGuest() {
      if (cancelled) return;
      setViewer({
        ...GUEST_VIEWER,
        isAuthenticated: false,
        firstName: null,
        roles: ["Guest Pet Parent"],
      });
    }

    void (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          applyGuest();
          return;
        }

        const [{ data: roles }, { data: profile }] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", uid)
            .limit(12),
          supabase
            .from("profiles")
            .select("first_name, full_name")
            .eq("id", uid)
            .maybeSingle(),
        ]);

        const roleLabels = uniqueCompanionRoles([
          ...(roles || []).map((row) => row.role),
          ...(seed?.roles || []),
        ]);
        const meta = auth.user?.user_metadata || {};
        const metaFirst =
          typeof meta.first_name === "string"
            ? meta.first_name
            : typeof meta.full_name === "string"
              ? String(meta.full_name).split(/\s+/)[0]
              : "";
        const profileFirst =
          sanitizePreferredName(profile?.first_name) ||
          sanitizePreferredName(String(profile?.full_name || "").split(/\s+/)[0]) ||
          "";
        const firstName =
          sanitizePreferredName(seed?.firstName) ||
          profileFirst ||
          sanitizePreferredName(metaFirst) ||
          null;

        if (cancelled) return;
        setViewer({
          isAuthenticated: true,
          firstName,
          roles: roleLabels.length
            ? roleLabels
            : [primaryCompanionRole([], "Pet Parent")],
        });
      } catch {
        applyGuest();
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCompanionSessionOnLogout();
        applyGuest();
      }
    });

    function onCleared() {
      applyGuest();
    }
    window.addEventListener(COMPANION_SESSION_CLEARED_EVENT, onCleared);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(COMPANION_SESSION_CLEARED_EVENT, onCleared);
    };
    // Seed is intentionally shallow — callers pass stable role/name hints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.firstName, seed?.isAuthenticated, (seed?.roles || []).join(",")]);

  return viewer;
}
