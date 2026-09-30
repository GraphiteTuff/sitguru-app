import type { Metadata } from "next";
import { CredentialHelpArticle } from "@/lib/help/credential-articles";

export const metadata: Metadata = {
  title: "Pet-Care Insurance & Bonding",
  description: "Insurance and bonding are separate optional Guru highlights.",
};

export default function InsuranceBondingHelpPage() {
  return (
    <CredentialHelpArticle
      title="Pet-Care Insurance & Bonding"
      summary="Coverage and bonding are different, and both are optional."
    >
      <p>Pet-care liability insurance and bonding are not the same thing. A Guru may add either one, both, or neither.</p>
      <p>SitGuru can review current coverage or bond documentation. Policy numbers, bond numbers, and uploaded documents stay private. Pet Parents see a short verified highlight, such as current coverage and the month it remains valid.</p>
      <p>When a dated credential expires, it stops appearing as current. The Guru profile stays available, and the Guru can upload renewed information.</p>
      <p>SitGuru is not the insurer or the bonding company.</p>
    </CredentialHelpArticle>
  );
}
