import { Platform } from 'react-native';

import { getErrorMessage } from '@/lib/data/fields';
import { getSupabaseAccessToken } from '@/lib/supabase';

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

/**
 * SitGuru web/API origin used for privileged mutations that must match
 * desktop (service-role writes after auth). Never put the service role here.
 */
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

  return selected ? normalizeBaseUrl(selected) : '';
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

  try {
    const response = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
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

    return {
      data: parsed as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, 'Network request failed.'),
      status: 0,
    };
  }
}
