import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "support" || key === "admin") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) query.append(key, item);
      });
      return;
    }

    query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export default async function CustomerDashboardMessagesPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const queryString = buildQueryString(params);

  if (params.support === "admin" || params.admin === "true") {
    redirect(`/messages/admin${queryString}`);
  }

  redirect(`/messages${queryString}`);
}
