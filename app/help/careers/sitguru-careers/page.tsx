import type { Metadata } from "next";
import Link from "next/link";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { careerFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "SitGuru Careers",
  description:
    "How to find and apply for SitGuru company jobs, and how careers differ from Guru or hire-program pathways.",
};

export default function SitGuruCareersHelpPage() {
  return (
    <HelpArticleChrome
      eyebrow="Careers & Internships"
      title="SitGuru careers"
      summary="Use the public careers board for paid company roles. Each listing explains compensation, location, and how to apply."
      backHref="/help/careers"
      backLabel="Back to Careers & Internships"
      jumps={[
        { href: "/careers#open-roles", label: "Open roles" },
        {
          href: "/careers/social-media-community-growth-manager",
          label: "Growth Manager",
        },
        { href: "/help/careers/internship-program", label: "Internship help" },
      ]}
    >
      <HelpFaqList items={careerFaqs} />
      <p className="text-sm font-semibold leading-6 text-slate-600">
        Browse live jobs at{" "}
        <Link href="/careers" className="font-extrabold text-emerald-800 underline">
          sitguru.com/careers
        </Link>
        . Internship questions are covered in{" "}
        <Link
          href="/help/careers/internship-program"
          className="font-extrabold text-emerald-800 underline"
        >
          SitGuru Internship Program
        </Link>
        .
      </p>
    </HelpArticleChrome>
  );
}
