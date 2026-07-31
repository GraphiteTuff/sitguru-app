import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Booking & Cancellations",
  description:
    "Schedules, holiday surge, cancellations, rebooking, and live care updates.",
};

export default function BookingHubPage() {
  return (
    <HelpCategoryHub
      category="Booking & Cancellations"
      title="Booking & Cancellations"
      description="Schedules, surge pricing, cancel/rebook flows, and automated live care updates."
    />
  );
}
