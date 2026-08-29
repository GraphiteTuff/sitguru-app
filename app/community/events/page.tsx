import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Public event browsing lives only on `/community` (map + search hub).
 * Keep `/community/events/[slug]` for event detail.
 */
export default async function CommunityEventsListRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) {
        query.set(key, value);
      } else if (Array.isArray(value) && value[0]) {
        query.set(key, value[0]);
      }
    }
  }

  const qs = query.toString();
  redirect(qs ? `/community?${qs}` : "/community");
}
