/**
 * Text decoding helpers for the AI companion data stream.
 *
 * Hermes exposes TextDecoder, but the streaming parser and the base64
 * guru-card markers both run before any UI is on screen, so a hand-rolled
 * UTF-8 path keeps the chat readable on any engine that ships without it.
 */

type StreamingTextDecoder = {
  decode(input?: Uint8Array, options?: { stream?: boolean }): string;
};

type TextDecoderConstructor = new (label?: string) => StreamingTextDecoder;

const NativeTextDecoder = (
  globalThis as { TextDecoder?: TextDecoderConstructor }
).TextDecoder;

export type Utf8StreamDecoder = {
  /** Decode one chunk, holding back any bytes that split a code point. */
  decode(chunk: Uint8Array): string;
  /** Emit whatever is left once the stream closes. */
  flush(): string;
};

function continuationLength(byte: number) {
  if (byte < 0x80) return 0;
  if (byte >= 0xc2 && byte <= 0xdf) return 1;
  if (byte >= 0xe0 && byte <= 0xef) return 2;
  if (byte >= 0xf0 && byte <= 0xf4) return 3;
  return -1;
}

function createManualUtf8StreamDecoder(): Utf8StreamDecoder {
  let pending: number[] = [];

  function decodeBytes(bytes: number[], allowPartial: boolean) {
    let output = '';
    let index = 0;

    while (index < bytes.length) {
      const lead = bytes[index]!;
      const extra = continuationLength(lead);

      if (extra < 0) {
        output += '\uFFFD';
        index += 1;
        continue;
      }

      if (index + extra >= bytes.length) {
        if (allowPartial) {
          pending = bytes.slice(index);
          return output;
        }
        output += '\uFFFD';
        return output;
      }

      let codePoint = extra === 0 ? lead : lead & (0x7f >> (extra + 1));

      for (let offset = 1; offset <= extra; offset += 1) {
        codePoint = (codePoint << 6) | (bytes[index + offset]! & 0x3f);
      }

      output += String.fromCodePoint(codePoint);
      index += extra + 1;
    }

    return output;
  }

  return {
    decode(chunk) {
      const bytes = pending.length
        ? [...pending, ...Array.from(chunk)]
        : Array.from(chunk);
      pending = [];
      return decodeBytes(bytes, true);
    },
    flush() {
      if (!pending.length) return '';
      const leftover = pending;
      pending = [];
      return decodeBytes(leftover, false);
    },
  };
}

/** Incremental UTF-8 decoder that survives chunks splitting a code point. */
export function createUtf8StreamDecoder(): Utf8StreamDecoder {
  if (!NativeTextDecoder) return createManualUtf8StreamDecoder();

  const decoder = new NativeTextDecoder('utf-8');

  return {
    decode: (chunk) => decoder.decode(chunk, { stream: true }),
    flush: () => decoder.decode(),
  };
}

export function decodeUtf8(bytes: Uint8Array): string {
  const decoder = createUtf8StreamDecoder();
  return `${decoder.decode(bytes)}${decoder.flush()}`;
}

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decode a base64 / base64url payload without relying on a global `atob`.
 * Returns null when the payload is truncated or contains stray characters,
 * which happens when a model clips a long `[[guru_card:...]]` marker.
 */
export function decodeBase64UrlToUtf8(payload: string): string | null {
  const normalized = String(payload || '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '');

  if (!normalized) return null;

  const bytes: number[] = [];
  let accumulator = 0;
  let bitsHeld = 0;

  for (const character of normalized) {
    const value = BASE64_ALPHABET.indexOf(character);
    if (value < 0) return null;

    accumulator = (accumulator << 6) | value;
    bitsHeld += 6;

    if (bitsHeld >= 8) {
      bitsHeld -= 8;
      bytes.push((accumulator >> bitsHeld) & 0xff);
    }
  }

  if (!bytes.length) return null;

  return decodeUtf8(Uint8Array.from(bytes));
}
