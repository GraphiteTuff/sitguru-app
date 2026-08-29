import { redirect } from "next/navigation";

/** Legacy host hub → `/events/host` */
export default function CommunityHostRedirect() {
  redirect("/events/host");
}
