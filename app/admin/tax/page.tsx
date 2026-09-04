import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminTaxAliasPage() {
  redirect("/admin/financials/tax-reports");
}
