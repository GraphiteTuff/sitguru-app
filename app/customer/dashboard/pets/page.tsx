import { redirect } from "next/navigation";

export default function CustomerDashboardPetsRedirectPage() {
  redirect("/customer/pets");
}