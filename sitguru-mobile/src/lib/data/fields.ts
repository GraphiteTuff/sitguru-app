export type RecordRow = Record<string, unknown>;

export function asId(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

export function asNullableString(value: unknown): string | null {
  const text = asString(value);
  return text || null;
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return null;
}

export function firstString(
  row: RecordRow | null | undefined,
  keys: readonly string[],
  fallback = '',
): string {
  if (!row) return fallback;
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

export function firstId(
  row: RecordRow | null | undefined,
  keys: readonly string[],
): string {
  return firstString(row, keys);
}

export function normalizeStatus(value: unknown): string {
  return asString(value).toLowerCase().replace(/\s+/g, '_');
}

export function getMissingColumnName(errorMessage: string): string | null {
  const quoted = errorMessage.match(/'([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];

  const missing = errorMessage.match(/column "([^"]+)" does not exist/i);
  if (missing?.[1]) return missing[1];

  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

/**
 * Retry an insert/update after stripping unknown columns (web booking create pattern).
 */
export async function withMissingColumnRetry<T>(
  run: (payload: RecordRow) => Promise<{ data: T | null; error: unknown }>,
  initialPayload: RecordRow,
  maxAttempts = 40,
): Promise<{ data: T | null; error: string | null }> {
  const payload = { ...initialPayload };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await run(payload);
    if (!result.error) {
      return { data: result.data, error: null };
    }

    const message = getErrorMessage(result.error);
    const missing = getMissingColumnName(message);
    if (!missing || !(missing in payload)) {
      return { data: null, error: message };
    }

    delete payload[missing];
  }

  return {
    data: null,
    error: 'Too many missing-column retries while saving.',
  };
}
