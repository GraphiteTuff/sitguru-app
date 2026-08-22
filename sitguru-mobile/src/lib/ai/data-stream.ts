/**
 * Vercel AI SDK data-stream client for React Native.
 *
 * The SitGuru companion routes (`/api/chat/send`, `/api/ai/officer-stream`)
 * answer with `text/plain` newline-delimited parts shaped `<typeId>:<json>`.
 * Only `0:` (text delta) and `3:` (stream error) drive the UI; annotation,
 * tool and finish parts are read and discarded so a future server part can
 * never corrupt the transcript.
 *
 * React Native's global `fetch` resolves `response.body` as undefined, so the
 * primary transport is Expo's WinterCG `fetch`, which exposes a real
 * ReadableStream. An XMLHttpRequest `onprogress` reader covers the case where
 * a runtime hands back a response with no readable body.
 */

import { fetch as expoFetch } from 'expo/fetch';

import { createUtf8StreamDecoder } from '@/lib/ai/text-codec';

const TEXT_DELTA_PART = '0';
const ERROR_PART = '3';

export type DataStreamTransport = 'expo-fetch' | 'xhr';

export type DataStreamHandlers = {
  /** Called for every `0:"..."` delta, in arrival order. */
  onTextDelta: (delta: string) => void;
  /** Called for `3:"..."` parts the server emits when generation breaks. */
  onStreamError?: (message: string) => void;
};

export type DataStreamParser = {
  /** Feed decoded text; partial trailing lines are buffered until completed. */
  push: (text: string) => void;
  /** Handle a final line that arrived without a trailing newline. */
  flush: () => void;
};

/** HTTP-level failure with a message that is safe to show in the transcript. */
export class CompanionStreamError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CompanionStreamError';
    this.status = status;
  }
}

/** Raised when a response arrives without a readable body, before any parse. */
class UnreadableStreamError extends Error {
  constructor() {
    super('This runtime returned a response without a readable body.');
    this.name = 'UnreadableStreamError';
  }
}

export function isAbortError(error: unknown) {
  if (!error) return false;
  if (typeof error === 'object' && 'name' in error) {
    return (error as { name?: unknown }).name === 'AbortError';
  }
  return false;
}

function abortError() {
  const error = new Error('Companion request cancelled.');
  error.name = 'AbortError';
  return error;
}

/**
 * Buffer newline-delimited data-stream parts across arbitrary chunk splits.
 */
export function createDataStreamParser(
  handlers: DataStreamHandlers,
): DataStreamParser {
  let buffer = '';

  function consumeLine(rawLine: string) {
    const line = rawLine.trim();
    if (!line) return;

    const separator = line.indexOf(':');
    // Protocol type ids are one or two characters ("0", "8", "a", "e", …).
    if (separator < 1 || separator > 2) return;

    const typeId = line.slice(0, separator);
    let value: unknown;

    try {
      value = JSON.parse(line.slice(separator + 1));
    } catch {
      return;
    }

    if (typeId === TEXT_DELTA_PART) {
      if (typeof value === 'string' && value) handlers.onTextDelta(value);
      return;
    }

    if (typeId === ERROR_PART) {
      handlers.onStreamError?.(
        typeof value === 'string' && value.trim()
          ? value.trim()
          : 'The companion stream ended early.',
      );
    }
  }

  return {
    push(text) {
      if (!text) return;
      buffer += text;

      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        consumeLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');
      }
    },
    flush() {
      const remainder = buffer;
      buffer = '';
      if (remainder) consumeLine(remainder);
    },
  };
}

export type CompanionStreamRequest = DataStreamHandlers & {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function requestHeaders(headers?: Record<string, string>) {
  return {
    Accept: 'text/plain',
    'Content-Type': 'application/json',
    ...(headers ?? {}),
  };
}

/** Turn an error payload from a non-2xx companion response into copy. */
function errorMessageFromBody(raw: string, status: number) {
  const trimmed = raw.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: unknown;
        message?: unknown;
      };
      const candidate = parsed.error ?? parsed.message;
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    } catch {
      // Fall through to the raw body below.
    }
  }

  if (trimmed) return trimmed.slice(0, 300);
  return `The companion service replied with ${status}.`;
}

async function streamWithExpoFetch(request: CompanionStreamRequest) {
  const response = await expoFetch(request.url, {
    method: 'POST',
    headers: requestHeaders(request.headers),
    body: JSON.stringify(request.body),
    signal: request.signal,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    throw new CompanionStreamError(
      errorMessageFromBody(raw, response.status),
      response.status,
    );
  }

  const body = response.body;
  if (!body) throw new UnreadableStreamError();

  const parser = createDataStreamParser(request);
  const decoder = createUtf8StreamDecoder();
  const reader = body.getReader();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.length) parser.push(decoder.decode(value));
    }

    parser.push(decoder.flush());
    parser.flush();
  } finally {
    reader.releaseLock();
  }
}

function streamWithXhr(request: CompanionStreamRequest) {
  return new Promise<void>((resolve, reject) => {
    const parser = createDataStreamParser(request);
    const xhr = new XMLHttpRequest();
    let deliveredLength = 0;
    let settled = false;

    function drain() {
      const text =
        typeof xhr.responseText === 'string' ? xhr.responseText : '';
      if (text.length <= deliveredLength) return;
      parser.push(text.slice(deliveredLength));
      deliveredLength = text.length;
    }

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      request.signal?.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else resolve();
    }

    function onAbort() {
      xhr.abort();
      finish(abortError());
    }

    xhr.open('POST', request.url, true);

    Object.entries(requestHeaders(request.headers)).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.onprogress = () => {
      // Streaming path: the response text grows while the model generates.
      if (xhr.status >= 200 && xhr.status < 300) drain();
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        drain();
        parser.flush();
        finish();
        return;
      }

      finish(
        new CompanionStreamError(
          errorMessageFromBody(xhr.responseText ?? '', xhr.status),
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      finish(new CompanionStreamError('Network request failed.', 0));
    };

    xhr.ontimeout = () => {
      finish(new CompanionStreamError('The companion request timed out.', 0));
    };

    if (request.signal) {
      if (request.signal.aborted) {
        finish(abortError());
        return;
      }
      request.signal.addEventListener('abort', onAbort);
    }

    xhr.send(JSON.stringify(request.body));
  });
}

/**
 * Stream one companion turn, reporting which transport produced the tokens.
 */
export async function streamCompanionResponse(
  request: CompanionStreamRequest,
): Promise<{ transport: DataStreamTransport }> {
  try {
    await streamWithExpoFetch(request);
    return { transport: 'expo-fetch' };
  } catch (error) {
    if (!(error instanceof UnreadableStreamError)) throw error;
  }

  await streamWithXhr(request);
  return { transport: 'xhr' };
}
