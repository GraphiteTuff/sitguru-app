type TrackEventInput = {
  eventName: string;
  eventType?: string;
  role?: string;
  source?: string;
  pagePath?: string;
  guruId?: string;
  bookingId?: string;
  metadata?: Record<string, unknown>;
};

function getSessionId() {
  if (typeof window === "undefined") return "";

  const key = "sitguru_session_id";
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, sessionId);

  return sessionId;
}

export async function trackEvent(input: TrackEventInput) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: input.eventName,
        eventType: input.eventType || "",
        role: input.role || "",
        source: input.source || "",
        pagePath:
          input.pagePath ||
          (typeof window !== "undefined" ? window.location.pathname : ""),
        guruId: input.guruId || "",
        bookingId: input.bookingId || "",
        sessionId: getSessionId(),
        metadata: input.metadata || {},
      }),
    });
  } catch (error) {
    console.error("Unable to track analytics event:", error);
  }
}
