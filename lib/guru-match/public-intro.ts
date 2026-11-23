/** Pure presentation helpers for the public, tracked Guru introduction page. */

export function guruFirstName(name: string): string {
  const first = String(name || "").trim().split(/\s+/u)[0]?.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || "";
  if (!first) return "your Guru";
  return first.charAt(0).toLocaleUpperCase("en-US") + first.slice(1);
}

/**
 * Display an excerpt of the Guru's own public bio. Do not construct an
 * invented testimonial or claim any particular service, certification, or
 * availability. An empty result signals that the page should show a neutral
 * invitation to read their profile.
 */
export function guruPublicIntro(bio: string | null | undefined, firstName: string): string | null {
  let value = String(bio || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!value || /this guru is building|profile setup in progress|more details about their care style/i.test(value)) {
    return null;
  }
  // The page already says "Hi, I'm Kara!", so remove an identical greeting
  // at the beginning of her actual biography instead of displaying it twice.
  const escaped = firstName.replace(/[^\p{L}\p{N}]/gu, "\\$&");
  const introduction = new RegExp(
    "^(?:(?:hi|hello|hey)(?:\\s+there)?[\\s!,.]*)?(?:i\\s*(?:['’]m|am)|my\\s+name\\s+is)\\s+" + escaped + "\\s*[!.,:;\\-]+\\s*",
    "i"
  );
  value = value.replace(introduction, "").trim();
  if (!value) return null;
  value = value.replace(/\bi(?=[\s'’])/g, "I").replace(/^(\p{Ll})/u, letter => letter.toLocaleUpperCase("en-US"));
  const limit = 265;
  if (value.length > limit) {
    const lastSpace = value.lastIndexOf(" ", limit);
    value = value.slice(0, lastSpace >= limit - 35 ? lastSpace : limit)
      .replace(/[\s,;:.!?-]+$/u, "") + "…";
  }
  return value;
}
