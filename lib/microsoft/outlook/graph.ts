import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { openOutlookValue, outlookDeepLink, sealOutlookValue } from "./security";
import { outlookMonthWindow } from "./ical";
import type { OutlookFlow, outlookSettings } from "./security";

type Settings = NonNullable<ReturnType<typeof outlookSettings>>;
type Credentials = { access: string; refresh: string; expires: number };
const scopes = "offline_access Mail.ReadBasic Calendars.Read.Shared";
const graph = "https://graph.microsoft.com";
const table = "internship_outlook_connections";

export function outlookAuthorization(settings: Settings, flow: OutlookFlow) {
  const authorize = new URL(`https://login.microsoftonline.com/${settings.tenant}/oauth2/v2.0/authorize`);
  authorize.search = new URLSearchParams({
    client_id: settings.client, response_type: "code", response_mode: "query",
    redirect_uri: settings.callback.href, scope: scopes, state: flow.state, prompt: "select_account",
    code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"), code_challenge_method: "S256",
  }).toString();
  return authorize;
}

class OutlookGraphError extends Error {
  constructor(readonly status: number) { super("Outlook request failed"); }
}

async function getToken(settings: Settings, fields: Record<string, string>, priorRefresh = "") {
  const response = await fetch(`https://login.microsoftonline.com/${settings.tenant}/oauth2/v2.0/token`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    body: new URLSearchParams({ client_id: settings.client, client_secret: settings.secret, scope: scopes, ...fields }),
  });
  const data = await response.json();
  if (!response.ok) throw new OutlookGraphError(data.error === "invalid_grant" ? 401 : response.status);
  const granted = String(data.scope || "").toLowerCase().trim().split(/\s+/).map((scope) => scope.split("/").at(-1));
  if (!priorRefresh && (!granted.includes("mail.readbasic") || !granted.includes("calendars.read.shared"))) {
    throw new OutlookGraphError(403);
  }
  const refresh = data.refresh_token || priorRefresh;
  const expiresIn = Number(data.expires_in);
  if (typeof data.access_token !== "string" || !data.access_token || typeof refresh !== "string" || !refresh || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new OutlookGraphError(502);
  }
  return { access: data.access_token, refresh, expires: Date.now() + expiresIn * 1000 };
}

export async function connectOutlook(settings: Settings, flow: OutlookFlow, code: string) {
  const token = await getToken(settings, {
    grant_type: "authorization_code", redirect_uri: settings.callback.href, code, code_verifier: flow.verifier,
  });
  const { error } = await supabaseAdmin.from(table).upsert({
    user_id: flow.userId, version: randomUUID(), updated_at: new Date().toISOString(),
    credentials: sealOutlookValue(settings.key, `outlook:token:${flow.userId}`, token),
  }, { onConflict: "user_id" });
  if (error) throw new Error("Outlook connection could not be saved");
}

export async function disconnectOutlook(userId: string) {
  const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
  if (error) throw new Error("Outlook connection could not be removed");
}

async function accessToken(settings: Settings, userId: string) {
  const purpose = `outlook:token:${userId}`;
  const { data, error } = await supabaseAdmin.from(table).select("version,credentials").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Outlook connection unavailable");
  if (!data) return null;
  const token = openOutlookValue<Credentials>(settings.key, purpose, data.credentials);
  if (!token) throw new OutlookGraphError(401);
  if (token.expires > Date.now() + 60_000) return token.access;

  const next = await getToken(settings, { grant_type: "refresh_token", refresh_token: token.refresh }, token.refresh);
  const result = await supabaseAdmin.from(table).update({
    credentials: sealOutlookValue(settings.key, purpose, next), updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("version", data.version).select("version").maybeSingle();
  if (result.error) throw new Error("Outlook connection unavailable");
  return result.data ? next.access : null;
}

async function graphList<T>(token: string, path: string, query: URLSearchParams, signal: AbortSignal) {
  let next: URL | null = new URL(`${graph}${path}?${query}`);
  const items: T[] = [];
  for (let page = 0; page < 6 && next; page++) {
    const response: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
      cache: "no-store", redirect: "error", signal,
    });
    if (!response.ok) throw new OutlookGraphError(response.status);
    const data: { value?: T[]; "@odata.nextLink"?: string } = await response.json();
    if (!Array.isArray(data.value)) throw new OutlookGraphError(502);
    items.push(...data.value);
    next = typeof data["@odata.nextLink"] === "string" ? new URL(data["@odata.nextLink"]) : null;
    if (next && (next.origin !== graph || next.pathname !== path || next.username || next.password || next.hash)) {
      throw new OutlookGraphError(502);
    }
  }
  return { items, partial: Boolean(next) };
}

type GraphMail = { id: string; subject?: string; isRead?: boolean; receivedDateTime?: string; webLink?: string; from?: { emailAddress?: { name?: string; address?: string } } };
type GraphCalendar = { id: string; name?: string };
type GraphEvent = { id: string; subject?: string; start?: { dateTime?: string }; end?: { dateTime?: string }; isAllDay?: boolean; isCancelled?: boolean; sensitivity?: string; webLink?: string; iCalUId?: string };
type MailItem = { id: string; title: string; sender: string; received: string; read: boolean; href: string | null };
export type OutlookEvent = { id: string; title: string; calendar: string; start: string; end: string; allDay: boolean; href: string | null };
export type OutlookCalendarItem = { id: string; name: string };
export type OutlookData = { status: "disabled" | "disconnected" | "reconnect" | "unavailable" } |
  { status: "mail"; items: MailItem[] } |
  { status: "calendar"; items: OutlookEvent[]; calendars: OutlookCalendarItem[]; partial: boolean };

export async function readOutlook(settings: Settings | null, userId: string, view: "mail" | "calendar", month?: string): Promise<OutlookData> {
  if (!settings) return { status: "disabled" };
  try {
    const token = await accessToken(settings, userId);
    if (!token) return { status: "disconnected" };
    if (view === "mail") {
      const response = await fetch(new URL("/v1.0/me/mailFolders/inbox/messages?$top=25&$select=id,subject,from,isRead,receivedDateTime,webLink&$orderby=receivedDateTime%20desc", graph), {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new OutlookGraphError(response.status);
      const data = await response.json() as { value: GraphMail[] };
      return { status: "mail", items: data.value.map((item) => ({
        id: item.id, title: item.subject || "(No subject)", sender: item.from?.emailAddress?.name || item.from?.emailAddress?.address || "Unknown sender",
        received: item.receivedDateTime || "", read: Boolean(item.isRead), href: outlookDeepLink(item.webLink),
      })) };
    }

    const calendarDeadline = AbortSignal.timeout(15_000);
    const all = await graphList<GraphCalendar>(token, "/v1.0/me/calendars", new URLSearchParams({ $select: "id,name", $top: "100" }), calendarDeadline);
    const calendars = [...new Map(all.items.filter((item) => item.id).map((item) => [item.id, { id: item.id, name: item.name || "Calendar" }])).values()];
    const { start, end } = outlookMonthWindow(month);
    const query = new URLSearchParams({ startDateTime: start, endDateTime: end,
      $select: "id,subject,start,end,isAllDay,isCancelled,sensitivity,webLink,iCalUId", $top: "100" });
    const items: OutlookEvent[] = [];
    let partial = all.partial;
    for (let offset = 0; offset < calendars.length; offset += 6) {
      if (calendarDeadline.aborted) { partial = true; break; }
      const rows = await Promise.allSettled(calendars.slice(offset, offset + 6).map(async (calendar) => {
        const listed = await graphList<GraphEvent>(token, `/v1.0/me/calendars/${encodeURIComponent(calendar.id)}/calendarView`, query, calendarDeadline);
        return { calendar, ...listed };
      }));
      for (const row of rows) {
        if (row.status === "rejected") { partial = true; continue; }
        partial ||= row.value.partial;
        for (const event of row.value.items) {
          if (!event.id || !event.start?.dateTime || event.isCancelled || event.iCalUId?.endsWith("@calendar.sitguru.com")) continue;
          items.push({ id: `${row.value.calendar.id}:${event.id}`, title: event.sensitivity === "private" ? "Private event" : event.subject || "(No title)",
            calendar: row.value.calendar.name, start: event.start.dateTime, end: event.end?.dateTime || event.start.dateTime,
            allDay: Boolean(event.isAllDay), href: outlookDeepLink(event.webLink) });
        }
      }
    }
    return { status: "calendar", items: items.sort((a, b) => a.start.localeCompare(b.start)), calendars, partial };
  } catch (error) {
    return { status: error instanceof OutlookGraphError && (error.status === 401 || error.status === 403) ? "reconnect" : "unavailable" };
  }
}
