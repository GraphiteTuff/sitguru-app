import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type FindCareRedirectPageProps = {
  searchParams?: SearchParams;
};

function buildSearchQuery(
  params: Record<string, string | string[] | undefined> | undefined,
) {
  if (!params) return "";

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) query.append(key, item);
      });

      return;
    }

    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export default async function FindCareRedirectPage({
  searchParams,
}: FindCareRedirectPageProps) {
  const resolvedSearchParams = await searchParams;
  const queryString = buildSearchQuery(resolvedSearchParams);

  redirect(`/search${queryString}`);
}