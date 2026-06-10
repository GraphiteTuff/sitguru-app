import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * Compatibility route for public Guru profile links.
 *
 * Some existing search/profile links point to /gurus/[slug].
 * The active public Guru profile route is /guru/[slug].
 *
 * This file preserves existing work and prevents public profile 404s by
 * forwarding plural /gurus links to the singular /guru route.
 */
export default async function GurusPluralSlugRedirectPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const slug = String(resolvedParams.slug || "").trim();

  redirect(`/guru/${encodeURIComponent(slug)}`);
}