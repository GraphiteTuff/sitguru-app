import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy list URL → `/events` hub */
export default async function CommunityEventsListRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) query.set(key, value);
      else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
    }
  }
  const qs = query.toString();
  redirect(qs ? `/events?${qs}` : "/events");
}
