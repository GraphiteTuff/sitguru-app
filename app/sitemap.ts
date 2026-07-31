import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/config/site";
import {
  allHelpPaths,
  HELP_SEO_CONFIG,
  helpArticlePaths,
  helpHubPaths,
} from "@/lib/help/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppOrigin();
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/find-care`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/become-a-guru`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const helpIndex: MetadataRoute.Sitemap = helpHubPaths().map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: HELP_SEO_CONFIG.changeFrequency,
    priority:
      path === "/help"
        ? HELP_SEO_CONFIG.indexPriority
        : HELP_SEO_CONFIG.hubPriority,
  }));

  const helpArticles: MetadataRoute.Sitemap = helpArticlePaths().map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: HELP_SEO_CONFIG.changeFrequency,
      priority: HELP_SEO_CONFIG.articlePriority,
    }),
  );

  // Deduplicate by URL (hubs + articles + core)
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...core, ...helpIndex, ...helpArticles]) {
    byUrl.set(entry.url, entry);
  }

  // Ensure every help path from the catalog is present
  for (const path of allHelpPaths()) {
    const url = `${baseUrl}${path}`;
    if (!byUrl.has(url)) {
      byUrl.set(url, {
        url,
        lastModified: now,
        changeFrequency: HELP_SEO_CONFIG.changeFrequency,
        priority: HELP_SEO_CONFIG.articlePriority,
      });
    }
  }

  return Array.from(byUrl.values());
}
