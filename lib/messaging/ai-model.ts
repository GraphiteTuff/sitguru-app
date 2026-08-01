/**
 * Shared Anthropic model resolver — edge-safe (no SDK imports).
 */

const DEFAULT_MODEL = "claude-sonnet-4-6";

export function getSitGuruAiModel(): string {
  return (
    String(process.env.ANTHROPIC_MODEL || "").trim() ||
    String(process.env.SITGURU_AI_MODEL || "").trim() ||
    DEFAULT_MODEL
  );
}

export function isSitGuruAiConfigured(): boolean {
  return Boolean(String(process.env.ANTHROPIC_API_KEY || "").trim());
}
