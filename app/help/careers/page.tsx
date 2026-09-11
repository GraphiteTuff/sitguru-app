import type { Metadata } from "next";
import Link from "next/link";
import HelpCategoryHub from "@/components/help/HelpCategoryHub";

export const metadata: Metadata = {
  title: "Careers & Internships",
  description:
    "Find SitGuru company jobs, learn how the Internship Program works, and apply through sitguru.com/careers.",
};

export default function CareersHelpHubPage() {
  return (
    <HelpCategoryHub
      category="Careers & Internships"
      title="Careers & Internships"
      description="Company roles, the SitGuru Internship Program, and how students or job seekers apply."
      lead={
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4">
          <p className="text-sm font-semibold leading-6 text-emerald-950">
            Live openings stay on the careers board. Help articles explain how
            to apply and how internships differ from Guru or Student Hire
            pathways.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/careers#open-roles"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-extrabold text-white hover:bg-[#09462c]"
            >
              Browse open roles
            </Link>
            <a
              href="mailto:careers@sitguru.com?subject=SitGuru%20application"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-extrabold text-emerald-950 hover:bg-emerald-50"
            >
              Email careers@sitguru.com
            </a>
          </div>
        </div>
      }
    />
  );
}
