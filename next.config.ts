import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Helps with Leaflet marker issues in development

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdnjs.cloudflare.com",
      },
      // Add more if you use other external image hosts (e.g., Supabase storage)
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Optional: Improve Leaflet compatibility
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      leaflet: "leaflet",
    };
    return config;
  },
};

export default nextConfig;