import { isPubliclyVisibleGuruProfile } from "@/lib/gurus/public-visibility";

type GuruRow = Record<string, unknown>;

export type PromotableGuru = {
  id: string;
  name: string;
  detail: string;
  href: string;
  imageUrl: string;
  market: string;
  badges: string[];
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function serviceLabel(row: GuruRow) {
  if (Array.isArray(row.services) && row.services.length) {
    return String(row.services[0] || "").trim() || "Pet care";
  }
  return text(row.specialty) || text(row.title) || "Pet care";
}

function bookableState(row: GuruRow) {
  if (row.is_bookable === false || row.is_accepting_bookings === false || row.accepting_bookings === false) {
    return "hidden";
  }
  if (row.is_bookable === true || row.is_accepting_bookings === true || row.accepting_bookings === true) {
    return "bookable";
  }
  return "unknown";
}

function displayName(row: GuruRow) {
  return text(row.display_name) || text(row.full_name) || text(row.name);
}

export function selectPromotableGurus(rows: GuruRow[]): PromotableGuru[] {
  const visible = rows.filter((row) => {
    if (row.is_archived === true || row.is_test_account === true || row.is_active === false) return false;
    const status = text(row.status).toLowerCase();
    if (["inactive", "suspended", "rejected", "archived", "deleted"].includes(status)) return false;
    const application = text(row.application_status).toLowerCase();
    if (["profile_incomplete", "needs_setup", "incomplete"].includes(application)) return false;
    if (!displayName(row)) return false;
    if (bookableState(row) === "hidden") return false;
    return isPubliclyVisibleGuruProfile(row);
  });

  const byUser = new Map<string, GuruRow>();
  const standalone: GuruRow[] = [];
  for (const row of visible) {
    const userId = text(row.user_id);
    if (!userId) {
      standalone.push(row);
      continue;
    }
    const previous = byUser.get(userId);
    if (!previous || text(row.updated_at) >= text(previous.updated_at)) byUser.set(userId, row);
  }

  return [...byUser.values(), ...standalone].map((row) => {
    const name = displayName(row);
    const city = text(row.service_city) || text(row.city);
    const state = text(row.service_state) || text(row.state);
    const slug = text(row.slug);
    const updated = text(row.updated_at).slice(0, 10);
    const badges = [
      serviceLabel(row),
      bookableState(row) === "bookable" ? "Bookable" : "Public profile",
      text(row.public_status) ? `Profile ${text(row.public_status).replaceAll("_", " ")}` : "",
      updated ? `Updated ${updated}` : "",
    ].filter(Boolean);

    return {
      id: text(row.id),
      name,
      detail: text(row.headline) || serviceLabel(row),
      href: slug ? `/guru/${slug}` : "/gurus",
      imageUrl:
        text(row.profile_photo_url) ||
        text(row.image_url) ||
        text(row.photo_url) ||
        text(row.avatar_url),
      market: [city, state].filter(Boolean).join(", "),
      badges,
    };
  });
}
