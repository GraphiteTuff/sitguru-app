import { supabaseAdmin } from "@/utils/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushPayload = {
  userId: string;
  title: string;
  body: string;
  href?: string;
  data?: Record<string, unknown>;
  channelId?: "sitguru-bookings" | "sitguru-messages" | "sitguru-care";
  categoryId?: string;
};

function normalizeExpoToken(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const token = raw.startsWith("expo:") ? raw.slice(5) : raw;
  if (
    !token.startsWith("ExponentPushToken") &&
    !token.startsWith("ExpoPushToken")
  ) {
    return "";
  }

  return token;
}

export async function resolveExpoPushTokens(userId: string): Promise<string[]> {
  const id = String(userId || "").trim();
  if (!id) return [];

  const tokens = new Set<string>();

  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("expo_push_token")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", id)
      .ilike("endpoint", "expo:%"),
  ]);

  const profileToken = normalizeExpoToken(
    (profile as { expo_push_token?: string | null } | null)?.expo_push_token,
  );
  if (profileToken) tokens.add(profileToken);

  for (const row of subscriptions || []) {
    const token = normalizeExpoToken(
      (row as { endpoint?: string | null }).endpoint,
    );
    if (token) tokens.add(token);
  }

  return [...tokens];
}

export async function sendExpoPushToUser(
  payload: ExpoPushPayload,
): Promise<{ sent: number; errors: string[] }> {
  const tokens = await resolveExpoPushTokens(payload.userId);
  if (!tokens.length) {
    return { sent: 0, errors: [] };
  }

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    sound: "default",
    channelId: payload.channelId || "sitguru-care",
    categoryId: payload.categoryId,
    data: {
      href: payload.href || "",
      ...(payload.data || {}),
    },
  }));

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };

  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Expo push failed (${response.status})`);
  }

  return { sent: tokens.length, errors: [] };
}
