import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Account & Profiles",
  description:
    "SitGuru signup, login codes, pet bios, profile photos, and Guru approval.",
};

export default function AccountHubPage() {
  return (
    <HelpCategoryHub
      category="Account & Profiles"
      title="Account & Profiles"
      description="Signup, login, pet bios, profile photos, and onboarding for every role."
    />
  );
}
