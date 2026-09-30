import type { Metadata } from "next";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Trust & Credentials",
  description:
    "Optional Guru credentials, what Verified by SitGuru means, and how private documents stay private.",
};

export default function TrustCredentialsHelpHubPage() {
  return (
    <HelpCategoryHub
      category="Trust & Credentials"
      title="Trust & Credentials"
      description="Optional professional highlights Gurus can add. Credentials are a bonus, not a requirement to use SitGuru."
    />
  );
}
