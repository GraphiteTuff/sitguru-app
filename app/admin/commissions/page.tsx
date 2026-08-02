import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      qs.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      qs.set(key, value[0]);
    }
  }

  const query = qs.toString();
  redirect(`/admin/financials/commissions${query ? `?${query}` : ""}`);
}
