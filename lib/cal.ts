const CAL_API_BASE = "https://api.cal.com/v2";

const calApiKey = process.env.CAL_API_KEY;

if (!calApiKey) {
  throw new Error("Missing CAL_API_KEY");
}

export const CAL_SLOTS_VERSION =
  process.env.CAL_API_VERSION_SLOTS ?? "2024-09-04";

export const CAL_BOOKINGS_VERSION =
  process.env.CAL_API_VERSION_BOOKINGS ?? "2026-02-25";

type CalMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function calRequest<T>(
  path: string,
  method: CalMethod,
  version: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${CAL_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${calApiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": version,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();

  let json: unknown = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Cal.com request failed (${response.status}): ${JSON.stringify(json)}`
    );
  }

  return json as T;
}

export async function calGet<T>(path: string, version: string): Promise<T> {
  return calRequest<T>(path, "GET", version);
}

export async function calPost<T>(
  path: string,
  version: string,
  body: unknown
): Promise<T> {
  return calRequest<T>(path, "POST", version, body);
}
