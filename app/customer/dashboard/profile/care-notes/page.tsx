import { redirect } from "next/navigation";

/**
 * Household care notes now live per-pet (feeding_routine, potty_routine,
 * medical_notes, behavior fields) on the Multi-Pet Profile Center.
 */
export default function CareNotesRedirectPage() {
  redirect("/customer/dashboard#multi-pet-center");
}
