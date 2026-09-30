import type { Metadata } from "next";
import { VERIFIED_BY_SITGURU_COPY } from "@/lib/credentials/model";
import { CredentialHelpArticle } from "@/lib/help/credential-articles";

export const metadata: Metadata = {
  title: "What Does Verified by SitGuru Mean?",
  description: "How to read a Verified by SitGuru credential.",
};

export default function VerifiedBySitGuruHelpPage() {
  return (
    <CredentialHelpArticle
      title="What does Verified by SitGuru mean?"
      summary="It is a document review, not a promise about every visit."
    >
      <p>{VERIFIED_BY_SITGURU_COPY}</p>
      <p>Verification does not replace a Pet Parent&apos;s own judgment when choosing care.</p>
    </CredentialHelpArticle>
  );
}
