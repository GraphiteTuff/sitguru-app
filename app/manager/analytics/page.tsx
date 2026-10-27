import { redirect } from "next/navigation";

export default function ManagerAnalyticsRedirect() {
  redirect("/manager/reports");
}
