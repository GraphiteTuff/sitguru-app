const PUBLIC_ORIGIN = "https://www.sitguru.com";

export function guruPublicPath(slug: string) {
  const safe = String(slug || "").trim();
  if (!/^[a-z0-9-]{2,80}$/i.test(safe)) return "";
  return `/guru/${encodeURIComponent(safe)}`;
}

export function guruPublicUrl(slug: string) {
  const path = guruPublicPath(slug);
  return path ? `${PUBLIC_ORIGIN}${path}` : "";
}

export function guruPromoCaption(input: {
  name: string;
  location: string;
  services: string[];
  url: string;
}) {
  const name = input.name.trim() || "a local pet-care provider";
  const area = input.location.trim();
  const services = input.services.map((service) => service.trim()).filter(Boolean);
  const serviceLine = services.length
    ? `I offer ${services.slice(0, 4).join(", ")}.`
    : "I offer pet care through SitGuru.";
  const where = area ? ` serving ${area}` : "";
  return [
    `Hi neighbors! I'm ${name}, a local pet-care provider on SitGuru${where}.`,
    serviceLine,
    "Visit my profile and book through SitGuru.",
    input.url,
  ].filter(Boolean).join("\n\n");
}
