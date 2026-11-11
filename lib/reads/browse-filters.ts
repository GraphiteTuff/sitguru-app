import type { ReadsContentDetail } from "./types";

export function filterBySegment(
  items: ReadsContentDetail[],
  segment?: string,
): ReadsContentDetail[] {
  if (!segment) return items;
  const needle = segment.toLowerCase();

  return items.filter((item) => {
    if (needle === "original") {
      return Boolean(item.podcast?.is_sitguru_original);
    }
    if (
      needle === "veterinarian" ||
      needle === "trainer" ||
      needle === "author"
    ) {
      return (item.person?.person_type || "").toLowerCase() === needle;
    }
    if (needle === "dog" || needle === "cat" || needle === "health" || needle === "training") {
      const pubType = (item.publication?.publication_type || "").toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase());
      const blob = `${item.title} ${item.description || ""} ${item.editorial_summary || ""}`.toLowerCase();
      if (needle === "dog") {
        return pubType === "dog" || tags.includes("dogs") || blob.includes("dog");
      }
      if (needle === "cat") {
        return pubType === "cat" || tags.includes("cats") || blob.includes("cat");
      }
      if (needle === "health") {
        return (
          pubType === "health" ||
          tags.includes("health") ||
          blob.includes("wellness") ||
          blob.includes("health")
        );
      }
      return (
        pubType === "training" ||
        tags.includes("training") ||
        blob.includes("training") ||
        blob.includes("behavior")
      );
    }
    return true;
  });
}

export function featuredFirst(items: ReadsContentDetail[]) {
  return [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
}
