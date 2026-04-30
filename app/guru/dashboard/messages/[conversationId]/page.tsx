import { redirect } from "next/navigation";

export default function GuruDashboardConversationRedirectPage() {
  redirect("/guru/dashboard/messages");
}