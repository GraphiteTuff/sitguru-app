import { createHash } from "crypto";

export { checkRecordVersion, STALE_RECORD_MESSAGE } from "@/lib/realtime/concurrency";
export type { RecordVersionInput, RecordVersionResult } from "@/lib/realtime/concurrency";

/** Deduplicate UUID recipients; drop empties. */
export function uniqueUserIds(ids: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Deterministic event id for idempotent retries (req 99). */
export function stableEventId(parts: Array<string | null | undefined>): string {
  return createHash("sha256")
    .update(parts.map((part) => String(part || "")).join("|"))
    .digest("hex")
    .slice(0, 40);
}
