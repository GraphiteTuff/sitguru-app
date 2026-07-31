import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Pet Parent Support",
  description: "Help articles for SitGuru Pet Parents and PawReport Live.",
};

export default function ParentHelpHubPage() {
  return (
    <HelpCategoryHub
      category="Pet Parent Support"
      title="Pet Parent Support"
      description="Live tracking, push alerts, PawReport emails, finding a Guru, and visit history."
    />
  );
}
