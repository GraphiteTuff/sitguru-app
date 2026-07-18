import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import CrispWidget from "@/components/CrispWidget";
import RouteShell from "@/components/RouteShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "sans-serif",
  ],
});

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
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "SitGuru | Trusted Pet Care. Simplified.",
    description:
      "Find trusted local Pet Gurus for walks, sitting, boarding, training, and more.",
    url: "https://www.sitguru.com",
    siteName: "SitGuru",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
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
    images: ["/apple-touch-icon.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SitGuru",
  alternateName: ["Sit Guru", "SitGuru Pet Care"],
  url: "https://www.sitguru.com",
  logo: "https://www.sitguru.com/apple-touch-icon.png",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body
        className={`${plusJakartaSans.className} site-shell min-h-screen bg-[#f8fcfd] text-slate-900 antialiased`}
      >
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KVDPHX4W');
          `}
        </Script>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KVDPHX4W"
            height="0"
            width="0"
            title="Google Tag Manager"
            style={{
              display: "none",
              visibility: "hidden",
            }}
          />
        </noscript>

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
        <CrispWidget />
      </body>
    </html>
  );
}