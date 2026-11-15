import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Historical Finance URL stays valid but has no second data/approval workflow.
 * All contractor hours, approvals and confirmed bank ACH records are managed
 * in the canonical Admin HQ People / Payments workspace.
 */
export default async function ContractorFinanceRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const input = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  for (const key of ["ok", "error"]) {
    const value = input[key];
    const text = Array.isArray(value) ? value[0] : value;
    if (text) params.set(key, text);
  }
  const query = params.size ? `?${params.toString()}` : "";
  redirect(`/admin/hr/people/payments${query}#approvals`);
}
