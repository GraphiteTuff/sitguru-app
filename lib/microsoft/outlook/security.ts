import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type OutlookPortal = "intern" | "manager";
export type OutlookFlow = { userId: string; portal: OutlookPortal; state: string; verifier: string; expires: number };
export const OUTLOOK_FLOW_COOKIE = "sitguru_outlook_flow";
export const OUTLOOK_FLOW_SECONDS = 600;

export function outlookPortal(value: unknown): OutlookPortal | null {
  return value === "intern" || value === "manager" ? value : null;
}

export function outlookSettings(env = process.env) {
  const tenant = env.MICROSOFT_OUTLOOK_TENANT_ID?.trim() || "";
  const client = env.MICROSOFT_OUTLOOK_CLIENT_ID?.trim() || "";
  const secret = env.MICROSOFT_OUTLOOK_CLIENT_SECRET;
  const key = Buffer.from(env.MICROSOFT_OUTLOOK_ENCRYPTION_KEY || "", "base64");
  if (env.SITGURU_OUTLOOK_ENABLED !== "true" || !/^[a-zA-Z0-9.-]+$/.test(tenant) || !client || !secret || key.length !== 32) return null;
  let callback: URL;
  try { callback = new URL(env.MICROSOFT_OUTLOOK_REDIRECT_URI || ""); } catch { return null; }
  if (callback.protocol !== "https:" || callback.pathname !== "/api/internship/outlook/callback" ||
      callback.username || callback.password || callback.search || callback.hash) return null;
  return { tenant, client, secret, key, callback };
}

export function sealOutlookValue(key: Buffer, purpose: string, value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64url")).join(".");
}

export function openOutlookValue<T>(key: Buffer, purpose: string, value: string): T | null {
  try {
    const [iv, tag, body] = value.split(".").map((part) => Buffer.from(part, "base64url"));
    const cipher = createDecipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(Buffer.from(purpose));
    cipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

export const outlookSecret = () => randomBytes(32).toString("base64url");
export const outlookHash = (secret: string) => createHash("sha256").update(secret).digest("hex");

export function checkedOutlookFlow(flow: OutlookFlow | null, userId: string, state: string | null, now = Date.now()) {
  return flow && flow.userId === userId && state === flow.state &&
    flow.expires > now && outlookPortal(flow.portal) ? flow : null;
}

export function outlookDeepLink(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !["outlook.office.com", "outlook.office365.com", "outlook.live.com"].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
