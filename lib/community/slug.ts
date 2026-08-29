export function slugifyEventTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function buildEventSlug(title: string, suffix?: string) {
  const base = slugifyEventTitle(title) || "community-event";
  const tail = suffix?.replace(/[^a-z0-9-]/gi, "").slice(0, 8);

  return tail ? `${base}-${tail}` : base;
}

export function getPublicEventPath(slug: string) {
  return `/events/${slug}`;
}

export function getPublicEventUrl(slug: string, origin?: string) {
  const base = origin || "https://www.sitguru.com";
  return `${base.replace(/\/$/, "")}${getPublicEventPath(slug)}`;
}
