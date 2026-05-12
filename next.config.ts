import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: ["twentieth-turban-silver.ngrok-free.dev"],
    },
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
};

export default nextConfig;