export type PromotionKind = "reads" | "events" | "community" | "surveys" | "brand";

export function publishedReadsPath(type: string, slug: string): string | null {
  if (!slug || slug.length > 180 || /[/?#\\]/.test(slug)) return null;
  const section: Record<string, string> = {
    book: "books", magazine: "magazines", podcast: "podcasts",
    video: "videos", author: "authors", expert: "authors", publication: "magazines",
  };
  const name = section[type];
  return name ? "/reads/" + name + "/" + encodeURIComponent(slug) : null;
}

function safeInternalUrl(input: string): string {
  // No external redirects, protocol-relative URLs or javascript schemes.
  const value = input.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return "/";
  }
  return value;
}

export function promoCampaignHref(source: { title: string; destination: string; kind: PromotionKind }) {
  const query = new URLSearchParams({
    type: source.kind === "events" ? "event" : "post",
    title: source.title.slice(0, 150),
    dest: safeInternalUrl(source.destination),
    href: safeInternalUrl(source.destination),
  });
  return "/manager/create?" + query.toString();
}