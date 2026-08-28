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
