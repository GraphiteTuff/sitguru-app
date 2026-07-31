import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Guru Success & Training Hub",
  description: "Training articles for SitGuru Gurus publishing live walks.",
};

export default function GuruHelpHubPage() {
  return (
    <HelpCategoryHub
      category="Guru Success & Training Hub"
      title="Guru Success & Training Hub"
      description="Phone-first walk publishing, GPS tips, pricing, and battery-safe tracking."
    />
  );
}
