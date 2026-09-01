import DashboardPetAnchorRedirect from "@/components/customer/DashboardPetAnchorRedirect";

/**
 * Household care notes now live per-pet (feeding_routine, potty_routine,
 * medical_notes, behavior fields) on the Multi-Pet Profile Center.
 */
export default function CareNotesRedirectPage() {
  return <DashboardPetAnchorRedirect hash="multi-pet-center" />;
}
