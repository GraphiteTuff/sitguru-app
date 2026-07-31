// lib/pawreport/types.ts
/**
 * Shared PawReport live payload — consumed by API routes + frontend hooks.
 */

export type PawReportSessionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "canceled";

export type {
  PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";

export { PAWREPORT_GLOBAL_TRACKING_STATUSES } from "@/lib/pawreport/admin-types";

export type PawReportUpdateType =
  | "visit_started"
  | "visit_ended"
  | "pee"
  | "poop"
  | "water"
  | "food"
  | "photo"
  | "note"
  | "medication"
  | "walk"
  | "play"
  | "mood";

export type PawReportAccessRole = "guru" | "pet_parent" | "admin";

export type WalkPoint = {
  lat: number;
  lng: number;
  recordedAt: string;
};

export type PawReportPhoto = {
  id: string;
  url: string;
  note: string | null;
  createdAt: string;
};

export type PawReportStatusLog = {
  key: "food" | "water" | "potty" | "medication";
  label: string;
  done: boolean;
  detail: string;
  updatedAt: string | null;
};

export type PawReportLivePayload = {
  bookingId: string;
  petName: string;
  guruName: string;
  viewerRole: PawReportAccessRole;
  canWrite: boolean;
  session: {
    id: string | null;
    status: PawReportSessionStatus;
    startedAt: string | null;
    endedAt: string | null;
    finalNote: string | null;
  };
  walk: {
    isActive: boolean;
    distanceMeters: number;
    durationSeconds: number;
    distanceLabel: string;
    durationLabel: string;
    path: WalkPoint[];
  };
  photos: PawReportPhoto[];
  newPhotoCount: number;
  statusLogs: PawReportStatusLog[];
  recentNotes: Array<{
    id: string;
    updateType: string;
    note: string | null;
    createdAt: string;
  }>;
  updatedAt: string;
};
