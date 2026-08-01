import { redirect } from "next/navigation";

/** Pet Passports are managed on the dashboard Multi-Pet Profile Center. */
export default function DashboardPetsRedirectPage() {
  redirect("/customer/dashboard#multi-pet-center");
}
