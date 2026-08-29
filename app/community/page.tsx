import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toQuery(
  params?: Record<string, string | string[] | undefined>,
) {
  const query = new URLSearchParams();
  if (!params) return "";
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Legacy `/community` hub → `/events` */
export default async function CommunityHubRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  redirect(`/events${toQuery(params)}`);
}
