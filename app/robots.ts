import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/help", "/help/"],
        disallow: [
          "/admin/",
          "/api/",
          "/guru/walk/",
          "/parent/walk/",
          "/customer/dashboard/",
          "/guru/dashboard/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
