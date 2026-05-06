import { redirect } from "next/navigation";

export default function AdminExportsRedirectPage() {
  redirect("/admin/financials/exports");
}
