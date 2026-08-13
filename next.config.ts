import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["twentieth-turban-silver.ngrok-free.dev"],

  experimental: {
    serverActions: {
      bodySizeLimit: "600mb",
    },
  },

  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mmtjhxnzuglbyumbsjhs.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/help-center",
        destination: "/help",
        permanent: true,
      },
      {
        source: "/help-center/:path*",
        destination: "/help",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Hardening headers for scanners / ISP reputation filters.
        // Keep COOP/COEP off so Stripe / PayPal / Plaid popups keep working.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/help/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
