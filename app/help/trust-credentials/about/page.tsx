import type { Metadata } from "next";
import { CredentialHelpArticle } from "@/lib/help/credential-articles";

export const metadata: Metadata = {
  title: "About SitGuru Verified Credentials",
  description: "Credentials are optional highlights on a Guru profile.",
};

export default function AboutVerifiedCredentialsPage() {
  return (
    <CredentialHelpArticle
      title="About SitGuru Verified Credentials"
      summary="Credentials help Pet Parents learn more. They do not decide whether a Guru can use SitGuru."
    >
      <p>Trust & Credentials is optional. A Guru can be bookable with a polished profile and zero credentials.</p>
      <p>Gurus may add training, insurance, bonding, memberships, or certifications they already have. They can also explore providers if they want to.</p>
      <p>SitGuru reviews submitted information before a highlight appears publicly. SitGuru does not provide the underlying training, insurance, bond, membership, or certification unless a page specifically says so.</p>
      <p>A Guru with no credentials is not shown as missing anything. The public profile simply leaves the section off.</p>
    </CredentialHelpArticle>
  );
}
