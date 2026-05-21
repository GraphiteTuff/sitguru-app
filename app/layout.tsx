import type { Metadata } from "next";
import "./globals.css";
import RouteShell from "@/components/RouteShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sitguru.com"),
  title: {
    default: "SitGuru | Trusted Pet Care. Simplified.",
    template: "%s | SitGuru",
  },
  description:
    "SitGuru helps Pet Parents find trusted local Gurus for walks, sitting, boarding, training, and more.",
  applicationName: "SitGuru",
  keywords: [
    "SitGuru",
    "Sit Guru",
    "pet care",
    "pet sitting",
    "dog walking",
    "dog boarding",
    "pet boarding",
    "pet training",
    "local pet care",
    "Pet Parents",
    "Pet Gurus",
  ],
  verification: {
    other: {
      "msvalidate.01": "E2D4A6BA4828D74F5635B3779223975A",
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "SitGuru | Trusted Pet Care. Simplified.",
    description:
      "Find trusted local Pet Gurus for walks, sitting, boarding, training, and more.",
    url: "https://www.sitguru.com",
    siteName: "SitGuru",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "SitGuru logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SitGuru | Trusted Pet Care. Simplified.",
    description:
      "Find trusted local Pet Gurus for walks, sitting, boarding, training, and more.",
    images: ["/icon.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SitGuru",
  alternateName: ["Sit Guru", "SitGuru Pet Care"],
  url: "https://www.sitguru.com",
  logo: "https://www.sitguru.com/icon.png",
  description:
    "SitGuru helps Pet Parents find trusted local Gurus for walks, sitting, boarding, training, and more.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SitGuru",
  alternateName: ["Sit Guru", "SitGuru Pet Care"],
  url: "https://www.sitguru.com",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="site-shell min-h-screen bg-[#f8fcfd] text-slate-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}