import { Platform } from 'react-native';

import { getErrorMessage } from '@/lib/data/fields';
import { PERF_BASELINES, markPerf } from '@/lib/perf/baselines';
import { getSupabaseAccessToken } from '@/lib/supabase';

const API_TIMEOUT_MS = 8_000;
const GET_CACHE_TTL_MS = 20_000;

type CacheEntry = {
  expiresAt: number;
  result: SitGuruApiResult<unknown>;
};

const getCache = new Map<string, CacheEntry>();

function readGetCache(key: string): SitGuruApiResult<unknown> | null {
  const entry = getCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    getCache.delete(key);
    return null;
  }
  return entry.result;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

/**
 * SitGuru web/API origin used for privileged mutations that must match
 * desktop (service-role writes after auth). Never put the service role here.
 */
const SITGURU_WEB_ORIGIN_FALLBACK = 'https://www.sitguru.com';

export function getSitGuruApiBaseUrl(): string {
  const candidates = [
    process.env.EXPO_PUBLIC_SITGURU_API_URL,
    process.env.EXPO_PUBLIC_SITGURU_WEB_URL,
    process.env.EXPO_PUBLIC_APP_URL,
    process.env.EXPO_PUBLIC_SITE_URL,
  ];

  const selected = candidates
    .map((value) => value?.trim())
    .find(Boolean);

  return normalizeBaseUrl(selected || SITGURU_WEB_ORIGIN_FALLBACK);
}

export async function getAccessToken(): Promise<string | null> {
  return getSupabaseAccessToken();
}

export type SitGuruApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

type SitGuruApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Defaults to true — privileged routes require Bearer. */
  auth?: boolean;
  idempotencyKey?: string;
  timeoutMs?: number;
};

export async function sitguruApiFetch<T = unknown>(
  path: string,
  options: SitGuruApiOptions = {},
): Promise<SitGuruApiResult<T>> {
  const baseUrl = getSitGuruApiBaseUrl();

  if (!baseUrl) {
    return {
      data: null,
      error:
        'Add EXPO_PUBLIC_SITGURU_API_URL or EXPO_PUBLIC_SITGURU_WEB_URL so mobile can call the same SitGuru APIs as web.',
      status: 0,
    };
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-SitGuru-Client': 'sitguru-mobile',
    'X-SitGuru-Platform': Platform.OS,
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (!token) {
      return {
        data: null,
        error: 'Sign in required for this SitGuru action.',
        status: 401,
      };
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http')
    ? path
    : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  const cacheKey =
    method === 'GET' && options.body === undefined
      ? `${headers.Authorization?.slice(-16) || 'anon'}:${url}`
      : '';

  if (cacheKey) {
    const cached = readGetCache(cacheKey);
    if (cached) return cached as SitGuruApiResult<T>;
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? API_TIMEOUT_MS),
    });

    const text = await response.text();
    let parsed: unknown = null;

    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { message: text };
      }
    }

    if (!response.ok) {
      const message =
        getErrorMessage(
          typeof parsed === 'object' && parsed
            ? (parsed as { error?: unknown; message?: unknown }).error ??
                (parsed as { message?: unknown }).message
            : parsed,
          `Request failed (${response.status})`,
        );

      return {
        data: null,
        error: message,
        status: response.status,
      };
    }

    const result = {
      data: parsed as T,
      error: null,
      status: response.status,
    };

    markPerf(`api ${method} ${path}`, startedAt, PERF_BASELINES.apiLatencyMs.warn);

    if (cacheKey) {
      getCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        result,
      });
    }

    return result;
  } catch (error) {
    markPerf(`api ${method} ${path}`, startedAt, PERF_BASELINES.apiLatencyMs.warn);
    const timedOut =
      error instanceof Error &&
      (error.name === 'TimeoutError' || /timeout|aborted/i.test(error.message));

    return {
      data: null,
      error: getErrorMessage(
        error,
        timedOut
          ? 'SitGuru took too long to respond. Try again in a moment.'
          : 'Network request failed.',
      ),
      status: 0,
    };
  }
}
