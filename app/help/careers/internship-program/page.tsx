import type { Metadata } from "next";
import Link from "next/link";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { internshipFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "SitGuru Internship Program",
  description:
    "How the SitGuru internship works: remote project work, school credit, hours, and how students at any college apply.",
};

export default function InternshipProgramHelpPage() {
  return (
    <HelpArticleChrome
      eyebrow="Careers & Internships"
      title="SitGuru Internship Program"
      summary="A remote, project-based educational internship open to students at any college or university whose program approves the experience."
      backHref="/help/careers"
      backLabel="Back to Careers & Internships"
      jumps={[
        {
          href: "/careers/social-media-community-growth-intern",
          label: "Spring 2027 posting",
        },
        { href: "/careers#open-roles", label: "All openings" },
        { href: "/help/careers/sitguru-careers", label: "Company careers" },
      ]}
    >
      <HelpFaqList items={internshipFaqs} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/careers/social-media-community-growth-intern"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-extrabold text-white hover:bg-[#09462c]"
        >
          View internship posting
        </Link>
        <a
          href="mailto:careers@sitguru.com?subject=SitGuru%20internship%20application"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-extrabold text-emerald-950 hover:bg-emerald-50"
        >
          Email careers@sitguru.com
        </a>
      </div>
    </HelpArticleChrome>
  );
}
