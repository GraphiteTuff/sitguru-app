import { redirect } from "next/navigation";

export default function CustomerDashboardBookingsRedirectPage() {
  redirect("/bookings");
}
