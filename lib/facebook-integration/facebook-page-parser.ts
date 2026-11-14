/** Strictly normalizes Facebook Page fields from the official Meta Graph API. */
export type FacebookPageDetails = {
  id: string;
  name: string;
  followersCount: number | null;
  likesCount: number | null;
};

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

export function parseFacebookPageDetails(
  payload: unknown,
  expectedPageId: string,
): FacebookPageDetails {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Meta returned an invalid Page response.");
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.id !== "string" || data.id !== expectedPageId) {
    throw new Error("The Facebook Page ID did not match the configured Page.");
  }
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new Error("Meta did not return the Facebook Page name.");
  }
  return {
    id: data.id,
    name: data.name.trim(),
    // Never treat an unavailable API field as zero.
    followersCount: nonNegativeInteger(data.followers_count),
    likesCount: nonNegativeInteger(data.fan_count),
  };
}
