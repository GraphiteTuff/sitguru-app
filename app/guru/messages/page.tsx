import { redirect } from "next/navigation";

export default function GuruMessagesRedirectPage() {
  redirect("/messages?role=guru&returnTo=/guru/dashboard");
}
