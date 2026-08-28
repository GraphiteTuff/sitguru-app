import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { getSitGuruApiBaseUrl, sitguruApiFetch } from "@/lib/data/api";

type TrackEventInput = {
  eventName: string;
  eventType?: string;
  role?: string;
  source?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = "sitguru_session_id";

async function getSessionId() {
  try {
    const existing = await AsyncStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return "";
  }
}

export async function trackMobileEvent(input: TrackEventInput) {
  const baseUrl = getSitGuruApiBaseUrl();
  if (!baseUrl) return;

  const sessionId = await getSessionId();

  await sitguruApiFetch("/api/analytics/track", {
    method: "POST",
    auth: false,
    body: {
      eventName: input.eventName,
      eventType: input.eventType || "community",
      role: input.role || "",
      source: input.source || "sitguru_mobile",
      pagePath: input.pagePath || "",
      sessionId,
      metadata: {
        platform: Platform.OS,
        ...input.metadata,
      },
    },
  }).catch(() => undefined);
}
