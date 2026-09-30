import type { Metadata } from "next";
import { CredentialHelpArticle } from "@/lib/help/credential-articles";

export const metadata: Metadata = {
  title: "Professional Memberships & Certifications",
  description: "PSI membership, CPPS, and other professional credentials on SitGuru.",
};

export default function MembershipsHelpPage() {
  return (
    <CredentialHelpArticle
      title="Professional Memberships & Certifications"
      summary="Recognized memberships and certifications can be added as optional highlights."
    >
      <p>A Guru can add Pet Sitters International membership or a Certified Professional Pet Sitter credential earned through Pet Sitters International. SitGuru does not award those credentials.</p>
      <p>Other pet-care education, such as fear-free handling or senior pet care training, can be submitted as another professional credential. Those stay in review until an admin approves them.</p>
      <p>Logos appear only when SitGuru has marked a logo as authorized. Until then, the provider name is plain text.</p>
    </CredentialHelpArticle>
  );
}
