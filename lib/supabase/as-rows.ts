/**
 * Normalize untyped / dynamic Supabase `.from(table)` results.
 * Dynamic table names resolve to GenericStringError[], which cannot cast
 * directly to Record<string, unknown>[].
 */
export type AnyRow = Record<string, unknown>;

export function asAnyRows(data: unknown): AnyRow[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is AnyRow =>
      typeof row === "object" && row !== null && !Array.isArray(row),
  );
}
