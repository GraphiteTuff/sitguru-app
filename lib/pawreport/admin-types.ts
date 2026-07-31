// lib/pawreport/admin-types.ts
/**
 * Admin oversight types for PawReport global tracking + filters.
 */

export const PAWREPORT_GLOBAL_TRACKING_STATUSES = [
  "PRE_WALK",
  "ACTIVE_TRACKING",
  "PAUSED_BREAK",
  "COMPLETED",
  "FLAGGED_ALERT",
  "ARCHIVED",
] as const;

export type PawReportGlobalTrackingStatus =
  (typeof PAWREPORT_GLOBAL_TRACKING_STATUSES)[number];

export const GPS_STALE_ALERT_MS = 15 * 60 * 1000;

export type AdminReportFilters = {
  guruId?: string;
  petParentId?: string;
  bookingStatus?: string;
  trackingStatus?: PawReportGlobalTrackingStatus | "ACTIVE_ANY";
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  liveOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type AdminLiveWalkRow = {
  bookingId: string;
  sessionId: string | null;
  walkTrackId: string | null;
  petName: string;
  guruId: string | null;
  guruName: string;
  guruPhone: string | null;
  petParentId: string | null;
  petParentName: string;
  bookingStatus: string | null;
  globalTrackingStatus: PawReportGlobalTrackingStatus;
  walkStatus: string | null;
  adminNotes: string | null;
  lastGpsAt: string | null;
  flaggedAt: string | null;
  startedAt: string | null;
  distanceMeters: number;
  durationSeconds: number;
  distanceMiles: number;
  durationMinutes: number;
  staleMinutes: number | null;
  isStaleAlert: boolean;
  lastEventType: string | null;
  lastEventLabel: string | null;
};

export type AdminLiveWalkStats = {
  totalActiveWalks: number;
  totalDistanceTrackedTodayMiles: number;
  activeAlerts: number;
  /** Sessions in PRE_WALK (Guru en route / setup) */
  gurusEnRoute: number;
};

export type AdminReportsListResult = {
  rows: AdminLiveWalkRow[];
  stats: AdminLiveWalkStats;
  total: number;
  scannedAlerts: number;
};
