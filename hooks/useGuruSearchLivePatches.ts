"use client";

/**
 * Subscribe to layout-emitted Guru live patches and merge into search state.
 */

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import {
  GURU_LIVE_UPDATE_EVENT,
  guruRowMatchesId,
  pickGuruLiveFields,
  type GuruLiveUpdateDetail,
} from "@/lib/gurus/live-updates";

type GuruLike = Record<string, unknown> & {
  id?: string | number | null;
  guru_id?: string | number | null;
  user_id?: string | null;
};

type RateLike = {
  id?: string | null;
  guru_id: string;
  service_key: string;
  service_label: string;
  is_enabled: boolean;
  rate_amount: number | string | null;
  rate_unit: string | null;
  duration_minutes?: number | string | null;
  notes?: string | null;
};

type Options<TGuru extends GuruLike, TRate extends RateLike> = {
  enabled?: boolean;
  setGurus: Dispatch<SetStateAction<TGuru[]>>;
  setServiceRatesByGuru: Dispatch<SetStateAction<Record<string, TRate[]>>>;
};

export function useGuruSearchLivePatches<
  TGuru extends GuruLike,
  TRate extends RateLike,
>({ enabled = true, setGurus, setServiceRatesByGuru }: Options<TGuru, TRate>) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onLive = (event: Event) => {
      const detail = (event as CustomEvent<GuruLiveUpdateDetail>).detail;
      if (!detail) return;

      if (detail.type === "guru") {
        const patch = pickGuruLiveFields(detail.row);
        setGurus((prev) =>
          prev.map((guru) =>
            guruRowMatchesId(guru, detail.row)
              ? ({ ...guru, ...patch } as TGuru)
              : guru,
          ),
        );
        return;
      }

      if (detail.type === "rates") {
        const guruId = String(detail.row.guru_id || "").trim();
        if (!guruId) return;

        void (async () => {
          const { data, error } = await supabase
            .from("guru_service_rates")
            .select(
              "id, guru_id, service_key, service_label, is_enabled, rate_amount, rate_unit, duration_minutes, notes",
            )
            .eq("guru_id", guruId)
            .eq("is_enabled", true);

          if (error) {
            console.warn(
              "[guru-live] rate refresh failed:",
              error.message,
            );
            return;
          }

          setServiceRatesByGuru((prev) => ({
            ...prev,
            [guruId]: (data || []) as TRate[],
          }));
        })();
      }
    };

    window.addEventListener(GURU_LIVE_UPDATE_EVENT, onLive as EventListener);
    return () => {
      window.removeEventListener(
        GURU_LIVE_UPDATE_EVENT,
        onLive as EventListener,
      );
    };
  }, [enabled, setGurus, setServiceRatesByGuru]);
}
