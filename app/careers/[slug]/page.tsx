import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareerJobDetail } from "@/components/careers/CareerJobDetail";
import { getPublishedCareerJobBySlug } from "@/lib/careers/jobs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedCareerJobBySlug(slug);
  if (!job) {
    return { title: "Role not found | SitGuru Careers" };
  }
  return {
    title: `${job.title} | SitGuru Careers`,
    description: job.summary,
  };
}

export default async function CareerJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getPublishedCareerJobBySlug(slug);
  if (!job) notFound();

  return <CareerJobDetail job={job} />;
}
