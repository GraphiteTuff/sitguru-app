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
      summary="Already certified? Show it. Curious about training? Explore a provider. Either way, it stays optional."
    >
      <p>Pet CPR and First Aid is optional. SitGuru does not require it to keep a Guru profile or accept bookings.</p>
      <p>
        Interested in Pet CPR & First Aid training? SitGuru Gurus can explore certification options from providers such as American Health Training. Training is completed directly with the provider and is optional. If you already hold a Pet CPR or First Aid credential, you can submit it for review and add it to your Guru profile after verification.
      </p>
      <p>American Health Training provides that training and certification. SitGuru does not issue it, and American Health Training is not an official SitGuru partner.</p>
      <p>Other recognized Pet CPR providers can be submitted too. SitGuru reviews the information you send. Only a verified credential appears on the public profile.</p>
      <p>Add an expiration date only when the certificate itself shows one. SitGuru does not invent an expiration.</p>
    </CredentialHelpArticle>
  );
}
