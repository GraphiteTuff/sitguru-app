import type { Metadata } from "next";
import PartnersLandingPage from "@/components/partners/PartnersLandingPage";

export const metadata: Metadata = {
  title: "Partner with SitGuru | SitGuru Partner Network",
  description:
    "Partner with SitGuru as a local pet business, wellness pro, community group, brand, or investor. Local stores, groomers, daycares, and more are welcome — not only pet wellness.",
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnerNetworkPage() {
  return <PartnersLandingPage />;
}
