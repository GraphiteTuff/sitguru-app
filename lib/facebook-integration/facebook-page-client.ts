import { parseFacebookPageDetails } from "./facebook-page-parser";

export async function fetchFacebookPageDetails() {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim() || "";
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || "";
  if (!/^\d+$/.test(pageId) || !token) {
    throw new Error("Facebook Page ID or Page access token is not configured.");
  }
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v24.0";
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("Invalid Meta Graph API version.");
  const url = new URL("https://graph.facebook.com/" + version + "/" + pageId);
  url.searchParams.set("fields", "id,name,followers_count,fan_count");
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Unable to reach Meta Graph API.");
  }
  if (!response.ok) {
    throw new Error("Meta Page API returned HTTP " + response.status + ". Check token and Page permissions.");
  }
  return parseFacebookPageDetails(await response.json() as unknown, pageId);
}
