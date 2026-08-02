import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VeteransHireRedirectPage() {
  redirect("/admin/programs/military-hire");
}
