import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { accountFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Accounts, Login & Profile Setup",
  description:
    "SitGuru signup, phone login codes, passwords, pet bios, and profile photos.",
};

export default function ProfilesAndLoginPage() {
  return (
    <HelpArticleChrome
      eyebrow="Account & Profiles"
      title="Accounts, login & profile setup"
      summary="Create your account, protect access with phone codes, and keep pet bios, profile photos, and Guru details up to date."
      backHref="/help/account"
      backLabel="Back to Account & Profiles"
    >
      <HelpFaqList items={accountFaqs} />
    </HelpArticleChrome>
  );
}
