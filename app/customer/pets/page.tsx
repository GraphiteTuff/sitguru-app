import { redirect } from "next/navigation";

/** Pet passports live on the customer Multi-Pet Profile Center. */
export default function CustomerPetsRedirectPage() {
  redirect("/customer/dashboard#multi-pet-center");
}
