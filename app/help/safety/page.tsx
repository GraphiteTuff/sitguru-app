import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description:
    "Compliance, emergency guidance, incident reports, reviews, and SitGuru programs.",
};

export default function SafetyHubPage() {
  return (
    <HelpCategoryHub
      category="Trust & Safety"
      title="Trust & Safety"
      description="Compliance, emergency guidance, incident reports, reviews, and program pathways."
    />
  );
}
