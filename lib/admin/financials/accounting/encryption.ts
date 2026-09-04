import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "v1";
const AES_KEY_BYTES = 32;

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * SitGuru-generated secret. Wave/Intuit never issue this value.
 *
 * Canonical format: 32 random bytes, standard Base64
 * (PowerShell: [Convert]::ToBase64String of 32 RNG bytes).
 *
 * Also accepted:
 * - 64-char hex (32 bytes)
 * - any other passphrase, SHA-256 hashed to 32 bytes
 */
export function resolveAccountingEncryptionKey(material: string) {
  const trimmed = asTrimmed(material);
  if (!trimmed) {
    throw new Error("ACCOUNTING_TOKEN_ENCRYPTION_KEY is empty.");
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const asBase64 = Buffer.from(trimmed, "base64");
  if (asBase64.length === AES_KEY_BYTES) {
    return asBase64;
  }

  return createHash("sha256").update(trimmed).digest();
}

export function getAccountingEncryptionKey(explicit?: string) {
  const fromEnv =
    asTrimmed(explicit) ||
    asTrimmed(process.env.ACCOUNTING_TOKEN_ENCRYPTION_KEY);
  const material =
    fromEnv ||
    `sitguru-accounting:${asTrimmed(process.env.SUPABASE_SERVICE_ROLE_KEY) || "local-dev-only"}`;
  return resolveAccountingEncryptionKey(material);
}

export function encryptSecret(plain: string, keyMaterial?: string) {
  const text = asTrimmed(plain);
  if (!text) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getAccountingEncryptionKey(keyMaterial), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string, keyMaterial?: string) {
  const raw = asTrimmed(payload);
  if (!raw) return "";
  const [version, ivPart, tagPart, dataPart] = raw.split(":");
  if (version !== PREFIX || !ivPart || !tagPart || !dataPart) {
    throw new Error("Unrecognized encrypted accounting secret.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getAccountingEncryptionKey(keyMaterial),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function looksEncrypted(value: string) {
  return asTrimmed(value).startsWith(`${PREFIX}:`);
}
