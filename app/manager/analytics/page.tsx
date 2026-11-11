import { redirect } from "next/navigation";

/** Legacy analytics URL → Growth Center 2.0 Insights. */
export default function ManagerAnalyticsRedirect() {
  redirect("/manager/insights");
}
