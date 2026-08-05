import type { Metadata } from "next";
import PartnersLandingPage from "@/components/partners/PartnersLandingPage";

export const metadata: Metadata = {
  title: "Partner with SitGuru | SitGuru Partner Network",
  description:
    "Partner with SitGuru for pet wellness, community, corporate, and investor growth. Validated partnership requests with Scout, Taco, and Rogue companion support.",
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnerNetworkPage() {
  return <PartnersLandingPage />;
}
