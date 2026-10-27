import { redirect } from "next/navigation";

/** Ava's help lives on the Manager Desk, not Admin HQ. */
export default function ManagerHelpRedirect() {
  redirect("/manager/help");
}
