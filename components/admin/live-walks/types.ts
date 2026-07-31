// components/admin/live-walks/types.ts
import type {
  AdminLiveWalkRow,
  AdminLiveWalkStats,
  PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";

export type {
  AdminLiveWalkRow,
  AdminLiveWalkStats,
  PawReportGlobalTrackingStatus,
};

export type LiveWalksListResponse = {
  ok?: boolean;
  error?: string;
  rows?: AdminLiveWalkRow[];
  stats?: AdminLiveWalkStats;
  total?: number;
  scannedAlerts?: number;
};

export type AdminOverrideAction =
  | "force_end"
  | "append_timeline"
  | "update_meta"
  | "send_guru_sms";

export const EMPTY_LIVE_STATS: AdminLiveWalkStats = {
  totalActiveWalks: 0,
  totalDistanceTrackedTodayMiles: 0,
  activeAlerts: 0,
  gurusEnRoute: 0,
};

export function formatDurationClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
