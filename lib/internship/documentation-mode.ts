/**
 * Local/test intern-guide screenshots only.
 * Never enable this in production, Vercel production, or Vercel preview.
 */
export function internDocumentationModeEnabled() {
  if (process.env.INTERN_DOCUMENTATION_MODE !== "true") return false;
  if (process.env.NODE_ENV === "production") return false;
  const vercelEnv = String(
    process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "",
  ).toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") return false;
  if (process.env.VERCEL === "1" && vercelEnv !== "development") return false;
  return true;
}

export const INTERN_DOCUMENTATION_SCENES = [
  "default",
  "checkin-form",
  "awaiting",
  "approved",
] as const;

export type InternDocumentationScene =
  (typeof INTERN_DOCUMENTATION_SCENES)[number];

export function internDocumentationScene(
  value: string | null | undefined,
): InternDocumentationScene {
  const scene = String(value || "default").trim().toLowerCase();
  return INTERN_DOCUMENTATION_SCENES.includes(scene as InternDocumentationScene)
    ? (scene as InternDocumentationScene)
    : "default";
}
