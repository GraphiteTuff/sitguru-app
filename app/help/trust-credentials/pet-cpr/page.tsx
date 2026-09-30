import type { Metadata } from "next";
import { CredentialHelpArticle } from "@/lib/help/credential-articles";

export const metadata: Metadata = {
  title: "Pet CPR & First Aid Certification",
  description: "How optional Pet CPR and First Aid highlights work on SitGuru.",
};

export default function PetCprHelpPage() {
  return (
    <CredentialHelpArticle
      title="Pet CPR & First Aid Certification"
      summary="Add training you already have, or explore a provider if you are curious."
    >
      <p>Pet CPR and First Aid is optional. SitGuru does not require it to keep a Guru profile or accept bookings.</p>
      <p>A Guru can add an existing eligible certificate, including the provider, completion date, and a document or verification link. American Health Training is one training option. Other recognized providers can be added too.</p>
      <p>SitGuru reviews the supporting information. Only a verified credential is shown on the public profile.</p>
    </CredentialHelpArticle>
  );
}
