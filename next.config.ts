import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // ← This forces Webpack (stable) instead of Turbopack for builds
  experimental: {
    turbopack: false,   // Disable Turbopack
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdnjs.cloudflare.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;