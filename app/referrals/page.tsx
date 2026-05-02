// app/referrals/page.tsx
import { redirect } from "next/navigation";

export default function ReferralsRedirectPage() {
  redirect("/customer/dashboard/pawperks");
}
