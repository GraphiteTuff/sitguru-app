import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { bookingFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Bookings, Schedules & Cancellations",
  description:
    "How SitGuru requests, schedules, holiday surge, cancellations, and rebooking work.",
};

export default function BookingRequestsPage() {
  return (
    <HelpArticleChrome
      eyebrow="Booking & Cancellations"
      title="Bookings, schedules & cancellations"
      summary="Keep care requests, schedules, cancel/rebook flows, and service notes organized in one place."
      backHref="/help/booking"
      backLabel="Back to Booking & Cancellations"
    >
      <HelpFaqList items={bookingFaqs} />
    </HelpArticleChrome>
  );
}
