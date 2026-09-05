export async function fetchInternPortalAccess() {
  try {
    const response = await fetch("/api/internship/access", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { intern?: boolean };
    return payload.intern === true;
  } catch {
    return false;
  }
}
