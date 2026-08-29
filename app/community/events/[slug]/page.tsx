import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy detail URL → `/events/[slug]` */
export default async function CommunityEventDetailRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/events/${slug}`);
}
