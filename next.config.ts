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
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      // Google / SerpApi discovery thumbnails (tbn0–tbn3 + archived serpapi hosts)
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn1.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn2.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn3.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "serpapi.com",
        port: "",
        pathname: "/**",
      },
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
      {
        source: "/community",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/community/host",
        destination: "/events/host",
        permanent: true,
      },
      {
        source: "/community/events",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/community/events/:slug",
        destination: "/events/:slug",
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
