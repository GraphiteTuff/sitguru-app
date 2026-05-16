import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminCommissionsRedirectPage() {
  redirect("/admin/financials/commissions");
}
